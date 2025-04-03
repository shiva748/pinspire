require("dotenv").config();
const mongoose = require("mongoose");

const dbURI = process.env.MONGODB;

mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error("Database connection error:", err.message);
  });
