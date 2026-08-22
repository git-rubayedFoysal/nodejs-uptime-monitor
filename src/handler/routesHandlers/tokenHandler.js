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

// handle get request in user route
handler._token.get = (requestProperties, callback) => {
  const id =
    typeof requestProperties.queryObj?.id === "string" &&
    requestProperties.queryObj?.id.trim().length === 32
      ? requestProperties.queryObj?.id
      : false;

  if (id) {
    readData("tokens", id, (err, data) => {
      if (err) {
        callback(500, { error: "Requested token not found!" });
        return;
      }

      const token = { ...parseJson(data) };
      callback(200, token);
    });
  } else {
    callback(404, { error: "Requested user not found!" });
  }
};

// handle post request in user route
handler._token.post = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.body.phone === "string" &&
    requestProperties.body.phone.trim().length === 11
      ? requestProperties.body.phone
      : false;

  const password =
    typeof requestProperties.body.password === "string" &&
    requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : false;

  if (!phone || !password) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  readData("users", phone, (err, userData) => {
    if (err) {
      callback(404, { error: "Requested user was not found!" });
      return;
    }
    let userDataObj = { ...parseJson(userData) };

    if (hash(password) !== userDataObj.password) {
      callback(400, { error: "Phone or Password is not valid!" });
      return;
    }

    let tokenId = generateToken();
    let expire = Date.now() + 60 * 60 * 1000;

    let tokenObj = {
      phone,
      id: tokenId,
      expire,
    };

    createData("tokens", tokenId, tokenObj, (error) => {
      if (error) {
        callback(500, { error: "Token was not created successfully." });
        return;
      }

      callback(200, { message: "Token was created successfully." });
    });
  });
};
// handle put request in user route
handler._token.put = (requestProperties, callback) => {
  const id =
    typeof requestProperties.body.id === "string" &&
    requestProperties.body.id.trim().length === 32
      ? requestProperties.body.id
      : false;

  const extend =
    typeof requestProperties.body.extend === "boolean" &&
    requestProperties.body.extend === true
      ? requestProperties.body.extend
      : false;

  if (!id || !extend) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  readData("tokens", id, (err, data) => {
    if (err) {
      callback(404, { error: "Requested token was not found!" });
      return;
    }

    const tokenData = { ...parseJson(data) };

    if (tokenData.expire < Date.now()) {
      callback(400, { error: "Token already expired!" });
      return;
    }

    tokenData.expire = Date.now() + 60 * 60 * 1000;
    updateData("tokens", id, tokenData, (err) => {
      if (err) {
        callback(500, { error: "There are error in server side." });
        return;
      }

      callback(200, { message: "Token was updated successfully!" });
    });
  });
};
// handle delete request in user route
handler._token.delete = (requestProperties, callback) => {
  const id =
    typeof requestProperties.queryObj?.id === "string" &&
    requestProperties.queryObj?.id.trim().length === 32
      ? requestProperties.queryObj?.id
      : false;

  if (!id) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  readData("tokens", id, (error, data) => {
    if (error || !data) {
      callback(404, { error: "Requested token was not found!" });
      return;
    }

    deleteData("tokens", id, (err) => {
      if (err) {
        callback(500, { error: "Could not delete requested token!" });
        return;
      }

      callback(200, { message: "Token was deleted successfully!" });
    });
  });
};

handler.tokenVerify = (id, phone, callback) => {
  readData("tokens", id, (err, tokenData) => {
    if (err) {
      callback(false);
      return;
    }

    if (
      parseJson(tokenData).phone !== phone ||
      parseJson(tokenData).expire < Date.now()
    ) {
      callback(false);
      return;
    }

    callback(true);
  });
};
export const { tokenHandler, tokenVerify } = handler;
