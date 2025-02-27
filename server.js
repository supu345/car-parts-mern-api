const express = require("express");
const { dbConnect } = require("./utiles/db");
const http = require("http");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const cors = require("cors");
require("dotenv").config();

const server = http.createServer(app);

const corsOptions = {
  origin: "http://localhost:5173", // Replace with the origin of your frontend application
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Use CORS middleware

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

//app.use("/api", require("./routes/authRoutes"));

// //dashboard
app.use("/api", require("./routes/categoryRoutes"));
app.use("/api", require("./routes/productRoutes"));
// app.use("/api", require("./routes/dashboard/sellerRoutes"));
app.use("/api", require("./routes/blog/blogcategoryRoutes"));
app.use("/api", require("./routes/home/customerAuthRoutes"));
// //client
app.use("/api/home", require("./routes/home/homeRoutes"));
app.use("/api", require("./routes/home/cardRoutes"));
app.get("/", (req, res) => res.send("Hello World!"));

const port = process.env.PORT || 5030;
dbConnect();
server.listen(port, () => console.log(`Server is running on port ${port}!`));
