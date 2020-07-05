require('isomorphic-fetch');
require('dotenv').config();
require('module-alias/register');
const Koa = require('koa');
const next = require('next');
const mysql = require('mysql');
const { default: createShopifyAuth } = require('@shopify/koa-shopify-auth');
const { verifyRequest } = require('@shopify/koa-shopify-auth');
const session = require('koa-session');
const cors = require('@koa/cors');
const Router = require('koa-router');
const serve = require('koa-static');
const bodyParser = require('koa-body');
const { default: graphQLProxy } = require('@shopify/koa-shopify-graphql-proxy');
const { ApiVersion } = require('@shopify/koa-shopify-graphql-proxy');
const {receiveWebhook, registerWebhook} = require('@shopify/koa-shopify-webhooks')

var dbConn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

dbConn.connect(function(err) {
  if (err) throw err;
  console.log('> Connected to mysql server');
});
global.db = dbConn;

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY, HOST } = process.env;

app.prepare().then(() => {
  const server = new Koa();
  server.context.db = dbConn;
  server.use(session({ secure: true, sameSite: 'none' }, server));
  server.keys = [SHOPIFY_API_SECRET_KEY];

  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ['read_products', 'write_products'],
      accessMode: 'offline',
      async afterAuth(ctx) {
        const { shop, accessToken } = ctx.session;
        ctx.cookies.set('shopOrigin', shop, {
          httpOnly: false,
          secure: true,
          sameSite: 'none'
        });

        const registration = await registerWebhook({
          address: `${HOST}/webhooks/products/create`,
          topic: 'PRODUCTS_CREATE',
          accessToken,
          shop,
          apiVersion: ApiVersion.July20
        });

        if (registration.success) {
          console.log('> Webhook Registered!');
        } else {
          console.log('> Webhook registration failed!', registration.result);
        }

        console.log('> Authenticated: ' + shop + ' - ' + accessToken);
        const shopModel = require('@models/shops');
        shopModel.addShop(shop, accessToken);
        ctx.redirect('https://'+shop+'/admin/apps');
      },
    }),
  );

  server.use(graphQLProxy({version: ApiVersion.July20}))
  server.use(serve('./public'));
  server.use(cors());
  server.use(bodyParser());

  const router = new Router();
  const apiRouter = require('@routes/api');
  const webhook = receiveWebhook({secret: SHOPIFY_API_SECRET_KEY});
  const webhookRouter = require('@routes/webhook')(webhook);

  router.all('/(.*)', verifyRequest(), async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });

  server.use(apiRouter.routes());
  server.use(apiRouter.allowedMethods());
  server.use(webhookRouter.routes());
  server.use(webhookRouter.allowedMethods());
  server.use(router.routes());
  server.use(router.allowedMethods());

  server.listen(port, () => {
    console.log(`> Server started on port: ${port}`);
  });
});