const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000; // ✅ Works on both local & cloud

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve image files

// MongoDB
const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);
let collection;

async function connectToDB() {
  try {
    await client.connect();
    const db = client.db("campusmapdb");
    collection = db.collection("posts");
    console.log("✅ MongoDB connected.");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
connectToDB();

// Multer setup
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
const upload = multer({ storage });

// POST route
app.post("/api/posts", upload.single("photo"), async (req, res) => {
  try {
    const { description, location } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: "Image missing" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const post = {
      description,
      location,
      imageUrl,
      createdAt: new Date(),
    };

    const result = await collection.insertOne(post);
    console.log("✅ Post saved:", result.insertedId);
    res.status(201).json({ success: true, insertedId: result.insertedId });

  } catch (err) {
    console.error("❌ Server error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET route
app.get("/api/posts", async (req, res) => {
  try {
    const posts = await collection.find().sort({ createdAt: -1 }).toArray();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ success: false, error: "Fetching posts failed" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
