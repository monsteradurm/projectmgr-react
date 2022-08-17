const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');

const onError = function (err, req, res) {
    console.log('Something went wrong.');
    console.log('And we are reporting a custom error message.');
  };

module.exports = (app) => {
    fs.readFile('proxy.conf.json', (err, data) => {
      if (err) throw err;
      const config = JSON.parse(data);
      
      Object.keys(config).forEach(addr => {
        app.use(addr, createProxyMiddleware({
          ...config[addr], error: onError
        }))
      })
    });
};
