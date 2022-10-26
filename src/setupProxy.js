const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');

const onError = function (err, req, res) {
    console.log('Something went wrong.');
    console.log('And we are reporting a custom error message.');
  };

const reStream = (proxyReq, req) => {
    if (!isEmpty(req.body)) {

        var bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
};

module.exports = (app) => {
    fs.readFile('proxy.conf.json', (err, data) => {
      if (err) throw err;
      const config = JSON.parse(data);
      
      Object.keys(config).forEach(addr => {
        
        const data = {
          ...config[addr], error: onError, onProxyReq: (config["onProxyReq"] ? reStream : null)
        };

        const middleware = createProxyMiddleware(data);
        app.use(addr, middleware)
      })
    });
};
