const categoryModel = require("../models/categoryModel");
const { responseReturn } = require("../utiles/response");
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
class categoryController {
  add_category = async (req, res) => {
    const form = new formidable.IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Formidable Error:", err);
        return responseReturn(res, 400, {
          error: "Something went wrong during file upload",
        });
      }

      //console.log("Fields: ", fields); // Log fields to verify
      //  console.log("Files: ", files); // Log files to verify

      let name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
      if (!name) {
        return responseReturn(res, 400, { error: "Name is required" });
      }

      try {
        name = name.trim(); // Ensure name is a string
        const slug = name.toLowerCase().split(" ").join("-");
        const image = files.image && files.image[0]; // Access the first element if it's an array

        // console.log("Image: ", image); // Log image to verify

        if (!image || !image.filepath) {
          console.error("No image file uploaded: ", image);
          return responseReturn(res, 400, { error: "No image file uploaded" });
        }

        cloudinary.config({
          cloud_name: "dmm89lmmy",
          api_key: "523399586259964",
          api_secret: "YfZL1JT5g3gVt6WlYA4aztBpCjw",
          secure: true,
        });

        const result = await cloudinary.uploader.upload(image.filepath, {
          folder: "categorys",
        });

        if (result) {
          const category = await categoryModel.create({
            name,
            slug,
            image: result.url,
          });
          return responseReturn(res, 201, {
            category,
            message: "Category added successfully",
          });
        } else {
          return responseReturn(res, 404, { error: "Image upload failed" });
        }
      } catch (error) {
        console.error("Error: ", error);
        return responseReturn(res, 500, {
          error: "Internal server error",
          details: error.message,
        });
      }
    });
  };

  testCategory = async () => {
    try {
      const category = await categoryModel.create({
        name: "Test",
        slug: "test",
        image: "https://via.placeholder.com/150",
      });
      console.log("Database Create Result:", category);
    } catch (error) {
      console.error("Database Error:", error);
    }
  };

  get_category = async (req, res) => {
    const { page, searchValue, parPage } = req.query;
    try {
      let skipPage = "";
      if (parPage && page) {
        skipPage = parseInt(parPage) * (parseInt(page) - 1);
      }
      if (searchValue && page && parPage) {
        const categorys = await categoryModel
          .find({
            $text: { $search: searchValue },
          })
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel
          .find({
            $text: { $search: searchValue },
          })
          .countDocuments();
        responseReturn(res, 200, { totalCategory, categorys });
      } else if (searchValue === "" && page && parPage) {
        const categorys = await categoryModel
          .find({})
          .skip(skipPage)
          .limit(parPage)
          .sort({ createdAt: -1 });
        const totalCategory = await categoryModel.find({}).countDocuments();
        responseReturn(res, 200, { totalCategory, categorys });
      } else {
        const categorys = await categoryModel.find({}).sort({ createdAt: -1 });
        const totalCategory = await categoryModel.find({}).countDocuments();
        responseReturn(res, 200, { totalCategory, categorys });
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  category_update = async (req, res) => {
    let { name, image, slug } = req.body;
    const categoryId = req.params.categoryId;

    // Check if categoryId exists
    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    // Check if name is provided
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    // Trim the name and generate the slug
    name = name.trim();
    slug = name.split(" ").join("-"); // Updating the slug based on name

    try {
      // Find and update the category using categoryId
      const updatedCategory = await categoryModel.findByIdAndUpdate(
        categoryId,
        { name, image, slug },
        { new: true } // This option ensures the updated category is returned
      );

      // If the category is not found
      if (!updatedCategory) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Return the success response with the updated category
      return res.status(200).json({
        category: updatedCategory,
        message: "Category updated successfully",
      });
    } catch (error) {
      // Log the error and send a response
      console.error(error.message);
      return res.status(500).json({ error: "Server error: " + error.message });
    }
  };

  category_image_update = async (req, res) => {
    const form = new formidable.IncomingForm({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parsing failed:", err.message);
        return res
          .status(400)
          .json({ error: "Form parsing failed: " + err.message });
      }

      console.log("Files received:", files);
      console.log("Fields received:", fields);
      const file = Array.isArray(files.newImage)
        ? files.newImage[0]
        : files.newImage;

      if (!file || !file.filepath) {
        console.error("Image file is missing or invalid. File details:", file);
        return res.status(400).json({ error: "Image file is required" });
      }

      console.log("File path:", file.filepath);
      const categoryId = fields.categoryId[0]; // Access first element
      const oldImage = fields.oldImage[0]; // Access first element

      if (!categoryId || !oldImage) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      try {
        // Configure Cloudinary
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true,
        });

        console.log("Uploading new image...");
        const uploadResult = await cloudinary.uploader.upload(file.filepath, {
          folder: "products",
        });

        if (!uploadResult || !uploadResult.url) {
          console.error("Image upload failed:", uploadResult);
          return res.status(500).json({ error: "Image upload failed" });
        }

        // Find and update the product
        const category = await productModel.findById(categoryId);
        if (!category) {
          return res.status(404).json({ error: "category not found" });
        }

        console.log("Category images before update:", category.images);

        const { images = [] } = product; // Ensure `images` is always an array
        const index = images.findIndex((img) => img === oldImage);
        if (index === -1) {
          console.error("Old image not found in category images:", oldImage);
          return res
            .status(404)
            .json({ error: "Old image not found in category images" });
        }

        images[index] = uploadResult.url; // Replace old image with the new one
        const updatedCategory = await categoryModel.findByIdAndUpdate(
          categoryId,
          { images },
          { new: true } // Return the updated product
        );

        console.log("Updated Category:", updatedCategory);
        return res.status(200).json({
          product: updatedCategory,
          message: "Category image updated successfully",
        });
      } catch (error) {
        console.error("Server error:", error.message);
        return res
          .status(500)
          .json({ error: "Server error: " + error.message });
      }
    });
  };
}
module.exports = new categoryController();
