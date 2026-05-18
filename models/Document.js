import { Schema, model } from "mongoose";

const DocumentSchema = new Schema({
  _id: String,
  content: Object
});

export default model("Document", DocumentSchema);