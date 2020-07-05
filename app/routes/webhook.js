const Router = require('koa-router');
const router = new Router({ prefix: '/webhook' });

module.exports = function(webhook) {

  router.post('/product/create', webhook, async (ctx) => {
    console.log('> New product created!');
  });

  return router;
}