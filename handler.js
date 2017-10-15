'use strict';

const Alexa = require('alexa-sdk');
// Opearlo Analytics
var OpearloAnalytics = require('opearlo-analytics');

// Constants
var constants = require('./constants/constants');

module.exports.legislators_contact_info = (event, context, callback) => {
  var alexa = Alexa.handler(event, context);
  alexa.appId = constants.appId;

  // Opearlo Alexa Skill Analytics - (https://analytics.opearlo.com/) 
  // Opearlo Analytics - Initialise
  if(event.session.new) {
    OpearloAnalytics.initializeAnalytics(process.env.OPEARLO_USER_ID, process.env.OPEARLO_VOICE_APP_NAME, event.session);
  }

  // Opearlo Analytics - Track Launch Request
  if(event.request.type === "LaunchRequest") {
    OpearloAnalytics.registerVoiceEvent(event.session.user.userId, "LaunchRequest");
  }

  // Opearlo Analytics - Track All Intents
  if(event.request.type === "IntentRequest") {
    OpearloAnalytics.registerVoiceEvent(event.session.user.userId, "IntentRequest", event.request.intent);
  }

  alexa.registerHandlers(
    require("./legislators")
  );
  alexa.execute();
}
