'use strict';

const AWS = require('aws-sdk');
// Opearlo Analytics
const OpearloAnalytics = require('opearlo-analytics');

const AWSregion = 'us-east-1';
const LEGISLATORS_APP_TABLE_NAME = process.env.DYNAMODB_TABLE;

AWS.config.update({
  region: AWSregion
});

const DEFAULT_REPROMPT = "Who is your legislator? or for instructions, say help.",
    DELAYED_REPROMPT = "<break time='2500ms'/>" + DEFAULT_REPROMPT,
    DEFAULT_STARTOVER_PROMPT = "Which other legislator would you like contact info for? or for instructions, say help.",
    DEFAULT_NOTFOUNDPROMPT = "I'm sorry, I could not understand that Legislators name. Please try again, saying their first and last name.",
    DEFAULT_WELCOMEPROMPT = "Hello, Welcome to the U.S. Legislators info system!. What state are you from?.",
    DEFAULT_NOINTENT = 'Okay, see you next time!'

// The bioguide_id, state and bioguide_data for current congress.
const legislatorsDataSet = require("./data/legislators_data.js");
const StateNameDataSet = require("./data/states_data.js");

// Setup some random goodbyes.
const randomGoodbyes = [
  'Bye for now!',
  'Goodbye!',
  'Thanks for using U.S. Legislators info system!',
  'Okay, see you next time!'
];

// Get Random Goodbye.
const randomGoodbye = randomGoodbyes[Math.floor(Math.random() * randomGoodbyes.length)];

// Setup handlers.
const handlers = {

      'LaunchRequest': function () {
        this.emit('Welcome');
      },

      'Unhandled': function () {
        this.emit('AMAZON.HelpIntent');
      },

      'Welcome': function () {
        let prompt = DEFAULT_WELCOMEPROMPT;
        this.emit(':ask', prompt, DEFAULT_REPROMPT);
      },

      'StartOver': function () {
        let prompt = DEFAULT_STARTOVER_PROMPT;
        this.emit(':ask', prompt);
      },

      //=========================================================================================================================================
      // Legislator: Biographical information.
      //=========================================================================================================================================

      'Bioguide': function () {
        let legislator = this.event.request.intent.slots.LegislatorName.value || false;
        console.log(this.event);
        console.log(this.context);

        if (legislator) {
          this.emit('ReturnBioguide', legislator);
        }
        else {
          let notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
          this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
        }
      },

      'ReturnBioguide': function (legislatorName) {
        let legislator = legislatorName.toLowerCase();
        console.log(this.event);
        console.log(this.context);

        if (legislatorsDataSet.lawmakers.hasOwnProperty(legislator)) {
          let object = legislatorsDataSet.lawmakers[legislator];
          const params = {
            TableName: LEGISLATORS_APP_TABLE_NAME,
            Key:{
             "id": object.bioguide_id
            }
          };

          // Get legislator data from DynamoDB
          readDynamoItem(params, dataSet=>{

              // TODO: Fix on import and remove this

              if (dataSet.Item.leg_type == 'sen') {
              dataSet.Item.leg_type = 'Senator';
              }
              else {
              // deal with rep.
              dataSet.Item.leg_type = 'Representative';
              }

              let BioguideResponse = "The biographical information for " + object.bioguide_data
              BioguideResponse += "The source for this biographical information is bioguide.congress.gov.";

              let LegislatorLargeimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/512x512/" + object.bioguide_id + ".jpg";
              let LegislatorSmallimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/108x108/" + object.bioguide_id + ".jpg";
              // console.log("Image Path: " + LegislatorimageUrlPath);

              let imageObj = {
                smallImageUrl: LegislatorSmallimageUrlPath,
                largeImageUrl: LegislatorLargeimageUrlPath
              };

              this.attributes['handler'] = "ReturnBioguide";
              this.attributes['lawmaker'] = legislator;
              // Set Session Attributes for Context

              let cardTitle = dataSet.Item.leg_type + " " + dataSet.Item.leg_first_name + " " + dataSet.Item.leg_last_name;
              let cardContent = "The biographical information for " + dataSet.Item.leg_first_name + " " + dataSet.Item.leg_last_name + "\n";
              cardContent += "Source URL: http://bioguide.congress.gov/scripts/biodisplay.pl?index=" + object.bioguide_id;

              this.emit(':askWithCard', BioguideResponse, DEFAULT_REPROMPT, cardTitle, cardContent, imageObj);
          });
        }
        else {
          let notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
          this.emit(':ask', notFoundPrompt, DEFAULT_REPROMPT);
        }
      },

      //=========================================================================================================================================
      // Legislator: Contact information.
      //=========================================================================================================================================

      'Legislators': function () {
        const legislator = this.event.request.intent.slots.LegislatorName.value || false;
          console.log(this.event);
          console.log(this.context);

        if (legislator) {
          this.emit('ReturnLegislatorsContactInfo', legislator);
        }
        else {
          let notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
          this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
        }
      },

      'ReturnLegislatorsContactInfo': function (legislatorName) {
          console.log(this.event);
          console.log(this.context);
    
        const legislator = legislatorName.toLowerCase();

        if (legislatorsDataSet.lawmakers.hasOwnProperty(legislator)) {
          const object = legislatorsDataSet.lawmakers[legislator];

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
              let gender_ref = '';

              if (dataSet.Item.leg_gender === 'M') {
                gender_ref = "his";
              }
              else {
                gender_ref = 'her';
              }

              // TODO: Fix on import and remove this
              if (dataSet.Item.leg_party === 'Democrat') {
                dataSet.Item.leg_party = 'Democratic';
              }

              // dataSet.Item.type is either sen or rep
              if (dataSet.Item.leg_type == 'sen') {
                dataSet.Item.leg_type = 'Senator';
              }
              else {
                // deal with rep.
                dataSet.Item.leg_type = 'Representative';
              }

              // If this is a Representative mention their district.
              let district_str = ' ';
              if (dataSet.Item.leg_type === 'Representative') {
                district_str = ", district " + object.district;
              }

            let LegislatorsContactInfoResponse = "The office phone number for "+ dataSet.Item.leg_party + " " + dataSet.Item.leg_type + " " + dataSet.Item.leg_first_name + " " + dataSet.Item.leg_last_name
                LegislatorsContactInfoResponse += " from " + object.state  + "" + district_str
                LegislatorsContactInfoResponse += " is " + dataSet.Item.leg_phone + " and " + gender_ref + " office mailing address is " + dataSet.Item.leg_address
                LegislatorsContactInfoResponse += "<break time='1000ms'/> Would you like to hear the bioguide for " + legislator + "?"

              const LegislatorLargeimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/512x512/" + object.bioguide_id + ".jpg";
              const LegislatorSmallimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/108x108/" + object.bioguide_id + ".jpg";
              // console.log("Image Path: " + LegislatorimageUrlPath);

              const imageObj = {
                  smallImageUrl: LegislatorSmallimageUrlPath,
                  largeImageUrl: LegislatorLargeimageUrlPath
              };

              this.attributes['handler'] = "ReturnLegislatorsContactInfo";
              this.attributes['lawmaker'] = legislator;
              // Set Session Attributes for Context
              this.attributes['NextIntent'] = 'ReturnBioguide';

              const cardTitle = dataSet.Item.leg_type + " " + dataSet.Item.leg_first_name + " " + dataSet.Item.leg_last_name;
              let cardContent = "Phone: " + dataSet.Item.leg_phone + "\n Mailing Address: " + dataSet.Item.leg_address + "\n\n Website: " + dataSet.Item.leg_url + "\n"
              cardContent += "The source for this contact information is @unitedstates https://github.com/unitedstates";
              this.emit(':askWithCard', LegislatorsContactInfoResponse, DEFAULT_REPROMPT, cardTitle, cardContent, imageObj);

          });

        }
        else {
          const notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
          this.emit(':ask', notFoundPrompt, DEFAULT_REPROMPT);
        }
      },

      'MyStateLegislators': function () {
          console.log(this.event);
          console.log(this.context);

          const stateName = this.event.request.intent.slots.StateName.value || false;
          console.log('Statename: ' + stateName);
          let stateAbbrev = StateNameDataSet.states[stateName];
          console.log('MystateLegislators' + JSON.stringify(stateName));

          // Setup our DynamoDB params
          const params = {
            TableName: LEGISLATORS_APP_TABLE_NAME,
            IndexName: 'leg-state-type-index',
            KeyConditionExpression: "#leg_state = :state",
            ExpressionAttributeNames:{
              "#leg_state": "leg_state"
            },
            ExpressionAttributeValues: {
              ":state": stateAbbrev
            }
          };

          let StateLegislatorsResponse = "The following are legislators in " +  stateName + ", "

          // Get legislator data from DynamoDB
          queryDynamoItems(params, dataSet=>{
            console.log("Data: ", JSON.stringify(dataSet));
            dataSet.Items.forEach(function(item) {
                StateLegislatorsResponse += item.leg_first_name + " " + item.leg_last_name + ", "
            });
            StateLegislatorsResponse += " Which would you like to contact?"
            this.emit(':ask', StateLegislatorsResponse, DEFAULT_REPROMPT);
          });

      },

      // YesIntent.
      'AMAZON.YesIntent': function () {
        console.log(this.event);
        console.log(this.context);
        // Get Last Intent from Session Attributes
        const NextIntent = this.attributes['NextIntent'];

        // Last Intent Exists
        if (NextIntent) {
          OpearloAnalytics.registerVoiceEvent(this.event.session.user.userId, "Custom", NextIntent);
          if (NextIntent === 'Welcome') {
            this.emitWithState('Welcome');
          }
          else {
            this.emitWithState(NextIntent, this.attributes['lawmaker']);
          }
        }
        // No NextIntent
        else {
          // Respond with Help Intent
          this.emitWithState('AMAZON.HelpIntent');
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
        OpearloAnalytics.recordAnalytics(this.event.session.user.userId, process.env.OPEARLO_API_KEY, (result)=> {
            this.emit(':tell', randomGoodbye);
        });
      },

      'AMAZON.StopIntent': function () {
        OpearloAnalytics.recordAnalytics(this.event.session.user.userId, process.env.OPEARLO_API_KEY, (result)=> {
            this.emit(':tell', randomGoodbye);
        });
      },

      'AMAZON.NoIntent': function () {
        // Handle No intent.
        OpearloAnalytics.recordAnalytics(this.event.session.user.userId, process.env.OPEARLO_API_KEY, (result)=> {
            this.emit('StartOver');
        });
      },
      // SessionEndedRequest
      'SessionEndedRequest': function () {
        console.log('SessionEndedRequest.');
      },

      'AMAZON.HelpIntent': function () {
        this.attributes['handler'] = "AMAZON.HelpIntent";
        let HelpIntentPrompt = "Welcome to the U.S Legislators info service. The information here relates to the 115th United States Congress January 3, 2017 thru January 3, 2019"
          HelpIntentPrompt += "<break time='1500ms'/> You can say. Contact information for legislator, Just speak the legislator's firstname and lastname"
          HelpIntentPrompt += "<break time='1500ms'/> or you can say Get bioguide for firstname and lastname"
          HelpIntentPrompt += "<break time='1500ms'/> or you can say cancel, never mind, forget it..."
          HelpIntentPrompt += DELAYED_REPROMPT;

        this.emit(':ask', HelpIntentPrompt, HelpIntentPrompt);
      }

    };

//=========================================================================================================================================
// Helper functions:
// readDynamoItem get legislators data based on id: bioguide_id
//=========================================================================================================================================

function readDynamoItem(params, callback) {

  let AWS = require('aws-sdk');
  AWS.config.update({region: AWSregion});

  let docClient = new AWS.DynamoDB.DocumentClient();

  docClient.get(params, (err, data) => {
      if (err) {
      // Custom Voice Event
      OpearloAnalytics.registerVoiceEvent(this.event.session.user.userId, "Custom", "DynamoDB Read Item Error");
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
      // console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
      callback(data);
      }
      });
}

function queryDynamoItems(params, callback) {

  let AWS = require('aws-sdk');
  AWS.config.update({region: AWSregion});

  let docClient = new AWS.DynamoDB.DocumentClient();

  docClient.query(params, (err, data) => {
      if (err) {
      // Custom Voice Event
      // OpearloAnalytics.registerVoiceEvent(this.event.session.user.userId, "Custom", "DynamoDB Read Item Error");
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
      // console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
      callback(data);
      }
      });
}
module.exports = handlers;
