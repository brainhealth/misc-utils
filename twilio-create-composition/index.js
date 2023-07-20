import { default as twilio } from 'twilio';

const handleSuccess = (data) => {
  console.log(data);
  return {
    statusCode: 201,
    body: JSON.stringify({
      status: 'enqueued',
      compositionJob: data.sid
    }),
  };
}

const handleError = (error) => {
  console.error(error);
  return {
    statusCode: 504,
    body: JSON.stringify({
      status: 'error',
      body: error
    })
  }
}

export const handler = async (event) => {

  console.log(event);
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const statusCallback = process.env.STATUS_CALLBACK_URI;
  const client = twilio(accountSid, authToken);


  // retrieved from event
  const roomSid = event.roomSid;
  const uniqueName = event.uniqueName;

  let room;
  if (roomSid) {
    console.log("retrieving room via roomSid: " + roomSid);
    room = await client.video.v1.rooms(roomSid)
      .fetch()
      .catch(handleError);
  }
  else {
    console.log("retrieving room via uniqueName: " + uniqueName);
    const rooms = await client.video.v1
      .rooms.list({
        unique_name: uniqueName
      })
      .catch(handleError);
    if (rooms.length > 0) {
      room = rooms[0];
    }
  }

  if (!room) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        status: 'room-not-found'
      })
    }
  }
  else if (room?.statusCode) {
    return room;
  }
  else if (room.status === 'failed') {
    return handleError(room);
  }
  else if (room.status === 'in-progress') {
    return {
      statusCode: 425,
      body: JSON.stringify({
        status: 'in-progress'
      })
    };
  }
  else {
    // room status is completed
    const response = await client.video.v1.compositions
      .create({
        audioSources: ['*'],
        videoLayout: {
          grid: {
            video_sources: [
              '*'
            ]
          }
        },
        statusCallback: statusCallback,
        format: 'mp4',
        roomSid: room.sid
      })
      .then(handleSuccess)
      .catch(handleError);
    return response;
  }
};
