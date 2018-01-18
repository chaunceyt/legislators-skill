# Requirements

* [AWS Developers account](http://developer.amazon.com)
* [AWS Account](https://aws.amazon.com/)
* [Serverless Framework](https://serverless.com/)
* [Opearlo Alexa Skill Analytics](https://analytics.opearlo.com/)

## Installation
**AWScli**

**Create S3 bucket**

```
aws s3 mb s3://BUCKET_NAME/ --region REGION
aws s3api put-bucket-policy --bucket BUCKET_NAME \
	--policy file:///tmp/s3-bucket-policy.json  \
	--region REGION
```
Policy file: `s3-bucket-policy.json`

```
{
  "Version":"2012-10-17",
  "Statement":[{
    "Sid":"PublicReadForGetBucketObjects",
    "Effect":"Allow",
    "Principal": "*",
    "Action":["s3:GetObject"],
    "Resource":["arn:aws:s3:::BUCKET_NAME/*"
    ]
  }
  ]
}
```


**Import data into DynamoDB**

```
aws dynamodb batch-write-item \
	--request-items file://legislators-contact-info-dev.json`
```

Install Skill

```
npm install serverless -g
git clone https://github.com/chaunceyt/legislators-skill.git
cd legislators-skill
npm install
npm install serverless -g
serverless deploy
```
After the completion of the `serverless deploy -y` you should see the ARN for your function. 

## Create Alexa Skill
*  Log into http://developer.amazon.com 
* Navigate to Alexa Skills
* **Create a New Alexa Skill**
	* Skill Type: Custom
	* Language: English (US)
	* Name: U.S. Legislators Info
	* Invocation Name: my legislator
	* Click Next
* **Interaction Model**
	* Instance Schema (speechAssets/intentSchema.json)
	* Custom Slot Types 
	* Type: LIST_LEGISTATORS
	* Value: speechAssets/LIST_LEGISLATORS.txt (copy this content into input field)
	* Click Next
* **Configuration**
	* Select AWS Lambda ARN (Amazon Resource Name)
	* Enter the arn for lambda script
	* Accept defaults for everything else.
	* Click Next
* **Test**
	* Voice Simulator "_Hear how Alexa will speak a response entered in plain text or SSML_"	
	* Service Simulator - the EventSource for the Lambda function.
* **Publishing Information**
* **Privacy & Compliance**

