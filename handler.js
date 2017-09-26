'use strict';

const Alexa = require('alexa-sdk');

module.exports.legislator_phone = (event, context, callback) => {
  var alexa = Alexa.handler(event, context);
  alexa.appId = "your.alexa.appid.should.be.here";
  alexa.registerHandlers(
    require("./legislators")
  );
  alexa.execute();
}
