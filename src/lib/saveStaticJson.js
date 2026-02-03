import { putObject } from "./s3";

export async function saveStaticJson(apiId, json) {
  const key = `static/${apiId}.json`;

  await putObject(
    process.env.R2_BUCKET,
    key,
    JSON.stringify(json),
    "application/json"
  );

  return key;
}
