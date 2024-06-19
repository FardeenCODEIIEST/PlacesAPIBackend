const express = require("express");
const { check } = require("express-validator");
const router = express.Router();

const userControllers = require("../controllers/user-controller");
// const fileUpload = require("../middleware/file-upload");
/**
 *
 *  Middleware goes sequentially
 */

router.get("/", userControllers.getUsers);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 8 }),
  ],
  userControllers.singup
);

router.post("/login", userControllers.login);

module.exports = router;
