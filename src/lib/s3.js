import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 is S3-compatible
const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function putObject(bucket, key, body, contentType = "application/json") {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return s3Client.send(command);
}

export async function getObject(bucket, key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const response = await s3Client.send(command);
  // Convert stream to string
  const str = await response.Body.transformToString();
  return str;
}

export { s3Client };
