const router = require("express").Router();
//const { authMiddleware } = require("../../middlewares/authMiddleware");

const blogCategoryController = require("../../controllers/blog/blogCategoryController");
const blogController = require("../../controllers/blog/blogController");

//category
router.post("/add-blogCategory", blogCategoryController.category_add);
router.get("/get-blogcategory", blogCategoryController.category_get);
router.post("/add-blog", blogController.addBlog);
router.get("/get-blog", blogController.get_blog);
router.get("/get-singleblog/:slug", blogController.singleBlog_get);
module.exports = router;
