const { validationResult } = require("express-validator");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password"); /// no password included
  } catch (err) {
    return next(new HttpError("Could not get users, internal issue", 500));
  }

  res
    .status(200)
    .json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const singup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Sign Up failed, could not find the user.", 500));
  }

  if (existingUser) {
    return next(
      new HttpError("User exists already, please login instead.", 422)
    );
  }
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new HttpError("Could not create user, please try again", 500));
  }
  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    const error = new HttpError("Signup failed, please try again", 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Signup failed, please try again", 500);
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(new HttpError("Login failed, could not find the user.", 500));
  }

  if (!existingUser) {
    return next(
      new HttpError(
        "Could not identify the user, credentials seem to be wrong.",
        403
      )
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError(
        "Could not log in, please check your credentials and try again.",
        500
      )
    );
  }

  if (!isValidPassword) {
    return next(
      new HttpError(
        "Could not identify the user, credentials seem to be wrong.",
        401
      )
    );
  }

  let token;
  try {
    token = jwt.sign(
      {
        userId: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Logging in failed, please try again", 500));
  }

  res.status(200).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.singup = singup;
exports.login = login;
