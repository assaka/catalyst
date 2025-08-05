const helloWorldTemplate = require('./hello-world');
const bannerTemplate = require('./banner');
const socialTemplate = require('./social');
const analyticsTemplate = require('./analytics');
const customTemplate = require('./custom');

module.exports = {
  'hello-world': helloWorldTemplate,
  'banner': bannerTemplate,
  'social': socialTemplate,
  'analytics': analyticsTemplate,
  'custom': customTemplate
};