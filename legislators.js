'use strict';

const AWS = require('aws-sdk');

const AWSregion = 'us-east-1';
const LEGISLATORS_APP_TABLE_NAME = 'current-legislators-dev';

AWS.config.update({
    region: AWSregion
});

var DEFAULT_REPROMPT = "Who is your legislator? or for instructions, please say help, help me or can you help me.",
    DELAYED_REPROMPT = "<break time='2500ms'/>" + DEFAULT_REPROMPT,
    DEFAULT_NOTFOUNDPROMPT = "I'm sorry, I could not understand that Legislators name. Please try again, saying their first and last name.",
    DEFAULT_WELCOMEPROMPT = "Hello, Welcome to the U.S. Legislators info system!. Who is your legislator?.",
    DEFAULT_NOINTENT = 'Okay, see you next time!'

// The bioguide_id, state and bioguide_data for current congress.
var jsonDataSet = require("./legislators_data.js");

// Setup some random goodbyes.
const randomGoodbyes = [
  'Bye for now!',
  'Googdbye!',
  'Thanks for using U.S. Legislators info system!',
  'Chat soon!',
  'Okay, see you next time!'
];

// Get Random Googdbye.
const randomGoodbye = randomGoodbyes[Math.floor(Math.random() * randomGoodbyes.length)];

// Setup handlers.
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
  // Obamacare: How legilsator voted on HR3590.
  //=========================================================================================================================================

    'Obamacare': function () {
      var lawmaker = this.event.request.intent.slots.LegislatorName.value || false;

      if (lawmaker) {
        this.emit('ReturnObamacare', lawmaker);
      }
      else {
        var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
        this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
      }
    },

    'ReturnObamacare': function (legislatorName) {
      var lawmaker = legislatorName.toLowerCase();

      if (jsonDataSet.lawmakers.hasOwnProperty(lawmaker)) {
        var object = jsonDataSet.lawmakers[lawmaker];

        // Setup our DynamoDB params
        const params = {
          TableName: LEGISLATORS_APP_TABLE_NAME,
          Key:{
            "id": object.bioguide_id
          }
        };
        // Get legislator data from DynamoDB
        readDynamoItem(params, dataSet => {
          // console.log("Data: ", JSON.stringify(dataSet));
          var legislatorType = dataSet.Item.type;

        // Send our response.
        var lawmakerPrompt = "Obamacare, is the nickname for the Patient Protection and Affordable Care Act. Obamacare was enacted after being signed by the President on March 23, 2010."
            lawmakerPrompt += "<break time='1000ms'/>Additional important dates are."
            lawmakerPrompt += "<break time='1000ms'/>On September 17, 2009 the bill was introduced in the 111th Congress, On October 8, 2009 it Passed the  House and was sent to the senate. "
            // Only say this if legilsator voted and is a Rep.
            if (legislatorType === "rep") {
                lawmakerPrompt += lawmaker + " voted Yea/Nay."
            }
            lawmakerPrompt += "<break time='1000ms'/>On December 24, 2009 the bill passed the senate with changes and was sent back to the house."
            // Only say this if legilsator voted and is a Sen.
            if (legislatorType === "sen") {
              lawmakerPrompt += lawmaker + " voted Yea/Nay."
            }
            lawmakerPrompt += "<break time='1000ms'/>On March 21, 2010 House Agreed to Changes. "
            // Only say this if legilsator voted and is a Rep.
            if (legislatorType === "rep") {
              lawmakerPrompt += lawmaker + " voted Yea/Nay."
            }
            lawmakerPrompt += "<break time='1000ms'/>On March 23, 2010 H.R. 3590 was Enacted — Signed by the President"
            lawmakerPrompt += "<break time='1000ms'/> You can get additional information if you say <break time='300ms'/> gun control contributions for " + lawmaker + ".";

        this.attributes['handler'] = "ReturnObamacare";
        this.attributes['lawmaker'] = lawmaker;

        var cardTitle = lawmaker.toUpperCase();
        //this.emit(':askWithCard', lawmakerPrompt, DEFAULT_REPROMPT, cardTitle, lawmakerPrompt);
        this.emit(':ask', lawmakerPrompt, DEFAULT_REPROMPT, lawmakerPrompt);

        });

      }
      else {
        var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
        this.emit(':ask', notFoundPrompt, DEFAULT_REPROMPT);
      }
    },

    //=========================================================================================================================================
    // GunControl: What type of contributions are related to gun control.
    //=========================================================================================================================================

      'GunControl': function () {
        var lawmaker = this.event.request.intent.slots.LegislatorName.value || false;

        if (lawmaker) {
          this.emit('ReturnGunControl', lawmaker);
        }
        else {
          var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
          this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
        }
      },

      'ReturnGunControl': function (legislatorName) {
        var lawmaker = legislatorName.toLowerCase();

        if (jsonDataSet.lawmakers.hasOwnProperty(lawmaker)) {
          var object = jsonDataSet.lawmakers[lawmaker];

          var lawmakerPrompt = "The current information we have for " + lawmaker + " in reference to Gun Control is pending.";
              lawmakerPrompt += "<break time='1000ms'/> You can also get additional information if you say <break time='300ms'/>  how did " + lawmaker + " vote on Obamacare.";


          this.attributes['handler'] = "ReturnGunControl";
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
// Legislator: Biographical information.
//=========================================================================================================================================

  'Bioguide': function () {
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

    if (jsonDataSet.lawmakers.hasOwnProperty(lawmaker)) {
      var object = jsonDataSet.lawmakers[lawmaker];

      var lawmakerPrompt = "The biographical information for " + object.bioguide_data
          lawmakerPrompt += "<break time='1000ms'/> You can also get additional information if you say <break time='300ms'/>  how did " + lawmaker  + "  vote on Obamacare.";

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
    var lawmaker = this.event.request.intent.slots.LegislatorName.value || false;

    if (lawmaker) {
      this.emit('ReturnLegislatorsContactInfo', lawmaker);
    }
    else {
      var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
      this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
    }
  },

  'ReturnLegislatorsContactInfo': function (legislatorName) {

    var lawmaker = legislatorName.toLowerCase();

    if (jsonDataSet.lawmakers.hasOwnProperty(lawmaker)) {
      var object = jsonDataSet.lawmakers[lawmaker];

      // Setup our DynamoDB params
      const params = {
        TableName: LEGISLATORS_APP_TABLE_NAME,
        Key:{
          "id": object.bioguide_id
        }
      };

      // Get legislator data from DynamoDB
      readDynamoItem(params, dataSet=>{
        // console.log("Data: ", JSON.stringify(dataSet));

        var gender_ref = '';
        var district_str = '';

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
          // deal with rep.
          dataSet.Item.type = 'Representative';
        }

        // If this is a Representative mention their district.
         if (dataSet.Item.type === 'Representative') {
            district_str += ", district " + object.district;
         }

        var lawmakerPrompt = "The office phone number for "+ dataSet.Item.party + " " + dataSet.Item.type + " " + dataSet.Item.first_name + " " + dataSet.Item.last_name
            lawmakerPrompt += " from " + object.state  + "" + district_str
            lawmakerPrompt += " is " + dataSet.Item.phone + " and " + gender_ref + " office mailing address is " + dataSet.Item.address
            lawmakerPrompt += "<break time='1000ms'/> You can also get additional information if you say <break time='300ms'/> Get bioguide for " + lawmaker
            lawmakerPrompt += "<break time='1000ms'/> if you want to call " + lawmaker + " now you can just say, Alexa dial " + dataSet.Item.phone
            lawmakerPrompt += "<break time='1000ms'/> or say help me.";
        var LegislatorimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/225x275/" + object.bioguide_id + ".jpg";
        console.log("Image Path: " + LegislatorimageUrlPath);

        var imageObj = {
                  smallImageUrl: LegislatorimageUrlPath,
                  largeImageUrl: LegislatorimageUrlPath
            };
        this.attributes['handler'] = "ReturnLegislatorsContactInfo";
        this.attributes['lawmaker'] = lawmaker;

        var cardTitle = lawmaker.toUpperCase();
        this.emit(':askWithCard', lawmakerPrompt, DEFAULT_REPROMPT, cardTitle, lawmakerPrompt, imageObj);

      });

    }
    else {
      var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
      this.emit(':ask', notFoundPrompt, DEFAULT_REPROMPT);
    }
  },

  'AMAZON.RepeatIntent': function () {
    if (this.attributes['handler'] === "ReturnLegislatorsContactInfo") {
      this.emit(this.attributes['handler'], this.attributes['lawmaker']);
    }
    else {
      this.emit(this.attributes['handler']);
    }

    if (this.attributes['handler'] === "AMAZON.HelpIntent") {
      this.emit(this.attributes['handler']);
    }
  },

//=========================================================================================================================================
// AMAZON.buildin intents.
// https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/supported-phrases-to-begin-a-conversation
// CancelIntent cancel, never mind, forget it
// HelpIntent help, help me, can you help me
// NoIntent no, no thanks
// RepeatIntent repeat, say that again, repeat that
// StopIntent stop. off, shut up
// YesIntent yes, yes please, sure
//=========================================================================================================================================

  'AMAZON.CancelIntent': function () {
    this.emit(':tell', randomGoodbye);
  },

  'AMAZON.StopIntent': function () {
    this.emit(':tell', randomGoodbye);
  },

  'AMAZON.NoIntent': function () {
     // Handle No intent.
     this.emit(':tell', randomGoodbye);
   },

  'AMAZON.HelpIntent': function () {
    this.attributes['handler'] = "AMAZON.HelpIntent";
    var prompt = "Welcome to the U.S Legislators info service. The information here relates to the 115th United States Congress January 3, 2017 thru January 3, 2019"
        prompt += "<break time='1500ms'/> You can say. Contact information for legislator, Just speak the legislator's firstname and lastname"
        prompt += "<break time='1500ms'/> or you can say Get bioguide for firstname and lastname"
        prompt += "<break time='1500ms'/> or you can say How did firstname and lastname vote on Obamacare"
        prompt += "<break time='1500ms'/> or you can say Gun control contributions for firstname and lastname"
        prompt += "<break time='1500ms'/> or you can say cancel, never mind, forget it...."
        prompt += DELAYED_REPROMPT;

    this.emit(':ask', prompt, prompt);
  }

};

//=========================================================================================================================================
// Helper functions:
// readDynamoItem get legislators data based on id: bioguide_id
//=========================================================================================================================================

function readDynamoItem(params, callback) {

    var AWS = require('aws-sdk');
    AWS.config.update({region: AWSregion});

    var docClient = new AWS.DynamoDB.DocumentClient();

    docClient.get(params, (err, data) => {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            // console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            callback(data);
        }
    });

}

module.exports = handlers;
