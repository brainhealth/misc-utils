import { default as axios } from 'axios';
import { S3Client } from '@aws-sdk/client-s3';
import { PassThrough } from 'stream';

const s3 = new S3Client();

const bucket = process.env.BUCKET_NAME;
const key = 'new UUID';

const handleSuccess = (data) => {
  return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
}

const handleError = (error) => {
  console.error(error);
  return {
    statusCode: 504,
    body: JSON.stringify(error.message)
  }
}

const uploadToS3 = async (url, bucket, key) => {
  try {
    const stream = await axios.get(url, { responseType: "stream" });

    const passThrough = new PassThrough();

    const response = s3.upload({ Bucket: bucket, Key: key, Body: passThrough });

    stream.data.pipe(passThrough);

    return response
      .then(handleSuccess)
      .catch(handleError);
  } catch (error) {
    handleError(error);
  }
};


export const handler = async(event) => {

  console.log(event);
  const url = event.url;

  //const response = await uploadToS3(url, bucket, key);
  response = handleSuccess(event);
  return response;
};
