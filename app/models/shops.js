const basefunc = require('@libs/basefunc');

module.exports = {
  addShop: function(shop, accessToken) {
    this.findShopByName(shop)
      .then((shopData) => {
        if(shopData) {
          this.updateShop(shop, accessToken);
          return;
        }
        shopData = {
          shop_origin: shop,
          access_token: accessToken,
          added_time: basefunc.getCurrentTimestamp()
        };
        var query = "INSERT INTO shops SET ?";
        return new Promise(function(resolve, reject) {
          db.query(query, shopData, function(err, result) {
            if(err)
              return reject(err);
            return resolve(result);
          });
        });
      });
  },
  findShopByName: function(shop) {
    var query = "SELECT * FROM shops WHERE shop_origin = ?";
    return new Promise(function(resolve, reject) {
      db.query(query, shop, function(err, result) {
        if(err)
          return reject(err);
        if(result.length > 0)
          return resolve(result[0]);
        else
          return resolve(null);
      });
    });
  },
  updateShop: function(shop, accessToken) {
    var query = "UPDATE shops SET access_token = ? WHERE shop_origin = ?";
    return new Promise(function(resolve, reject) {
      db.query(query, [accessToken, shop], function(err, result) {
        if(err)
          return reject(err);
        return resolve(result);
      });
    });
  }
};