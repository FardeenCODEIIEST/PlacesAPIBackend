const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

require("dotenv").config();

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next(); // don't block options request
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      throw new Error("Authetication Failed");
    }
    // verify
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decodedToken.userId };
    next(); // allow the request to continue its journey
  } catch (err) {
    return next(new HttpError("Authentication failed", 401));
  }
};
