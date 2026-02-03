import mongoose from "mongoose";

const ApiHitSchema = new mongoose.Schema({
  apiId: { type: mongoose.Schema.Types.ObjectId, ref: "Api" },
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
}, { timestamps: true });

ApiHitSchema.index({ apiId: 1, timestamp: -1 });

export default mongoose.models.ApiHit || mongoose.model("ApiHit", ApiHitSchema);
