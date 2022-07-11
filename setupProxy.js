const { createProxyMiddleware } = require('http-proxy-middleware');
const onError = function (err, req, res) {
    console.log('Something went wrong.');
    console.log('And we are reporting a custom error message.');
  };

module.exports = function(app) {
    app.use(
      '/syncsketch',
      createProxyMiddleware({
        target: 'https://syncsketch.com/api/v1',
        changeOrigin: true,
        onError: onError
      })
    );

  app.use(
    '/syncsketch-v2',
    createProxyMiddleware({
      target: 'https://syncsketch.com/api/v2',
      changeOrigin: true,
      onError: onError
    })
  );


};