'use strict';
const AWSregion = 'us-east-1';
const AWS = require('aws-sdk');

AWS.config.update({
    region: AWSregion
});

var DEFAULT_REPROMPT = "Which legislator are you wanting to contact? or for instructions, please say help me.",
    DELAYED_REPROMPT = "<break time='2500ms'/>" + DEFAULT_REPROMPT,
    DEFAULT_NOTFOUNDPROMPT = "I'm sorry, I could not understand that Legislators name. Please try again, saying their first and last name.",
    DEFAULT_WELCOMEPROMPT = "Hello, Welcome to the U.S. Legislators Contact info system!. Which legislator are you wanting to contact?",
    DEFAULT_NOINTENT = 'Okay, see you next time!'

// The phone number and address of current congress
var jsonDataSet = require("./legislators_data.js");

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

//=========================================================================================================================================
// Legislator: Biographical information.
//=========================================================================================================================================

  'Bioguide': function () {
    console.log("LegislatorName SLOT: " + this.event.request.intent.slots.LegislatorName.value);

    var lawmaker = this.event.request.intent.slots.LegislatorName.value || false;

    if (lawmaker) {
      this.emit('ReturnBioguide', lawmaker);
    }
    else {
      var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
      this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
    }
  },

  'ReturnBioguide': function (legislatorName) {

    var lawmaker = legislatorName.toLowerCase();
    console.log("Legislator Name: " + lawmaker);

    if (jsonDataSet.lawmakers.hasOwnProperty(lawmaker)) {
      var object = jsonDataSet.lawmakers[lawmaker];

      var lawmakerPrompt = "The biographical information for " + object.bioguide_data 

      this.attributes['handler'] = "ReturnBioguide";
      this.attributes['lawmaker'] = lawmaker;

      var cardTitle = lawmaker.toUpperCase();
      this.emit(':askWithCard', lawmakerPrompt, DEFAULT_REPROMPT, cardTitle, lawmakerPrompt);

    }
    else {
      var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
      this.emit(':ask', notFoundPrompt, DEFAULT_REPROMPT);
    }
  },

//=========================================================================================================================================
// Legislator: Contact information.
//=========================================================================================================================================
  'Legislators': function () {
    console.log("LegislatorName SLOT: " + this.event.request.intent.slots.LegislatorName.value);

    var lawmaker = this.event.request.intent.slots.LegislatorName.value || false;

    if (lawmaker) {
      this.emit('ReturnPhoneAddress', lawmaker);
    }
    else {
      var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
      this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
    }
  },

  'ReturnPhoneAddress': function (legislatorName) {

    var lawmaker = legislatorName.toLowerCase();
    console.log("Legislator Name: " + lawmaker);

    if (jsonDataSet.lawmakers.hasOwnProperty(lawmaker)) {
      var object = jsonDataSet.lawmakers[lawmaker];

      // Setup our DynamoDB params
      const params = {
        TableName: 'current-legislators-dev',
        Key:{
          "id": object.bioguide_id
        }
      };

      // Get legislator data from DynamoDB
      readDynamoItem(params, dataSet=>{
        // console.log("Data: ", JSON.stringify(dataSet));

        var gender_ref = '';
        var district_str = '';

        if (dataSet.Item.type === 'Representative') {
          district_str += ", distrist " + dataSet.Item.district;
        }

        if (dataSet.Item.gender === 'M') {
          gender_ref = "his";
        }
        else {
          gender_ref = 'her';
        }

        // TODO: Fix on import and remove this
        if (dataSet.Item.party === 'Democrat') {
          dataSet.Item.party = 'Democratic';
        }
        
        // dataSet.Item.type is either sen or rep
        if (dataSet.Item.type == 'sen') {
          dataSet.Item.type = 'Senator';
        }
        else {
          dataSet.Item.type = 'Representative';
        }

        var lawmakerPrompt = "The office phone number for "+ dataSet.Item.party + " " + dataSet.Item.type + " " + dataSet.Item.first_name + " " + dataSet.Item.last_name 
        lawmakerPrompt += " from " + object.state  + "" + district_str
        lawmakerPrompt += " is " + dataSet.Item.phone + " and " + gender_ref + " office mailing address is " + dataSet.Item.address
        lawmakerPrompt += "<break time='1000ms'/> You can also get additional information if you say <break time='300ms'/> Get bioguide for " + lawmaker
        lawmakerPrompt += "<break time='1000ms'/> or find additional information on WikiPedia by searching for " + dataSet.Item.wikipedia_id;

        this.attributes['handler'] = "ReturnPhoneAddress";
        this.attributes['lawmaker'] = lawmaker;

        var cardTitle = lawmaker.toUpperCase();
        this.emit(':askWithCard', lawmakerPrompt, DEFAULT_REPROMPT, cardTitle, lawmakerPrompt);

      });

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

  'AMAZON.NoIntent': function () {
     // Handle No intent.
     this.emit(':tell', 'Okay, see you next time!');
   },

  'AMAZON.HelpIntent': function () {
    var prompt = "Welcome to the U.S Legislators Contact info service. The information here relates to the 115th United States Congress (January 3, 2017 thru January 3, 2019)."
    prompt += "When asked which legislator are you wanting to contact. Just speak the legislators firstname and lastname"
    prompt += "<break time='1000ms'/> or you can say Get bioguide for firstname and lastname"
    prompt += "<break time='1000ms'/> or you can say exit....";
    prompt += DELAYED_REPROMPT;
    this.emit(':ask', prompt, prompt);
  }

};

function readDynamoItem(params, callback) {

    var AWS = require('aws-sdk');
    AWS.config.update({region: AWSregion});

    var docClient = new AWS.DynamoDB.DocumentClient();

    console.log('reading item from DynamoDB table');

    docClient.get(params, (err, data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));

            callback(data);  // this particular row has an attribute called message

        }
    });

}

module.exports = handlers;