const blogcategoryModel = require("../../models/blogCategoryModel");
const blogModel = require("../../models/blogModel");
const Blog = require("../../models/blogModel");
const articleModel = require("../../models/blogModel");
const { responseReturn } = require("../../utiles/response");

module.exports.get_blogcategory = async (req, res) => {
  try {
    // Fetch all tags and categories

    const allCategory = await blogcategoryModel.find({});

    // Return the fetched data
    return res.status(200).json({ allCategory });
  } catch (error) {
    console.error("Error fetching blog categories:", error); // Log the error for debugging
    return res.status(500).json({
      errorMessage: "Internal server error. Please try again later.",
    });
  }
};

const removeHtmlTags = (html) => {
  return html.replace(/<[^>]*>/g, "").trim(); // Strip HTML tags and trim whitespace
};

module.exports.addBlog = async (req, res) => {
  try {
    const { title, slug, category, articleText, image, shortText } = req.body;

    // Clean shortText by removing HTML tags
    const plainShortText = removeHtmlTags(shortText);

    const newBlog = new Blog({
      title,
      slug,
      category,
      category_slug: category,
      image,
      articleText,
      shortText: plainShortText, // Save the cleaned shortText
      viewerIp: { ip: req.ip },
    });

    // Save the article to the database
    await newBlog.save();

    res.status(200).json({
      message: "Blog added successfully",
      blog: newBlog,
    });
  } catch (error) {
    console.error("Error adding blog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports.get_blog = async (req, res) => {
  const { currentPage = 1, searchValue = "" } = req.query;
  const perPage = 6;
  const skipPage = (parseInt(currentPage) - 1) * perPage;

  try {
    // Initialize the query object
    let query = {}; // Ensure query is defined before adding conditions

    // If searchValue is provided, add it to the query
    if (searchValue) {
      query.title = { $regex: searchValue, $options: "i" };
    }

    // Fetch the total count based on the query
    const blogCount = await blogModel.countDocuments(query);
    //console.log("Article Count:", blogCount); // Log the count to see if there are any articles

    const maxPages = Math.ceil(blogCount / perPage);

    // If no articles are found, return a clear response
    if (blogCount === 0) {
      return res
        .status(200)
        .json({ message: "No articles found matching the search query" });
    }

    // If the currentPage exceeds maxPages, return an error
    if (currentPage > maxPages) {
      return res
        .status(400)
        .json({ message: "Page number exceeds the available pages" });
    }

    // Fetch paginated articles based on the query
    const blogs = await blogModel
      .find(query)
      .skip(skipPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    // console.log("Blogs:", blogs); // Log the fetched articles

    // Return the response
    res.status(200).json({
      allBlogs: blogs,
      perPage,
      blogCount,
      maxPages,
      currentPage: parseInt(currentPage),
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).json({
      errorMessage: "Internal server error. Please try again later.",
    });
  }
};

module.exports.edit_article = async (req, res) => {
  const { articleSlug } = req.params;
  const { adminId, role } = req;

  try {
    const getArticle = await articleModel.findOne({ slug: articleSlug });
    if (
      (getArticle && getArticle.adminId === adminId) ||
      getArticle.role === role
    ) {
      res.status(200).json({ editArticle: getArticle });
    } else {
      res.status(404).json({
        errorMessage: {
          error: "You can not edit this article",
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        error: "Internal server error",
      },
    });
  }
};

module.exports.update_article = async (req, res) => {
  const { title, category, slug, tag, text, articleId } = req.body;
  const { adminId, role } = req;
  const validate = await article_validator(req.body, req.files); // Ensure async validation if required

  if (validate.isValid) {
    try {
      const getArticle = await articleModel.findById(articleId);

      if (
        (getArticle && getArticle.adminId === adminId) ||
        getArticle.role === role
      ) {
        const categoryName = category.split("-").join(" ");
        const tagName = tag.split("-").join(" ");

        const updatedArticle = await articleModel.findByIdAndUpdate(
          articleId,
          {
            title: title.trim(),
            slug: slug.trim(),
            category: categoryName,
            category_slug: category,
            tag: tagName,
            tag_slug: tag,
            articleText: text,
          },
          { new: true }
        );

        res.status(200).json({
          success: true,
          message: "Article updated successfully",
          article: updatedArticle,
        });
      } else {
        res.status(403).json({
          success: false,
          message: "You cannot edit this article",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validate.errors,
    });
  }
};
module.exports.delete_article = async (req, res) => {
  const { articleId } = req.params;
  const { adminId, role } = req;
  try {
    const getArticle = await articleModel.findById(articleId);

    if (
      (getArticle && getArticle.adminId === adminId) ||
      getArticle.role === role
    ) {
      await articleModel.findByIdAndDelete(articleId);
      res.status(201).json({
        successMessage: "Article delete successfull",
      });
    } else {
      res.status(404).json({
        errorMessage: {
          error: "You can not edit this article",
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      errorMessage: {
        error: "Internal server error",
      },
    });
  }
};

// module.exports.singleBlog_get = async (req, res) => {
//   const { blogId } = req.params;
//   try {
//     const blog = await blogModel.findById(blogId);
//     responseReturn(res, 200, { blog });
//   } catch (error) {
//     console.log(error.message);
//   }
// };

module.exports.singleBlog_get = async (req, res) => {
  const { slug } = req.params; // Change blogId to slug
  try {
    const blog = await blogModel.findOne({ slug }); // Find blog by slug
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    responseReturn(res, 200, { blog });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};
