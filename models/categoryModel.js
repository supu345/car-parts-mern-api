const { Schema, model } = require("mongoose");

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

categorySchema.index(
  {
    name: "text",
  },
  { timestamps: true, versionKey: false }
); //for search

module.exports = model("categorys", categorySchema);
