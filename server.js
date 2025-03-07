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
  origin: [
    "http://localhost:5173", // Local development
    "https://car-parts-mern-client.vercel.app", // Deployed frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Allow credentials
};

app.use(cors(corsOptions));

// Use CORS middleware

app.use(bodyParser.json());
app.use(cookieParser());

//app.use("/api", require("./routes/authRoutes"));

// //dashboard
app.use("/api", require("./routes/categoryRoutes"));
app.use("/api", require("./routes/productRoutes"));
// app.use("/api", require("./routes/dashboard/sellerRoutes"));
app.use("/api", require("./routes/blog/blogcategoryRoutes"));

// //client
app.use("/api", require("./routes/home/customerAuthRoutes"));
app.use("/api/home", require("./routes/home/homeRoutes"));
app.use("/api", require("./routes/home/cardRoutes"));
app.get("/", (req, res) => res.send("Hello World!"));

const port = process.env.PORT || 5030;
dbConnect();
server.listen(port, () => console.log(`Server is running on port ${port}!`));
