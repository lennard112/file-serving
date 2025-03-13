const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const multer = require("multer");

const app = express();

// Serve static files from 'public' directory
app.use(express.static("public"));

// File Upload Configuration
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter });

// Handle File Upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Invalid file type or no file uploaded." });
  }
  res.json({ message: "File uploaded successfully!", file: req.file.filename });
});

// Serve uploaded files
app.get("/uploads/:filename", (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  res.sendFile(filePath);
});

// Serve static files (index.html and other assets)
app.get("*", (req, res) => {
  const filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(err.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/html" });
      res.end(err.code === "ENOENT" ? "<h1>404 - File Not Found</h1>" : "Server Error");
    } else {
      res.writeHead(200, { "Content-Type": mime.lookup(filePath) || "application/octet-stream" });
      res.end(content);
    }
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
http.createServer(app).listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
