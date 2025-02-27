const router = require("express").Router();
// const { authMiddleware } = require("../../middlewares/authMiddleware");
const categoryController = require("../controllers/categoryController");

router.post("/category-add", categoryController.add_category);
//router.get("/category-add", categoryController.testCategory);
router.get("/category-get", categoryController.get_category);
router.post("/category-update/:categoryId", categoryController.category_update);

router.post("/category-image-update", categoryController.category_image_update);
module.exports = router;
