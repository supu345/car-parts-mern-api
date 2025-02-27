const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const productModel = require("../models/productModel");
const { responseReturn } = require("../utiles/response");

class productController {
  add_product = async (req, res) => {
    const form = new formidable.IncomingForm({
      multiples: true,
    });

    form.parse(req, async (err, field, files) => {
      if (err) {
        console.error("Formidable Error:", err);
        return responseReturn(res, 400, {
          error: "Something went wrong during file upload",
        });
      }

      let { name, category, description, stock, price, discount, brand } =
        field;
      let { images } = files;

      console.log("Files: ", files); // Log files to verify
      console.log("Images: ", images); // Log images to verify

      name = String(name || "").trim();
      const slug = name.split(" ").join("-");
      category = String(category || "").trim();
      description = String(description || "").trim();
      brand = String(brand || "").trim();

      cloudinary.config({
        cloud_name: process.env.cloud_name,
        api_key: process.env.api_key,
        api_secret: process.env.api_secret,
        secure: true,
      });

      try {
        let allImageUrl = [];

        // Handle single and multiple file uploads
        images = images ? (Array.isArray(images) ? images : [images]) : [];

        if (images.length === 0) {
          return responseReturn(res, 400, { error: "No image file uploaded" });
        }

        for (let i = 0; i < images.length; i++) {
          console.log("Uploading image: ", images[i].filepath); // Log each image upload
          const result = await cloudinary.uploader.upload(images[i].filepath, {
            folder: "products",
          });
          allImageUrl = [...allImageUrl, result.url];
        }

        await productModel.create({
          name,
          slug,
          category: category.trim(),
          description: description.trim(),
          stock: parseInt(stock),
          price: parseInt(price),
          discount: parseInt(discount),
          images: allImageUrl,
          brand: brand.trim(),
        });

        responseReturn(res, 201, { message: "Product added successfully" });
      } catch (error) {
        console.error("Error: ", error);
        responseReturn(res, 500, { error: error.message });
      }
    });
  };

  products_get = async (req, res) => {
    const { page, searchValue, parPage } = req.query;

    // Calculate the number of documents to skip for pagination
    const skipPage = parseInt(parPage) * (parseInt(page) - 1);

    try {
      if (searchValue) {
        // Query with text search
        const products = await productModel
          .find({
            $text: { $search: searchValue },
          })
          .skip(skipPage)
          .limit(parseInt(parPage))
          .sort({ createdAt: -1 });

        const totalProduct = await productModel
          .find({
            $text: { $search: searchValue },
          })
          .countDocuments();

        // Return response with total products and queried products
        responseReturn(res, 200, { totalProduct, products });
      } else {
        // Query without search value, returning all products
        const products = await productModel
          .find({})
          .skip(skipPage)
          .limit(parseInt(parPage))
          .sort({ createdAt: -1 });

        const totalProduct = await productModel.countDocuments();

        // Return response with total products and queried products
        responseReturn(res, 200, { totalProduct, products });
      }
    } catch (error) {
      console.error(error.message);
      responseReturn(res, 500, { error: "Internal server error" });
    }
  };

  product_get = async (req, res) => {
    const { productId } = req.params;
    try {
      const product = await productModel.findById(productId);
      responseReturn(res, 200, { product });
    } catch (error) {
      console.log(error.message);
    }
  };

  product_update = async (req, res) => {
    let { name, description, discount, price, brand, productId, stock } =
      req.body;
    name = name.trim();
    const slug = name.split(" ").join("-");
    try {
      await productModel.findByIdAndUpdate(productId, {
        name,
        description,
        discount,
        price,
        brand,
        productId,
        stock,
        slug,
      });
      const product = await productModel.findById(productId);
      responseReturn(res, 200, { product, message: "product update success" });
    } catch (error) {
      responseReturn(res, 500, { error: error.message });
    }
  };

  product_image_update = async (req, res) => {
    const form = new formidable.IncomingForm({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Form parsing failed:", err.message);
        return res
          .status(400)
          .json({ error: "Form parsing failed: " + err.message });
      }

      //  console.log("Files received:", files);
      //  console.log("Fields received:", fields);
      const file = Array.isArray(files.newImage)
        ? files.newImage[0]
        : files.newImage;

      if (!file || !file.filepath) {
        console.error("Image file is missing or invalid. File details:", file);
        return res.status(400).json({ error: "Image file is required" });
      }

      //  console.log("File path:", file.filepath);
      const productId = fields.productId[0]; // Access first element
      const oldImage = fields.oldImage[0]; // Access first element

      if (!productId || !oldImage) {
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
        const product = await productModel.findById(productId);
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }

        // console.log("Product images before update:", product.images);

        const { images = [] } = product; // Ensure `images` is always an array
        const index = images.findIndex((img) => img === oldImage);
        if (index === -1) {
          console.error("Old image not found in product images:", oldImage);
          return res
            .status(404)
            .json({ error: "Old image not found in product images" });
        }

        images[index] = uploadResult.url; // Replace old image with the new one
        const updatedProduct = await productModel.findByIdAndUpdate(
          productId,
          { images },
          { new: true } // Return the updated product
        );

        // console.log("Updated Product:", updatedProduct);
        return res.status(200).json({
          product: updatedProduct,
          message: "Product image updated successfully",
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

module.exports = new productController();
