import mongoose from "mongoose";

const ProviderSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,

  name: String,

  method: String, // GET or POST
  url: String,

  headers: Object,
  params: Object,
  body: Object
}, { timestamps: true });

export default mongoose.models.Provider ||
  mongoose.model("Provider", ProviderSchema);
