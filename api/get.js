'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.get = (event, context, callback) => {
  console.log(event);
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      id: event.legislatorId,
    },
  };

  // fetch legislator from the database
  dynamoDb.get(params, (error, result) => {
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

    // create a response
    const response = {
      statusCode: 200,
      body: result.Item,
    };
    callback(null, response);
  });
};
