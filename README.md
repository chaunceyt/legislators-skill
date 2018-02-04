## U.S. Legislators Contact Info Alexa Skill ##

**Name:** U.S. Legislators Info

**Invocation Name:** Alexa, my legislator 

## Why? ##

This work is a result of a demo I attended. It inspired me to create my own Alexa Skill. I decided to take the current U.S. Congress and create a contact info skill.

## Data used to create this skill. ##

Current serving Members of Congress

```
https://github.com/unitedstates/congress-legislators
File: legislators-current
Download: CSV
```
## AWS Services used ##

* API Gateway

* AWS Lambda Node.js 6.10

* DynamoDB

* S3 bucket for legislator images

## Interacting with Skill ##

Alexa legislators contact info

Alexa: Will read "Welcome" asking  "Which legislator are you wanting to contact?"

Consumer: "Mitch McConnell" or "Kirsten Gillibrand" etc...

Consumer: Get Bioguide for "Mitch McConnell" or "Kirsten Gillibrand" etc...

Alexa: will read content from Bioguide

"Mitch McConnell" http://bioguide.congress.gov/scripts/biodisplay.pl?index=M000355

"Kirsten Gillibrand" http://bioguide.congress.gov/scripts/biodisplay.pl?index=G000555

## Interacting with Web API

* /legislators - get all list of all the legislators
* /legislators/{legislatorId} - get this legislator

## Useful Links ##

* GovTravk.us (https://www.govtrack.us)

* OpenSecrets.org (https://www.opensecrets.org/)

* @unitedstates (https://github.com/unitedstates)

* Amazon Developer Portal - (https://developer.amazon.com/alexa)

* AWS Lambda - (https://aws.amazon.com/console/)

* Serverless - (https://serverless.com/)

* AWS CLI - (https://aws.amazon.com/cli/)

* Opearlo Alexa Skill Analytics - (https://analytics.opearlo.com/)

* 11-opearlo-analytics - https://github.com/MerryOscar/voice-devs-lessons/tree/master/11-opearlo-analytics
