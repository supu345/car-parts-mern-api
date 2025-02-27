const { Schema, model } = require("mongoose");

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },

    category_slug: {
      type: String,
      required: true,
    },

    articleText: {
      type: String,
      required: true,
    },
    shortText: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    likes: Array,
    unLikes: Array,

    viewer: {
      type: Number,
      default: 0,
    },
    viewerIp: [
      {
        ip: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

module.exports = model("blog", blogSchema);
