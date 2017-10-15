'use strict';

const AWS = require('aws-sdk');
// Opearlo Analytics
var OpearloAnalytics = require('opearlo-analytics');

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
var legislatorsDataSet = require("./data/legislators_data.js");
var currentGunContributionDataSet = require("./data/legislators_gun_money_contributions.js");
var careerGunContrbutionDataSet = require("./data/legislators_gun_money_contributions_career.js");
var currentNraContributionDataSet = require("./data/legislators_nra_contribution.js");

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
      var legislator = this.event.request.intent.slots.LegislatorName.value || false;

      if (legislator) {
        this.emit('ReturnObamacare', legislator);
      }
      else {
        var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
        this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
      }
    },

    'ReturnObamacare': function (legislatorName) {
      var legislator = legislatorName.toLowerCase();

      if (legislatorsDataSet.lawmakers.hasOwnProperty(legislator)) {
        var object = legislatorsDataSet.lawmakers[legislator];

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
        var ObamacareResponse = "Obamacare, is the nickname for the Patient Protection and Affordable Care Act. Obamacare was enacted after being signed by the President on March 23, 2010."
            ObamacareResponse += "<break time='1000ms'/>Additional important dates are."
            ObamacareResponse += "<break time='1000ms'/>On September 17, 2009 the bill was introduced in the 111th Congress, On October 8, 2009 it Passed the  House and was sent to the senate. "
            // Only say this if legilsator voted and is a Rep.
            if (legislatorType === "rep") {
                ObamacareResponse += legislator + " voted Yea/Nay."
            }
            ObamacareResponse += "<break time='1000ms'/>On December 24, 2009 the bill passed the senate with changes and was sent back to the house."
            // Only say this if legilsator voted and is a Sen.
            if (legislatorType === "sen") {
              ObamacareResponse += legislator + " voted Yea/Nay."
            }
            ObamacareResponse += "<break time='1000ms'/>On March 21, 2010 House Agreed to Changes. "
            // Only say this if legilsator voted and is a Rep.
            if (legislatorType === "rep") {
              ObamacareResponse += legislator + " voted Yea/Nay."
            }
            ObamacareResponse += "<break time='1000ms'/>On March 23, 2010 H.R. 3590 was Enacted — Signed by the President"
            ObamacareResponse += "<break time='1000ms'/> You can get additional information if you say <break time='300ms'/> gun control contributions for " + legislator + ".";

            var LegislatorLargeimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/512x512/" + object.bioguide_id + ".jpg";
            var LegislatorSmallimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/108x108/" + object.bioguide_id + ".jpg";
            // console.log("Image Path: " + LegislatorimageUrlPath);

            var imageObj = {
              smallImageUrl: LegislatorSmallimageUrlPath,
              largeImageUrl: LegislatorLargeimageUrlPath
            };
        this.attributes['handler'] = "ReturnObamacare";
        this.attributes['lawmaker'] = legislator;

        var cardTitle = legislator.toUpperCase();
        var cardContent = legislator + "'s stance on Obamacare";
        this.emit(':askWithCard', ObamacareResponse, DEFAULT_REPROMPT, cardTitle, cardContent, imageObj);

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
        var legislator = this.event.request.intent.slots.LegislatorName.value || false;

        if (legislator) {
          this.emit('ReturnGunControl', legislator);
        }
        else {
          var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
          this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
        }
      },

      'ReturnGunControl': function (legislatorName) {
        var legislator = legislatorName.toLowerCase();

        if (legislatorsDataSet.lawmakers.hasOwnProperty(legislator)) {
          var object = legislatorsDataSet.lawmakers[legislator];
          // Setup our DynamoDB params
          // Move this into a function.
          const params = {
            TableName: LEGISLATORS_APP_TABLE_NAME,
            Key:{
              "id": object.bioguide_id
            }
          };
          // Get legislator data from DynamoDB
          readDynamoItem(params, dataSet=>{

            var gender_ref = '';

            if (dataSet.Item.gender === 'M') {
              gender_ref = "his";
            }
            else {
              gender_ref = 'her';
            }

            // console.log("Data: ", JSON.stringify(dataSet));
            var currentGunContribution = currentGunContributionDataSet.gun_money_contributions[dataSet.Item.opensecrets_id];
            var careerGunControlContribution = careerGunContrbutionDataSet.gun_money_contributions_career[dataSet.Item.opensecrets_id];
            var currentNraContribution = currentNraContributionDataSet.nra_contributions[dataSet.Item.opensecrets_id];
            // console.log("Data: ", JSON.stringify(currentNraContribution));
            // console.log("dataSet.Item.opensecrets_id" + dataSet.Item.opensecrets_id + "DataSet" + currentGunContrbutionDataSet.gun_money_contributions[dataSet.Item.opensecrets_id]);
            // console.log("Data: ", JSON.stringify(currentGunContribution));
            //console.log("GunControlResponse: " + currentGunContribution);
            var GunControlResponse = legislator + " contrubutions for the 115 Congress based on the following categories."
                GunControlResponse += "<break time='1000ms'/> Gun related contributions in 2016 to " + legislator + " <break time='500ms'/>,  Gun related contributions for " + gender_ref + " career and all NRA contributions."
                GunControlResponse += "<break time='1000ms'/> each section has six categories within it."
                GunControlResponse += "<break time='1500ms'/> " + legislator + "'s contributions for the 2016."
                GunControlResponse += "<break time='1000ms'/> PACS for Gun Control, total " + currentGunContribution.pacs_total_from_gun_control
                GunControlResponse += "<break time='1000ms'/> PACS for Gun Rights, total " + currentGunContribution.pacs_total_from_gun_rights
                GunControlResponse += "<break time='1000ms'/> those who support gun control, total " + currentGunContribution.gun_control_support
                GunControlResponse += "<break time='1000ms'/> those who oppose gun control, total " + currentGunContribution.gun_control_opposed
                GunControlResponse += "<break time='1000ms'/> those who support gun rights, total " + currentGunContribution.gun_rights_support
                GunControlResponse += "<break time='1000ms'/> and those who oppose gun rights, total  " + currentGunContribution.gun_rights_opposed
                GunControlResponse += "<break time='1500ms'/> The career contributions for " + legislator + "."
                GunControlResponse += "<break time='1000ms'/> PACS for Gun Control, total " + careerGunControlContribution.pacs_total_from_gun_control
                GunControlResponse += "<break time='1000ms'/> PACS for Gun Rights, total " + careerGunControlContribution.pacs_total_from_gun_rights
                GunControlResponse += "<break time='1000ms'/> those who support gun control, total " + careerGunControlContribution.gun_control_support
                GunControlResponse += "<break time='1000ms'/> those who oppose gun control, total " + careerGunControlContribution.gun_control_opposed
                GunControlResponse += "<break time='1000ms'/> those who support gun rights, total " + careerGunControlContribution.gun_rights_support
                GunControlResponse += "<break time='1000ms'/> and those who oppose gun rights, total  " + careerGunControlContribution.gun_rights_opposed
                GunControlResponse += "<break time='1500ms'/> NRA related contributions for " + legislator + "."
                GunControlResponse += "<break time='1000ms'/> NRA Direct Support, total  " + currentNraContribution.nra_direct_support
                GunControlResponse += "<break time='1000ms'/> NRA Independent Support, total  " + currentNraContribution.nra_independent_support
                GunControlResponse += "<break time='1000ms'/> NRA Independent Opposition, total  " + currentNraContribution.nra_independent_opposition
                GunControlResponse += "<break time='1000ms'/> NRA Indep Expend for Opponent, total  " + currentNraContribution.nra_indep_expend_for_opponent
                GunControlResponse += "<break time='1000ms'/> and NRA Indep Expend against opponent, total  " + currentNraContribution.nra_indep_expend_against_oppenent
                GunControlResponse += "<break time='1000ms'/> with a Grand Total of " + currentNraContribution.nra_grand_total
                //GunControlResponse += "<break time='1000ms'/> Rank, total  " + currentNraContribution.rank


                GunControlResponse += "<break time='1500ms'/> The source for this information on " + legislator + " is from OpenSecrets.org"
                GunControlResponse += "<break time='1000ms'/> You can get additional information by saying, Obamacare and " + legislator;
                // Move this to a function need to stay DRY.
                var LegislatorLargeimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/512x512/" + object.bioguide_id + ".jpg";
                var LegislatorSmallimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/108x108/" + object.bioguide_id + ".jpg";
                // console.log("Image Path: " + LegislatorimageUrlPath);

                var imageObj = {
                  smallImageUrl: LegislatorSmallimageUrlPath,
                  largeImageUrl: LegislatorLargeimageUrlPath
                };

           this.attributes['handler'] = "ReturnGunControl";
           this.attributes['lawmaker'] = legislator;

           var cardTitle = legislator.toUpperCase();
           var cardContent = "Gun related contributions in 2016 to " + legislator + " and gun related contributions for the career if this legislator."
           this.emit(':askWithCard', GunControlResponse, DEFAULT_REPROMPT, cardTitle, cardContent, imageObj);
          });

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
    var legislator = this.event.request.intent.slots.LegislatorName.value || false;

    if (legislator) {
      this.emit('ReturnBioguide', legislator);
    }
    else {
      var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
      this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
    }
  },

  'ReturnBioguide': function (legislatorName) {
    var legislator = legislatorName.toLowerCase();

    if (legislatorsDataSet.lawmakers.hasOwnProperty(legislator)) {
      var object = legislatorsDataSet.lawmakers[legislator];

      var BioguideResponse = "The biographical information for " + object.bioguide_data
          BioguideResponse += "<break time='1000ms'/> You can also get additional information if you say <break time='300ms'/>  how did " + legislator  + "  vote on Obamacare.";

      var LegislatorLargeimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/512x512/" + object.bioguide_id + ".jpg";
      var LegislatorSmallimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/108x108/" + object.bioguide_id + ".jpg";
      // console.log("Image Path: " + LegislatorimageUrlPath);

      var imageObj = {
        smallImageUrl: LegislatorSmallimageUrlPath,
        largeImageUrl: LegislatorLargeimageUrlPath
      };

      this.attributes['handler'] = "ReturnBioguide";
      this.attributes['lawmaker'] = legislator;

      var cardTitle = legislator.toUpperCase();
      var cardContent = "The biographical information for " + legislator;
      this.emit(':askWithCard', BioguideResponse, DEFAULT_REPROMPT, cardTitle, cardContent, imageObj);

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
    var legislator = this.event.request.intent.slots.LegislatorName.value || false;

    if (legislator) {
      this.emit('ReturnLegislatorsContactInfo', legislator);
    }
    else {
      var notFoundPrompt = DEFAULT_NOTFOUNDPROMPT;
      this.emit(':ask', notFoundPrompt, DELAYED_REPROMPT);
    }
  },

  'ReturnLegislatorsContactInfo': function (legislatorName) {

    var legislator = legislatorName.toLowerCase();

    if (legislatorsDataSet.lawmakers.hasOwnProperty(legislator)) {
      var object = legislatorsDataSet.lawmakers[legislator];

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

        var LegislatorsContactInfoResponse = "The office phone number for "+ dataSet.Item.party + " " + dataSet.Item.type + " " + dataSet.Item.first_name + " " + dataSet.Item.last_name
            LegislatorsContactInfoResponse += " from " + object.state  + "" + district_str
            LegislatorsContactInfoResponse += " is " + dataSet.Item.phone + " and " + gender_ref + " office mailing address is " + dataSet.Item.address
            LegislatorsContactInfoResponse += "<break time='1000ms'/> You can also get additional information if you say <break time='300ms'/> Get bioguide for " + legislator
            // LegislatorsContactInfoResponse += "<break time='1000ms'/> if you want to call " + legislator + " now you can just say, Alexa dial " + dataSet.Item.phone
            LegislatorsContactInfoResponse += "<break time='1000ms'/> or say help me.";

        var LegislatorLargeimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/512x512/" + object.bioguide_id + ".jpg";
        var LegislatorSmallimageUrlPath = "https://s3.amazonaws.com/uslegislators-images/108x108/" + object.bioguide_id + ".jpg";
        // console.log("Image Path: " + LegislatorimageUrlPath);

        var imageObj = {
          smallImageUrl: LegislatorSmallimageUrlPath,
          largeImageUrl: LegislatorLargeimageUrlPath
        };

        this.attributes['handler'] = "ReturnLegislatorsContactInfo";
        this.attributes['lawmaker'] = legislator;

        var cardTitle = dataSet.Item.type + " " + dataSet.Item.first_name + " " + dataSet.Item.last_name;
        var cardContent = "Phone: " + dataSet.Item.phone + "\n Mailing Address: " + dataSet.Item.address + "\n\n Website: " + dataSet.Item.url;
        this.emit(':askWithCard', LegislatorsContactInfoResponse, DEFAULT_REPROMPT, cardTitle, cardContent, imageObj);

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
       this.emit(':tell', randomGoodbye);
     });
   },

  'AMAZON.HelpIntent': function () {
    this.attributes['handler'] = "AMAZON.HelpIntent";
    var HelpIntentPrompt = "Welcome to the U.S Legislators info service. The information here relates to the 115th United States Congress January 3, 2017 thru January 3, 2019"
        HelpIntentPrompt += "<break time='1500ms'/> You can say. Contact information for legislator, Just speak the legislator's firstname and lastname"
        HelpIntentPrompt += "<break time='1500ms'/> or you can say Get bioguide for firstname and lastname"
        HelpIntentPrompt += "<break time='1500ms'/> or you can say How did firstname and lastname vote on Obamacare"
        HelpIntentPrompt += "<break time='1500ms'/> or you can say Gun control contributions for firstname and lastname"
        HelpIntentPrompt += "<break time='1500ms'/> or you can say cancel, never mind, forget it...."
        HelpIntentPrompt += DELAYED_REPROMPT;

    this.emit(':ask', HelpIntentPrompt, HelpIntentPrompt);
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
            // Custom Voice Event
            OpearloAnalytics.registerVoiceEvent(this.event.session.user.userId, "Custom", "DynamoDB Read Item Error");
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            // console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            callback(data);
        }
    });

}

module.exports = handlers;
