import {default as twilio} from 'twilio';

const handleSuccess = (data) => {
  console.log(data);
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'completed',
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

export const handler = async(event) => {

  console.log(event);
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const statusCallback = process.env.STATUS_CALLBACK_URI;
  const client = twilio(accountSid, authToken);


  // retrieved from event
  const roomSid = event.roomSid;
  const uniqueName = event.uniqueName;

  console.log(roomSid ? roomSid : uniqueName)

  let room;
  if (roomSid)
    {
      room = await client.video.v1.rooms(roomSid)
                           .fetch()
                           .catch(handleError);
    }
  else {
    const rooms = await client.video.v1//.rooms(encodeURIComponent(roomSid ? roomSid : uniqueName))
                              .rooms.list({
                                unique_name: uniqueName
                              })
                              .catch(handleError);
    if (rooms.length > 0) {
      room = rooms[0];
    }
  }

  if (!room){
    return handleError('could not find room')
  }
  else if (room?.statusCode) {
    return room;
  }
  else if (room.sid === 'failed') {
    return {
      statusCode: 504,
      body: JSON.stringify({
        status: 'failed'
      })
    };
  }
  else if (room.sid === 'in-progress') {
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
                                   roomSid: roomSid
                                 })
                                 .then(handleSuccess)
                                 .catch(handleError);
    return response;
  }
};
