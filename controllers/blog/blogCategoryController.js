const blogCategoryModel = require("../../models/blogCategoryModel");

module.exports.category_add = async (req, res) => {
  const { categoryName, categoryImg, categoryDes } = req.body;

  const errors = {};

  // Validate request body
  if (!categoryName) {
    errors.categoryName = "Please provide a category name";
  }
  if (!categoryImg) {
    errors.categoryImg = "Please provide a category image link";
  }
  if (!categoryDes) {
    errors.categoryDes = "Please provide a category description";
  }

  // If validation errors exist, return a response
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errorMessage: errors });
  }

  // Create slug by replacing spaces with dashes and converting to lowercase
  const categorySlug = categoryName.trim().toLowerCase().replace(/\s+/g, "-");

  try {
    // Check if the category already exists
    const checkCategory = await blogCategoryModel.findOne({ categorySlug });
    if (checkCategory) {
      return res.status(409).json({
        errorMessage: {
          error: "Category already exists",
        },
      });
    }

    // Create a new category
    await blogCategoryModel.create({
      categoryName: categoryName.trim(),
      categoryImg: categoryImg.trim(), // Store the image link
      categorySlug,
      categoryDes: categoryDes.trim(),
    });

    return res.status(201).json({
      successMessage: "Category added successfully",
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      errorMessage: {
        error: "Internal server error",
      },
    });
  }
};

module.exports.category_get = async (req, res) => {
  const { page = 1, searchValue = "" } = req.query;

  // Set items per page
  const parPage = 8;
  const skipPage = (parseInt(page) - 1) * parPage;

  try {
    // Handle searching functionality
    let query = {};
    if (searchValue && searchValue !== "undefined") {
      query = {
        categoryName: { $regex: searchValue, $options: "i" },
      };
    }

    // Get total count of categories based on search query
    const categoryCount = await blogCategoryModel.countDocuments(query);

    // Fetch paginated categories with sorting
    const getCategory = await blogCategoryModel
      .find(query)
      .skip(skipPage)
      .limit(parPage)
      .sort({ categoryAt: -1 });

    return res.status(200).json({
      allCategory: getCategory,
      parPage,
      categoryCount,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      errorMessage: {
        error: "Internal server error",
      },
    });
  }
};

module.exports.category_delete = async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    await categoryModel.findByIdAndDelete(categoryId);
    return res.status(200).json({
      successMessage: "Category delete success",
    });
  } catch (error) {
    return res.status(500).json({
      errorMessage: {
        error: "Internal server error",
      },
    });
  }
};
module.exports.category_edit = async (req, res) => {
  const { categorySlug } = req.params;
  try {
    // Use the correct field name as per your schema
    const editCategory = await categoryModel.findOne({ categorySlug });

    if (!editCategory) {
      return res.status(404).json({ errorMessage: "Category not found" });
    }

    return res.status(200).json({ editCategory });
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({
      errorMessage: { error: "Internal server error" },
    });
  }
};

module.exports.category_update = async (req, res) => {
  const { categoryId } = req.params;
  const { categoryName, categoryDes } = req.body;
  const errors = {};

  // Validate inputs
  if (!categoryName) errors.categoryName = "Please provide category name";
  if (!categoryDes) errors.categoryDes = "Please provide category description";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errorMessage: errors });
  }

  // Generate categorySlug
  const categorySlug = categoryName.trim().toLowerCase().replace(/\s+/g, "-");

  try {
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      categoryId,
      {
        categoryName: categoryName.trim(),
        categorySlug,
        categoryDes: categoryDes.trim(),
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ errorMessage: "Category not found" });
    }

    return res.status(200).json({
      successMessage: "Category update successful",
      updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({
      errorMessage: { error: "Internal server error" },
    });
  }
};
