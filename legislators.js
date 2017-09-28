'use strict';

var DEFAULT_REPROMPT = "Which legislator are you wanting to contact?",
    DELAYED_REPROMPT = "<break time='2500ms'/>" + DEFAULT_REPROMPT,
    DEFAULT_NOTFOUNDPROMPT = "I'm sorry, I could not understand that Legislators name. Please try again, saying their first and last name.",
    DEFAULT_WELCOMEPROMPT = "Hello, Welcome to the U.S. Legislators Contact info system!. Which legislator are you wanting to contact?";

// The phone number and address of current congress
var dataSet = require("./legislators_data.js");

// Define the voice handlers
var handlers = {

  'LaunchRequest': function () {
    this.emit('Welcome');
  },

  'Unhandled': function () {
    this.emit('AMAZON.HelpIntent');
  },

  'Welcome': function () {
    var prompt = DEFAULT_WELCOMEPROMPT;
    this.emit(':ask', prompt, DEFAULT_REPROMPT);
  },

  'Legislators': function () {
    console.log("LegislatorName SLOT: " + this.event.request.intent.slots.LegislatorName.value);

    var lawmaker = this.event.request.intent.slots.LegislatorName.value || false;

    if (lawmaker) {
      this.emit('ReturnPhoneAddress', lawmaker);
    }
    else {
      var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
      this.emit(':ask', notFoundPrompt, DEFAULT_REPROMPT);
    }
  },

  'ReturnPhoneAddress': function (legislatorName) {

    var lawmaker = legislatorName.toLowerCase();
    console.log("Legislator Name: " + lawmaker);

    if (dataSet.lawmakers.hasOwnProperty(lawmaker)) {
      var object = dataSet.lawmakers[lawmaker];
      var district_str = '';

      if (object.type === 'Representative') {
        district_str += ", distrist " + object.district;
      }

      var lawmakerPrompt = "The office phone number for "+ object.party + " " + object.type + " " + lawmaker +  " from " + object.state + "" + district_str
        lawmakerPrompt += " is " + object.phone + " and " + object.gender_ref + " office mailing address is " + object.address;

      this.attributes['handler'] = "ReturnPhoneAddress";
      this.attributes['lawmaker'] = lawmaker;

      var cardTitle = lawmaker.toUpperCase();
      this.emit(':askWithCard', lawmakerPrompt, DEFAULT_REPROMPT, cardTitle, lawmakerPrompt);

    }
    else {
      var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
      this.emit(':ask', notFoundPrompt, DEFAULT_REPROMPT);
    }
  },

  'AMAZON.RepeatIntent': function () {
    if (this.attributes['handler'] === "ReturnPhoneAddress") {
      this.emit(this.attributes['handler'], this.attributes['lawmaker']);
    }
    else {
      this.emit(this.attributes['handler']);
    }
  },

  'AMAZON.CancelIntent': function () {
    this.emit(':tell', 'Goodbye!');
  },

  'AMAZON.StopIntent': function () {
    this.emit(':tell', 'Okay, see you next time!');
  },

  'AMAZON.HelpIntent': function () {
    var prompt = "Welcome to the U.S Legislators Contact info service. The information here relates to the 115th United States Congress (January 3, 2017 – January 3, 2019)."
    promt += "When asked which legislator are you wanting to contact. Just speak the legislators firstname and lastname.";
    prompt += DELAYED_REPROMPT;
    this.emit(':ask', prompt, prompt);
  }

};

module.exports = handlers;
