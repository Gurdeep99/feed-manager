import mongoose from "mongoose";

const ApiSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  label: { type: String, default: "" },
  property: { type: String, required: true },
  route: { type: String, required: true },
  apiType: { type: String, enum: ["STATIC", "DYNAMIC"], required: true },
  method: { type: String, enum: ["GET", "POST"], default: "GET" },
  rotation: { type: Number, default: 1 },
  staticS3Key: String,
  staticResponse: Object,
  dynamicConfig: {
    type: { type: String, enum: ["API", "DATABASE"] },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
    responseKeyPath: String,
    staticData: Object,
    dynamicDataKey: String,
    dynamicDataTemplate: Object,
    databaseConfigId: { type: mongoose.Schema.Types.ObjectId, ref: "DatabaseConfig" },
    collection: String,
    query: Object,
  },
  params: [{ key: String, description: String }],
  bodyKeys: [{ key: String, description: String }],
  hitCount: { type: Number, default: 0 },
}, { timestamps: true });

ApiSchema.index({ property: 1, route: 1 }, { unique: true });

export default mongoose.models.Api || mongoose.model("Api", ApiSchema);
