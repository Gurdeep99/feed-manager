import mongoose from "mongoose";

const DatabaseConfigSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,

  type: String, // MONGODB or MYSQL

  name: String, // display name

  uri: String, // mongodb uri OR mysql connection string

  database: String, // db name (optional for mongo)
}, { timestamps: true });

export default mongoose.models.DatabaseConfig ||
  mongoose.model("DatabaseConfig", DatabaseConfigSchema);
