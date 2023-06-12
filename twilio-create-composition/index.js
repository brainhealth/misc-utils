import {default as twilio} from 'twilio';

const handleSuccess = (data) => {
  return {
    statusCode: 200,
    body: JSON.stringify(data.sid),
  };
}

const handleError = (error) => {
  console.error(error);
  return {
    statusCode: 504,
    body: JSON.stringify(error)
  }
}

export const handler = async(event) => {

  console.log(event);

  // retrieved from event
  const roomSid = event.roomSid;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const statusCallback = process.env.STATUS_CALLBACK_URI;
  const client = twilio(accountSid, authToken);

  const response = await client.video.v1.compositions
                         .create({
                           videoLayout: {
                             transcode: {
                               video_sources: [
                                 '*'
                               ]
                             }
                           },
                           statusCallback: statusCallback,
                           format: 'mp4',
                           roomSid: roomSid
                         })
                         .then(handleSuccess)
                         .catch(handleError);
  return response;
};

