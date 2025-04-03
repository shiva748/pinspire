const jwt = require("jsonwebtoken");
const { handleError } = require("../snippets/error");
const auth = async (req, res, next) => {
  try {
    if (!req.cookies) {
      handleError("No Authorization found", 401);
    }
    const token = req.cookies.auth_tkn;
    if (!token) {
      handleError("No Authorization found", 401);
    }
    let decodedtoken = jwt.verify(token, process.env.KEY);
    if (!decodedtoken) {
      handleError("No Authorization found", 401);
    }
    req.user = decodedtoken;
    req.user.token = token;
    next();
  } catch (error) {
    res
      .status(error.status || 400)
      .json({ result: false, message: error.message });
  }
};

module.exports = auth;
