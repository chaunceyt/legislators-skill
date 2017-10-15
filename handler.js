'use strict';

const Alexa = require('alexa-sdk');

// Constants
var constants = require('./constants/constants');

module.exports.legislators_contact_info = (event, context, callback) => {
  var alexa = Alexa.handler(event, context);
  alexa.appId = constants.appId;
  alexa.registerHandlers(
    require("./legislators")
  );
  alexa.execute();
}
