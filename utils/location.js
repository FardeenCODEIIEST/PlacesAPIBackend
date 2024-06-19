require("dotenv").config();

const axios = require("axios");

const HttpError = require("../models/http-error");

const API_KEY = process.env.LOCATION_API_KEY;

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://api.distancematrix.ai/maps/api/geocode/json?address=${encodeURI(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;

  if (!data) {
    const error = new HttpError(
      "Could not find a location for the specified address",
      422
    );
    throw error;
  }

  const coordinates = {};
  coordinates.lat = data.result[0].geometry.location.lat;
  coordinates.lng = data.result[0].geometry.location.lng;

  return coordinates;
}

module.exports = getCoordsForAddress;
