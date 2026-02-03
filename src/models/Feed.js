import mongoose from "mongoose";

const FeedSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    property: { type: String, required: true },
    route: { type: String, required: true },

    // Provider for fetching dynamic items
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
    responseKeyPath: { type: String, default: "" }, // e.g., "shorts_list" or "data"

    // Static feed metadata
    feedMeta: {
      feedId: { type: Number },
      feedVersionId: { type: Number },
      userId: { type: String },
      sessionId: { type: String },
      pageId: { type: String },
      pageNo: { type: Number, default: 1 },
      feedTitle: { type: String, default: null },
    },

    // Item template - how to transform each item from provider
    itemTemplate: {
      componentId: { type: Number, default: 108 },
      contentProvider: { type: Number, default: 1 },
      contentType: { type: String, default: "video" },
      // Field mappings: { outputField: "{{inputField}}" }
      dataMapTemplate: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // Ad configuration
    adConfig: {
      enabled: { type: Boolean, default: false },
      positions: [{ type: Number }], // e.g., [4, 8, 12, 16, 20]
      componentId: { type: Number, default: 12 },
      contentProvider: { type: Number, default: 4 },
      adContent: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    // Interstitial ads
    interstitialAds: { type: mongoose.Schema.Types.Mixed, default: null },

    // Sticky ads
    stickyAds: { type: mongoose.Schema.Types.Mixed, default: null },

    // GA Events
    gaEvents: { type: mongoose.Schema.Types.Mixed, default: null },

    // Pagination
    pagination: {
      skipParam: { type: String, default: "skip" },
      limitParam: { type: String, default: "limit" },
      defaultLimit: { type: Number, default: 20 },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound unique index
FeedSchema.index({ userId: 1, property: 1, route: 1 }, { unique: true });

export default mongoose.models.Feed || mongoose.model("Feed", FeedSchema);
