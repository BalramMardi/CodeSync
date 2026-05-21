import { Schema, model } from "mongoose";

const ttlTime = parseInt(process.env.TTL_TIME) || 10;
const ttlMilliseconds = ttlTime * 24 * 60 * 60 * 1000;

const DocumentSchema = new Schema({
  _id: String,
  content: Object,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + ttlMilliseconds)
  }
});

DocumentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default model("Document", DocumentSchema);