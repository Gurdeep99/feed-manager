import mongoose from "mongoose";

export async function readMongo(uri, database, collection, query = {}) {
  const fullUri = database ? `${uri}/${database}` : uri;
  const conn = await mongoose.createConnection(fullUri);

  const data = await conn
    .collection(collection)
    .find(query)
    .toArray();

  await conn.close();
  return data;
}
