import { default as twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const statusCallback = process.env.STATUS_CALLBACK_URI;
const client = twilio(accountSid, authToken);

const handleSuccess = () => {
  return {
    statusCode: 200,
    body: 'succeeded'
  };
}

const handleError = () => {
  return {
    statusCode: 504,
    body: 'finished with errors'
  }
}

const getComposition = (compositionId) =>
      client.video.v1.compositions(compositionId).fetch();
const getRecordings = (composition) =>
      client.video.v1.recordings.list({
        groupingSid: [composition.roomSid],
        limit: 50
      });

const deleteRecordings = (recordings) =>
      Promise.all(
        recordings.map((recording) =>
          client.video.v1.recordings(recording.sid)
                .remove()
                .catch((error) => {
                  console.log(error);
                  return {'status' : 'failed'};
                })
        )
      );

const checkForErrors = (results) => {
  if (results.filter((result) => result.status == 'failed').length != 0) return {'status' : 'failed'};
  else return {'status' : 'succeeded'};
}

const splitAndGetLast = (string, splitOn) => {
  const vals = string.split(splitOn);
  return vals[vals.length -1];
}

export const handler = async (event) => {
  console.log(event);

  // get object Ids and make sure
  const records = event.Records;
  const compositionIds = records
        .map((record) => record.s3.object.key)
        .map((key) => splitAndGetLast(key, '/'))
        .filter((key) => splitAndGetLast(key, '.') != "txt")
        .map((id) => id.split('.')[0]);

  console.log('compositionIds');
  console.log(compositionIds);


  const results = await Promise.all(
    compositionIds.map((compositionId) =>
      getComposition(compositionId)
        .then(getRecordings)
        .then(deleteRecordings)
        .then(checkForErrors)
        .catch((error) => {
          console.log(error);
          return {'status' : 'failed'};
        })
    )
  ).then(checkForErrors);

  if (results.status == 'succeeded') return handleSuccess();
  else return handleError();
}
