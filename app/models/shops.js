const basefunc = require('@libs/basefunc');

export const addShop = (shop, accessToken) => {
  findByName(shop)
    .then((shopData) => {
      if(shopData) {
        updateShop(shop, accessToken);
        return;
      }
      shopData = {
        shop_origin: shop,
        access_token: accessToken,
        added_time: basefunc.getCurrentTimestamp()
      };
      var query = "INSERT INTO shops SET ?";
      return new Promise((resolve, reject) => {
        db.query(query, shopData, (err, result) => {
          if(err)
            return reject(err);
          return resolve(result);
        });
      });
    });
}

export const findByName = (shop) => {
  var query = "SELECT * FROM shops WHERE shop_origin = ?";
  return new Promise((resolve, reject) => {
    db.query(query, shop, (err, result) => {
      if(err)
        return reject(err);
      if(result.length > 0)
        return resolve(result[0]);
      else
        return resolve(null);
    });
  });
}

export const updateShop = (shop, accessToken) => {
  var query = "UPDATE shops SET access_token = ? WHERE shop_origin = ?";
  return new Promise((resolve, reject) => {
    db.query(query, [accessToken, shop], (err, result) => {
      if(err)
        return reject(err);
      return resolve(result);
    });
  });
}