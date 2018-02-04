/**
 * This code was derived from: https://github.com/Stephen-X/DynamoDB-CSV-Fast-Import/blob/master/importCSV.js
 * 
 */
'use strict';

const fs = require('fs');
const csvParser = require('csv-parse');
const crypto = require('crypto');
const async = require('async');

const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const dynamo = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

// ** Set up variables here ********************************
const csv_filename = 'legislators-current.csv';
const table_name = 'legislators-contact-info-dev';

// additional properties to be included
const is_dynamic = 'true';
// *********************************************************

const rs = fs.createReadStream(csv_filename);
const parser = csvParser({
    auto_parse: true,
    columns : true,
    delimiter : ','
}, function(err, data) {
    const max_reqs = 25;  // maximum put requests for one batchWrite() allowed by AWS
    let itemSet = {};  // the raw csv dataset contains duplicates; used this as a hash set to detect duplicates
    let jobStack = [];  // a stack of request parameters for batchWrites
    let itemCount = 0;  // total number of items processed
    let duplicateCount = 0;  // total number of duplicate items

    // construct job stack
    while (data.length > 0) {
        // parameter template for batchWrite()
        const params = {
            RequestItems: {
                [table_name]: []
            }
        }
        // extract 25 items from start of data, then create a new job with 25 put requests
        data.splice(0, max_reqs).forEach((item) => {
          let id = item.bioguide_id;
          let hashedId = crypto.createHash('md5').update(id, 'utf8').digest('hex');
            if (!itemSet[hashedId]) {  // this is a new item
                params.RequestItems[table_name].push({
                    PutRequest: {
                        Item: {  // ** Also modify item schema here **********
                            id: item.bioguide_id,
                            leg_last_name: item.last_name,
                            leg_first_name: item.first_name,
                            leg_birthday: item.birthday,
                            leg_gender: item.gender,
                            leg_type: item.type,
                            leg_state: item.state,
                            leg_district: item.district,
                            leg_party: item.party,
                            leg_url: item.url,
                            leg_address: item.address,
                            leg_phone: item.phone,
                            leg_contact_form: item.contact_form,
                            leg_rss_url: item.rss_url,
                            leg_twitter: item.twitter,
                            leg_facebook: item.facebook,
                            leg_youtube: item.youtube,
                            leg_youtube_id: item.youtube_id,
                            leg_bioguide_id: item.bioguide_id,
                            leg_thomas_id: item.thomas_id,
                            leg_opensecrets_id: item.thomas_id,
                            leg_lis_id: item.lis_id,
                            leg_cspan_id: item.cspan_id,
                            leg_govtrack_id: item.govtrack_id,
                            leg_votesmart_id: item.votesmart_id,
                            leg_ballotpedia_id: item.ballotpedia_id,
                            leg_washington_post_id: item.washington_post_id,
                            leg_icpsr_id: item.icpsr_id, 
                            leg_wikipedia_id: item.wikipedia_id,
                            hashedId: hashedId
                        }  // ************************************************
                    }
                });
                itemSet[hashedId] = true;  // add this item to the set
                itemCount++;
            } else {
                duplicateCount++;
                console.log('Duplicate item found');
            }
        });
        jobStack.push(params);  // push this job to the stack
    }

    
    let chunkNo = 0;  // number of each batchWrite operation

    // issue batchWrite() for each job in the stack; use async.js to better handle the asynchronous processing
    async.each(jobStack, (params, callback) => {
        //console.log(JSON.stringify(params), "\n");
        chunkNo++;
        dynamo.batchWrite(params, callback);
        //callback();
    }, (err) => {
        if (err) {
            console.log(`Chunk #${chunkNo} write unsuccessful: ${err.message}`);
        } else {
            console.log('\nImport operation completed! Do double check on DynamoDB for actual number of items stored.');
            console.log(`Total batchWrite requests issued: ${chunkNo}`);
            console.log(`Total valid items processed: ${itemCount}`);
            console.log(`Total number of duplicates in the raw data: ${duplicateCount}`);
        }
    });

});
rs.pipe(parser);  // pipe the file readable stream to configured csv parser
