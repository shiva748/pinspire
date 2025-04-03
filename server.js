// https://ui.shadcn.com/

// === === === imports === === === //\
require("dotenv").config();
const express = require("express");
const PORT = process.env.PORT || 3001;
const basic = require("./Routes/basic");
const auth = require("./Routes/authentication");
const image = require("./Routes/image");
const admin = require("./Routes/admin");
const cookieParser = require("cookie-parser");
const path = require("path");
// === === === initialization === === === //

const app = express();

require("./database/connection");

// === === === injecting middleware === === === //

app.use(express.json());

app.use(cookieParser());

// === === === serving files === === === //

// Serve all static files from public directory
app.use("/api/images", express.static(path.join(__dirname, "public")));

// === === === use of routes === === === //

app.use("/api", basic);

app.use("/api/auth", auth);

app.use("/api/image", image);

app.use("/api/admin", admin);

// === server final listen === === //

app.listen(PORT, (err) => {
  console.log(err ? `some error occured` : `listining to port ${PORT}`);
});
