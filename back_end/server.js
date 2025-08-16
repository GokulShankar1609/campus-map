const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = process.env.PORT; // ✅ Required for Render

// ✅ CORS Configuration
const allowedOrigins = [
  "https://campus-map-front-end.onrender.com",
  "http://localhost:3000"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// ✅ Serve uploaded images + fallback image
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ MongoDB setup
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let collection;
let dbReady = false;

async function connectToDB() {
  try {
    await client.connect();
    const db = client.db("campusmapdb");
    collection = db.collection("posts");
    dbReady = true;
    console.log("✅ MongoDB connected.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
connectToDB();

// ✅ Block requests until DB is ready
app.use((req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ success: false, error: "Database not ready" });
  }
  next();
});

// ✅ Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + path.extname(file.originalname);
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image files allowed"));
  }
});

// ✅ POST route to upload a missing item
app.post("/api/posts", upload.single("photo"), async (req, res) => {
  try {
    const sanitize = (str) => str.trim();
    const { description, location } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "Image missing" });
    }
    if (!description || !location) {
      return res.status(400).json({ success: false, error: "Missing fields" });
    }

    const imageUrl = `https://campus-map-6cuk.onrender.com/uploads/${req.file.filename}`; // ✅ Match frontend base
    const post = {
      description: sanitize(description),
      location: sanitize(location),
      imageUrl,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(post);
    console.log("✅ Post saved:", result.insertedId);
    console.log("📸 Uploaded file:", req.file.filename);
    console.log("📝 Description:", description);
    console.log("📍 Location:", location);

    res.status(201).json({ success: true, insertedId: result.insertedId, imageUrl });

  } catch (err) {
    console.error("❌ Server error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ GET route to fetch all posts
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await collection.find().sort({ createdAt: -1 }).toArray();
    res.json(posts);
  } catch (err) {
    console.error("❌ Fetch error:", err.message);
    res.status(500).json({ success: false, error: "Fetching posts failed" });
  }
});

// ✅ Alias for feed
app.get("/api/feed", async (req, res) => {
  try {
    const posts = await collection.find().sort({ createdAt: -1 }).toArray();
    res.json(posts);
  } catch (err) {
    console.error("❌ Feed fetch error:", err.message);
    res.status(500).json({ success: false, error: "Fetching feed failed" });
  }
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ CampusMap backend is running.");
});

// ✅ Global error handler for Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("Only image files allowed")) {
    return res.status(400).json({ success: false, error: err.message });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});