const AWS = require('aws-sdk');
AWS.config.update({region:'us-west-2'});
const sns = new AWS.SNS();
const https = require('https');
const hostname = process.env.SERVER_HOSTNAME;
const topicARN = process.env.SNS_TOPIC_ARN;

exports.handler = (event, context, callback) => {
  let queryName = '';
  let jobId = '';
  let query = '';

  if (event.Records && event.Records[0] && event.Records[0].Sns && event.Records[0].Sns.Message) {
    // In SNS mode
    const data = JSON.parse(event.Records[0].Sns.Message);
    if (data.jobId) {
      jobId = data.jobId;
      queryName = 'processJobId';
      query = `query { ${queryName}(jobId: "${jobId}") }`;
    }
  } else {
    const date = new Date().toGMTString();
    const scheduleDay = date.split(',')[0];
    const scheduleTime = date.split(':')[0].split(' ')[4];
    queryName = 'getJobIdForScheduledTime';
    query = `query { ${queryName}(scheduleDay: "${scheduleDay}" scheduleTime: "${scheduleTime}") }`;
  }

  const body = JSON.stringify({
    operationName: null,
    query,
    variables: {},
  });

  const options = {
    hostname,
    port: 443,
    path: '/graphql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length,
    },
  };

  const req = https.request(options, (res) => {
    const data = [];
    res.on('data', (chunk) => {
      data.push(chunk);
    });
    res.on('end', () => {
      const buffer = Buffer.concat(data);
      if (buffer) {
        const response = JSON.parse(buffer);
        if (response && response.data && response.data[queryName]) {
          const jobId = response.data[queryName];
          if (jobId !== 'done') {
            const params = {
              Message: JSON.stringify({
                default: `jobId: ${jobId}`,
                lambda: JSON.stringify({ jobId }),
              }),
              MessageStructure: 'json',
              TargetArn: topicARN,
            };
            sns.publish(params, function(err, data) {
              if (err) {
                console.error(err, err.stack);
                callback("sns failure");
              } else {
                console.log("sns success", data);
                callback(null, "sns success");
              }
            });
          }
        }
      }
    });
    res.on('error', (e) => {
      console.error(e);
    });
  });

  req.on('error', (e) => {
    console.error(e);
  });
  req.write(body);
  req.end();
};
