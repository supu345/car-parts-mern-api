const { Schema, model } = require("mongoose");

const blogCategorySchema = new Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },

    categoryImg: {
      type: String,
      required: true,
    },
    categorySlug: {
      type: String,
      required: true,
    },
    categoryDes: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model("blogCategory", blogCategorySchema);
