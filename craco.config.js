/* craco.config.js */
const path = require(`path`);

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      '@Components': path.resolve(__dirname, 'src/Components'),
      '@Services': path.resolve(__dirname, 'src/Services'),
      '@Helpers': path.resolve(__dirname, 'src/Helpers'),
      '@Environment': path.resolve(__dirname, 'src/Environment'),
      '@Hooks' :path.resolve(__dirname, 'src/Hooks'),
    }
  },
};