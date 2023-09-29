//const TextResponse = require('twilio').twiml.MessagingResponse;
import { default as twilio } from 'twilio';
const MessagingResponse = twilio.twiml.MessagingResponse;

import querystring from 'node:querystring';


export const handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const jsonData = querystring.decode(event.body);
  const ServiceID = jsonData.MessagingServiceSid;

  const response = new MessagingResponse();
  const bodyDict = event.body.split("&").map(kv => kv.split("=")).reduce((m, kv) => {
    m[kv[0]] = kv[1];
    return m;
  }, {"initkey" : "initVal"});

  console.log("bodyDict", bodyDict);
  console.log("message body", bodyDict['Body']);

  if (bodyDict['Body'].toUpperCase().includes("YES") || bodyDict['Body'].toUpperCase().includes("BRAIN")) {
    response.message("You are now opted in to receive event communications from CBH! We're excited to have you on this journey with us! STOP at any time to stop receiving messages.");
  }
  else if (bodyDict['Body'].toUpperCase().includes("STOP")) {
    response.message("You are now opted out of receive event communications from CBH!");
  }

  console.log(response.toString());

  return {
    statusCode: 200,
    //  Uncomment below to enable CORS requests
    //  headers: {
    //      "Access-Control-Allow-Origin": "*",
    //      "Access-Control-Allow-Headers": "*"
    //  },
    headers: {"content-type": "text/xml"},
    body: response.toString(),
  };
}
