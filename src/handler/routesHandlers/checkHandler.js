/*
 * Title: Check Route
 * Description: Handle to check related routes
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-23
 */

// dependencies
import {
  readData,
  createData,
  updateData,
  deleteData,
} from "../../lib/data.js";
import { generateID, parseJson } from "../../helpers/utilities.js";
import { tokenVerify } from "./tokenHandler.js";
import { env } from "../../helpers/environments.js";

// module scaffolding
const handler = {};

// main check handler - routes request to the matching method handler
handler.checkHandler = (requestProperties, callback) => {
  const allowedMethod = ["get", "post", "put", "delete"];

  if (allowedMethod.indexOf(requestProperties.method) > -1) {
    handler._check[requestProperties.method](requestProperties, callback);
  } else {
    callback(405, { error: "Request Method Not Allowed!" });
  }
};

// scaffolding for each method function
handler._check = {};

// handle get request in check route - retrieve a single check by its id (requires valid token)
handler._check.get = (requestProperties, callback) => {
  // validate check id from query string (must be 16 char hex string)
  const id =
    typeof requestProperties.queryObj?.id === "string" &&
    requestProperties.queryObj?.id.trim().length === 16
      ? requestProperties.queryObj?.id
      : false;

  if (!id) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // extract token from request headers
  const token =
    typeof requestProperties.headersObj?.token === "string" &&
    requestProperties.headersObj?.token.trim().length === 32
      ? requestProperties.headersObj.token
      : false;

  if (!token) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // read the check from storage
  readData("checks", id, (checkErr, checkData) => {
    if (checkErr) {
      callback(500, { error: "Server side error!" });
      return;
    }

    // verify the token belongs to the check owner before returning data
    const phone = parseJson(checkData).phone;
    tokenVerify(token, phone, (isValid) => {
      if (!isValid) {
        callback(403, { error: "Authentication failure!" });
        return;
      }

      callback(200, parseJson(checkData));
    });
  });
};

// handle post request in check route - create a new uptime check for the authenticated user
handler._check.post = (requestProperties, callback) => {
  // validate protocol (must be http or https)
  const protocol =
    typeof requestProperties.body?.protocol === "string" &&
    ["http", "https"].indexOf(requestProperties.body?.protocol) > -1
      ? requestProperties.body?.protocol
      : false;

  // validate url (must be non-empty string)
  const url =
    typeof requestProperties.body?.url === "string" &&
    requestProperties.body?.url.trim().length > 0
      ? requestProperties.body?.url
      : false;

  // validate method (must be GET, POST, PUT, or DELETE)
  const method =
    typeof requestProperties.body?.method === "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(requestProperties.body?.method) >
      -1
      ? requestProperties.body?.method
      : false;

  // validate successCode (must be an array of acceptable status codes)
  const successCode =
    typeof requestProperties.body?.successCode === "object" &&
    requestProperties.body?.successCode instanceof Array
      ? requestProperties.body?.successCode
      : false;

  // validate timeoutSec (must be integer between 1 and 5)
  const timeoutSec =
    typeof requestProperties.body?.timeoutSec === "number" &&
    requestProperties.body?.timeoutSec % 1 === 0 &&
    requestProperties.body?.timeoutSec >= 1 &&
    requestProperties.body?.timeoutSec <= 5
      ? requestProperties.body?.timeoutSec
      : false;

  if (!protocol || !url || !method || !successCode || !timeoutSec) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // extract token from request headers
  const token =
    typeof requestProperties.headersObj?.token === "string" &&
    requestProperties.headersObj?.token.trim().length === 32
      ? requestProperties.headersObj.token
      : false;

  if (!token) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // lookup the user phone by reading the token
  readData("tokens", token, (err, tokenData) => {
    if (err) {
      callback(403, { error: "Authentication failure!" });
      return;
    }
    const userPhone = parseJson(tokenData).phone;

    // lookup the user data
    readData("users", userPhone, (userErr, userData) => {
      if (userErr) {
        callback(404, { error: "User not found." });
        return;
      }

      // verify token is valid and belongs to this user
      tokenVerify(token, userPhone, (isValid) => {
        if (!isValid) {
          callback(403, { error: "Authentication failure!" });
          return;
        }

        const userObj = parseJson(userData);
        // get existing checks array or initialize empty
        const userChecks =
          typeof userObj.checks === "object" && userObj.checks instanceof Array
            ? userObj.checks
            : [];

        // enforce max check limit per user
        if (userChecks.length >= env.maxCheck) {
          callback(401, { error: "Max check limit user already reached." });
          return;
        }

        // generate unique check id and build check object
        const checkId = generateID();
        const checkObj = {
          id: checkId,
          phone: userPhone,
          protocol,
          url,
          method,
          successCode,
          timeoutSec,
        };

        // persist the new check to storage
        createData("checks", checkId, checkObj, (checkErr) => {
          if (checkErr) {
            callback(500, { error: "There are a server side error." });
            return;
          }

          // add check id to user's checks list and persist
          userObj.checks = userChecks;
          userObj.checks.push(checkId);

          updateData("users", userPhone, userObj, (updateErr) => {
            if (updateErr) {
              callback(500, { error: "There are a server side error." });
              return;
            }

            callback(200, checkObj);
          });
        });
      });
    });
  });
};
// handle put request in check route - update an existing check (requires valid token)
handler._check.put = (requestProperties, callback) => {
  // validate check id from request body (must be 16 char hex string)
  const id =
    typeof requestProperties.body?.id === "string" &&
    requestProperties.body?.id.trim().length === 16
      ? requestProperties.body?.id
      : false;

  // validate protocol (must be http or https)
  const protocol =
    typeof requestProperties.body?.protocol === "string" &&
    ["http", "https"].indexOf(requestProperties.body?.protocol) > -1
      ? requestProperties.body?.protocol
      : false;

  // validate url (must be non-empty string)
  const url =
    typeof requestProperties.body?.url === "string" &&
    requestProperties.body?.url.trim().length > 0
      ? requestProperties.body?.url
      : false;

  // validate method (must be GET, POST, PUT, or DELETE)
  const method =
    typeof requestProperties.body.method === "string" &&
    ["GET", "POST", "PUT", "DELETE"].indexOf(requestProperties.body.method) > -1
      ? requestProperties.body.method
      : false;

  // validate successCode (must be an array of acceptable status codes)
  const successCode =
    typeof requestProperties.body.successCode === "object" &&
    requestProperties.body.successCode instanceof Array
      ? requestProperties.body.successCode
      : false;

  // validate timeoutSec (must be integer between 1 and 5)
  const timeoutSec =
    typeof requestProperties.body.timeoutSec === "number" &&
    requestProperties.body.timeoutSec % 1 === 0 &&
    requestProperties.body.timeoutSec >= 1 &&
    requestProperties.body.timeoutSec <= 5
      ? requestProperties.body.timeoutSec
      : false;

  if (!id) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // at least one updatable field must be provided
  if (!protocol && !url && !method && !successCode && !timeoutSec) {
    callback(400, { error: "At least one field must be provided to update" });
    return;
  }

  // extract token from request headers
  const token =
    typeof requestProperties.headersObj?.token === "string" &&
    requestProperties.headersObj?.token.trim().length === 32
      ? requestProperties.headersObj.token
      : false;

  if (!token) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // read the existing check from storage
  readData("checks", id, (checkErr, checkData) => {
    if (checkErr) {
      callback(404, { error: "Check not found!" });
      return;
    }
    const checkObj = parseJson(checkData);

    // verify the token belongs to the check owner before updating
    tokenVerify(token, checkObj.phone, (isValid) => {
      if (!isValid) {
        callback(403, { error: "Authentication failure!" });
        return;
      }

      // update only the fields that were provided
      if (protocol) checkObj.protocol = protocol;
      if (url) checkObj.url = url;
      if (method) checkObj.method = method;
      if (successCode) checkObj.successCode = successCode;
      if (timeoutSec) checkObj.timeoutSec = timeoutSec;

      // persist the updated check to storage
      updateData("checks", id, checkObj, (updateErr) => {
        if (updateErr) {
          callback(500, { error: "Server side error!" });
          return;
        }

        callback(200, { message: "Check was updated successfully!" });
      });
    });
  });
};
// handle delete request in check route - delete a check and unlink it from the owner (requires valid token)
handler._check.delete = (requestProperties, callback) => {
  // validate check id from query string (must be 16 char hex string)
  const id =
    typeof requestProperties.queryObj?.id === "string" &&
    requestProperties.queryObj?.id.trim().length === 16
      ? requestProperties.queryObj?.id
      : false;

  if (!id) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // extract token from request headers
  const token =
    typeof requestProperties.headersObj?.token === "string" &&
    requestProperties.headersObj?.token.trim().length === 32
      ? requestProperties.headersObj.token
      : false;

  if (!token) {
    callback(400, { error: "Invalid request!" });
    return;
  }

  // read the check to confirm it exists and get the owner's phone
  readData("checks", id, (checkErr, checkData) => {
    if (checkErr) {
      callback(404, { error: "Check was not found!" });
      return;
    }

    let checkObj = parseJson(checkData);

    // verify the token belongs to the check owner before deleting
    tokenVerify(token, checkObj.phone, (isValid) => {
      if (!isValid) {
        callback(403, { error: "Authentication failure!" });
        return;
      }

      // delete the check from storage
      deleteData("checks", id, (deleteErr) => {
        if (deleteErr) {
          callback(500, { error: "Server side error!" });
          return;
        }

        // remove the check id from the owner's checks list
        readData("users", checkObj.phone, (userErr, userData) => {
          if (userErr) {
            callback(500, { error: "Server side error!" });
            return;
          }

          const userObj = parseJson(userData);

          // get user's checks array or initialize empty
          const userCheck =
            typeof userObj.checks === "object" &&
            userObj.checks instanceof Array
              ? userObj.checks
              : [];

          // find and remove the deleted check's id from the list
          let position = userCheck.indexOf(id);

          if (position < 0) {
            callback(500, {
              error: "Requested check id in user checks not found",
            });
            return;
          }
          userCheck.splice(position, 1);

          userObj.checks = userCheck;

          // persist the updated user data
          updateData("users", userObj.phone, userObj, (userUpdateErr) => {
            if (userUpdateErr) {
              callback(500, { error: "Server side error!" });
              return;
            }

            callback(200, { message: "Requested check deleted successfully!" });
          });
        });
      });
    });
  });
};

export const { checkHandler } = handler;
