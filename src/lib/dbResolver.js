import DatabaseConfig from "@/models/DatabaseConfig";
import { readMongo } from "@/models/dbMongoReader";
import { readMysql } from "@/models/dbMysqlReader";

export async function resolveDatabase(api) {
  const config = await DatabaseConfig.findById(
    api.dynamicConfig.databaseConfigId
  );

  if (!config) {
    return { error: "Database config not found" };
  }

  const collection = api.dynamicConfig.collection;
  const query = api.dynamicConfig.query || {};

  if (config.type === "MONGODB") {
    return readMongo(config.uri, config.database, collection, query);
  }

  if (config.type === "MYSQL") {
    return readMysql(config.uri, config.database, collection, query);
  }

  return { error: "Unknown database type" };
}
