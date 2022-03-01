This repo is for all Lambda functions needed for Spotlight

spotlight-receipt-automation
----------------------------
This function will hit an endpoint to start a job on a scheduled basis. It will then
use SNS to  step through a response data to request another call. It uses SNS topic
to do an async request flow.

SNS and Lambda are in Oregon (us-west-2) region

A spotlight AWS access key will be needed. Mine is in ~/.aws/credentials and contains
a profile like this:
[spotlight]
aws_access_key_id=<key_id>
aws_secret_access_key=<access_key>

Setup AWS Cli using:
aws configure --profile spotlight
Default region should be us-west-2

To setup a new function with SNS processing:
1. Create a Lambda function (placeholder) with name according to what the Lambda function is doing.
   For example: spotlight-receipt-automation
2. Update Lambda Configuration Timeout to 15 sec (or more depending on speed of API)
3. Setup Lambda env vars as needed
4. Attach policy "AmazonSNSFullAccess" to the new Lambda function Role.
5. Copy index.js & package.json into a new folder.
6. Update package.json and adjust the "deploy" script to use the function endpoint.
7. Create a "Standard" SNS Topic (ex: spotlight-receipt-automation) and subscribe the Lambda function to it.
8. Input the new Topic ARN into the env vars of function.
9. Run npm install and npm run deploy to get your function upload to Lambda (future npm run deploys will update it).
10. Finally, add a Cloudwatch cron trigger at whatever interval makes sense for your
   function (monthly, daily, hourly, etc, ...). Triggering the function without any parameters
   will get it started at the first job.