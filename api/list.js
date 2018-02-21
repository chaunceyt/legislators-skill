'use strict';

const AWS = require('aws-sdk'); 

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const params = {
  TableName: process.env.DYNAMODB_TABLE,
  ReturnConsumedCapacity: 'TOTAL',
};

module.exports.list = (event, context, callback) => {
  console.log(context);
  console.log(event);

  // fetch all legislators from the database
  // This could be an expensive action. However, we only have less than 600 items.
  dynamoDb.scan(params, (error, result) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(null, {
        statusCode: error.statusCode || 501,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Couldn\'t fetch the legislators.',
      });
      return;
    }
 
    console.log(null, result);

    // create a response
    // body: JSON.stringify(result.Items),
    const response = {
      statusCode: 200,
      body: result.Items,
    };
    callback(null, response);
  });
};
