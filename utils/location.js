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

  // The provider always answers 200, so `data` is truthy even when it found
  // nothing and the original `if (!data)` guard never fired. An unmatched
  // address then threw a TypeError on data.result[0] and surfaced as a 500
  // instead of the intended 422.
  //
  // Note it only reports failure for malformed input (status INVALID_REQUEST,
  // empty result). For nonsense that is merely unmatchable it returns
  // status OK with one APPROXIMATE locality that is simply wrong, which is
  // indistinguishable from a genuine match. Validate addresses upstream if
  // that matters.
  const match =
    data && data.status === "OK" && Array.isArray(data.result) && data.result[0];

  if (!match || !match.geometry || !match.geometry.location) {
    throw new HttpError(
      "Could not find a location for the specified address",
      422
    );
  }

  const { lat, lng } = match.geometry.location;

  return { lat, lng };
}

module.exports = getCoordsForAddress;
