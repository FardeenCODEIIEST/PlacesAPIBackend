const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

require("dotenv").config();

const placesRoutes = require("./routes/places-routes");
const HttpError = require("./models/http-error");
const userRoutes = require("./routes/users-routes");

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ub4hkns.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images"))); // static serving ---> just return

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // for CORS
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

app.use("/api/places", placesRoutes); // path starts with '/api/places'
app.use("/api/users", userRoutes);

// No routes reachable
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

// special error handling middleware
app.use((error, req, res, next) => {
  if (req.file) {
    // rollback if errors
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500).json({
    message: error.message || "An unknown error occured",
  });
});

mongoose
  .connect(url)
  .then(() => {
    console.log("Connection successful, server listening on port 5000");
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
