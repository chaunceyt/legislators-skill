'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.bystate = (event, context, callback) => {
  console.log(context);
  console.log(event);

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    ReturnConsumedCapacity: 'TOTAL',
    IndexName: 'leg_state-index',
    KeyConditionExpression: 'leg_state = :leg_state',
    ExpressionAttributeValues: {
      ':leg_state': event.state
    },
  };

  // fetch legislator from the database
  dynamoDb.query(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t fetch the legislator item.',
      });
      return;
    }

    console.log(null, result);

    // create a response
    const response = {
      statusCode: 200,
      body: result.Items,
    };
    callback(null, response);
  });
};
