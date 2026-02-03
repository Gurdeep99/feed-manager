import mongoose from "mongoose";

const ProviderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  label: { type: String, default: "" },

  name: String,

  method: String, // GET or POST
  url: String,

  headers: Object,
  params: Object,
  body: Object
}, { timestamps: true });

export default mongoose.models.Provider ||
  mongoose.model("Provider", ProviderSchema);
