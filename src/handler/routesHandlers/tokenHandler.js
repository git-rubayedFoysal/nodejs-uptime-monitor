/*
 * Title: Token Route
 * Description: Handle token related route for authentication
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-21
 */

// dependencies
import { generateToken, hash, parseJson } from "../../helpers/utilities.js";
import {
  createData,
  readData,
  updateData,
  deleteData,
} from "../../lib/data.js";

// module scaffolding
const handler = {};

// main token handler - routes request to the matching method handler
handler.tokenHandler = (requestProperties, callback) => {
  const allowedMethod = ["get", "post", "put", "delete"];

  if (allowedMethod.indexOf(requestProperties.method) > -1) {
    handler._token[requestProperties.method](requestProperties, callback);
  } else {
    callback(405, { error: "Request Method Not Allowed!" });
  }
};

// scaffolding for each method function
handler._token = {};

// handle get request in token route - retrieve a token by its id
handler._token.get = (requestProperties, callback) => {
  // validate token id from query string (must be 32 char hex string)
  const id =
    typeof requestProperties.queryObj?.id === "string" &&
    requestProperties.queryObj?.id.trim().length === 32
      ? requestProperties.queryObj?.id
      : false;

  if (id) {
    // read token data from storage
    readData("tokens", id, (err, data) => {
      if (err) {
        callback(404, { error: "Requested token not found!" });
        return;
      }

      const token = { ...parseJson(data) };
      callback(200, token);
    });
  } else {
    callback(400, { error: "Invalid request!" });
  }
};

// handle post request in token route - create a new token after verifying user credentials
handler._token.post = (requestProperties, callback) => {
  // validate phone number from request body (must be 11 char string)
  const phone =
    typeof requestProperties.body.phone === "string" &&
    requestProperties.body.phone.trim().length === 11
      ? requestProperties.body.phone
      : false;

  // validate password from request body (must be non-empty string)
  const password =
    typeof requestProperties.body.password === "string" &&
    requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : false;

  if (!phone || !password) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // lookup user by phone to verify credentials
  readData("users", phone, (err, userData) => {
    if (err) {
      callback(404, { error: "Requested user was not found!" });
      return;
    }
    let userDataObj = { ...parseJson(userData) };

    // compare hashed password with stored password
    if (hash(password) !== userDataObj.password) {
      callback(400, { error: "Phone or Password is not valid!" });
      return;
    }

    // generate a new token id and set expiry to 1 hour from now
    let tokenId = generateToken();
    let expire = Date.now() + 60 * 60 * 1000 * 6;

    let tokenObj = {
      phone,
      id: tokenId,
      expire,
    };

    // persist the new token to storage
    createData("tokens", tokenId, tokenObj, (error) => {
      if (error) {
        callback(500, { error: "Token was not created successfully." });
        return;
      }

      callback(200, { message: "Token was created successfully." });
    });
  });
};
// handle put request in token route - extend token expiry by 1 hour
handler._token.put = (requestProperties, callback) => {
  // validate token id from request body (must be 32 char hex string)
  const id =
    typeof requestProperties.body.id === "string" &&
    requestProperties.body.id.trim().length === 32
      ? requestProperties.body.id
      : false;

  // validate extend flag (must be boolean true)
  const extend =
    typeof requestProperties.body.extend === "boolean" &&
    requestProperties.body.extend === true
      ? requestProperties.body.extend
      : false;

  if (!id || !extend) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // read existing token data
  readData("tokens", id, (err, data) => {
    if (err) {
      callback(404, { error: "Requested token was not found!" });
      return;
    }

    const tokenData = { ...parseJson(data) };

    // reject if token has already expired
    if (tokenData.expire < Date.now()) {
      callback(400, { error: "Token already expired!" });
      return;
    }

    // extend expiry by 1 hour and persist
    tokenData.expire = Date.now() + 60 * 60 * 1000 * 6;
    updateData("tokens", id, tokenData, (err) => {
      if (err) {
        callback(500, { error: "There are error in server side." });
        return;
      }

      callback(200, { message: "Token was updated successfully!" });
    });
  });
};
// handle delete request in token route - delete a token by its id
handler._token.delete = (requestProperties, callback) => {
  // validate token id from query string (must be 32 char hex string)
  const id =
    typeof requestProperties.queryObj?.id === "string" &&
    requestProperties.queryObj?.id.trim().length === 32
      ? requestProperties.queryObj?.id
      : false;

  if (!id) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // verify token exists before deleting
  readData("tokens", id, (error, data) => {
    if (error || !data) {
      callback(404, { error: "Requested token was not found!" });
      return;
    }

    // delete the token from storage
    deleteData("tokens", id, (err) => {
      if (err) {
        callback(500, { error: "Could not delete requested token!" });
        return;
      }

      callback(200, { message: "Token was deleted successfully!" });
    });
  });
};

// verify a token - checks if token exists, belongs to the given phone, and is not expired
handler.tokenVerify = (id, phone, callback) => {
  readData("tokens", id, (err, tokenData) => {
    // token not found in storage
    if (err) {
      callback(false);
      return;
    }

    // reject if phone doesn't match OR token has expired
    if (
      parseJson(tokenData).phone !== phone ||
      parseJson(tokenData).expire < Date.now()
    ) {
      callback(false);
      return;
    }

    // token is valid
    callback(true);
  });
};
export const { tokenHandler, tokenVerify } = handler;
