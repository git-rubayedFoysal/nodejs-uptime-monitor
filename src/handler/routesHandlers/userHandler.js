/*
 * Title: User Route
 * Description: Handle to user related routes
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-21
 */

// dependencies
import {
  readData,
  createData,
  updateData,
  deleteData,
} from "../../lib/data.js";
import { hash, parseJson } from "../../helpers/utilities.js";
import { tokenVerify } from "./tokenHandler.js";

// module scaffolding
const handler = {};

// main user handler - routes request to the matching method handler
handler.userHandler = (requestProperties, callback) => {
  const allowedMethod = ["get", "post", "put", "delete"];

  if (allowedMethod.indexOf(requestProperties.method) > -1) {
    handler._users[requestProperties.method](requestProperties, callback);
  } else {
    callback(405, { error: "Request Method Not Allowed!" });
  }
};

// scaffolding for each method function
handler._users = {};

// handle get request in user route - retrieve user profile (requires valid token)
handler._users.get = (requestProperties, callback) => {
  // validate phone number from query string (must be 11 char string)
  const phone =
    typeof requestProperties.queryObj?.phone === "string" &&
    requestProperties.queryObj?.phone.trim().length === 11
      ? requestProperties.queryObj?.phone
      : false;

  if (phone) {
    // extract token from request headers
    const token =
      typeof requestProperties.headersObj?.token === "string"
        ? requestProperties.headersObj.token
        : false;

    if (!token) {
      callback(400, { error: "Invalid request!" });
      return;
    }

    // verify token belongs to the requested phone before returning data
    tokenVerify(token, phone, (isUser) => {
      if (!isUser) {
        callback(403, { error: "Authentication failure!" });
        return;
      }
      readData("users", phone, (err, data) => {
        if (err) {
          callback(404, { error: "Requested user not found!" });
          return;
        }

        const user = { ...parseJson(data) };
        // never expose password in response
        delete user.password;
        callback(200, user);
      });
    });
  } else {
    callback(400, { error: "Invalid request!" });
  }
};

// handle post request in user route - register a new user
handler._users.post = (requestProperties, callback) => {
  // validate first name (must be non-empty string)
  const firstName =
    typeof requestProperties.body.firstName === "string" &&
    requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : false;

  // validate last name (must be non-empty string)
  const lastName =
    typeof requestProperties.body.lastName === "string" &&
    requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : false;

  // validate phone number (must be 11 char string)
  const phone =
    typeof requestProperties.body.phone === "string" &&
    requestProperties.body.phone.trim().length === 11
      ? requestProperties.body.phone
      : false;

  // validate password (must be non-empty string)
  const password =
    typeof requestProperties.body.password === "string" &&
    requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : false;

  // validate terms of service agreement (must be boolean true)
  const tosAgreement =
    typeof requestProperties.body.tosAgreement === "boolean" &&
    requestProperties.body.tosAgreement === true
      ? requestProperties.body.tosAgreement
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // check if user already exists before creating
    readData("users", phone, (error) => {
      if (error) {
        // user doesn't exist - create new user with hashed password
        const userData = {
          firstName,
          lastName,
          phone,
          password: hash(password),
          tosAgreement,
        };

        createData("users", phone, userData, (err) => {
          if (err) {
            callback(500, { error: "Could not create user!" });
          } else {
            callback(200, {
              message: "User created successfully!",
            });
          }
        });
      } else {
        callback(500, { error: "Duplicate user not allowed." });
      }
    });
  } else {
    callback(400, {
      error: "You have a problem in your request.",
    });
  }
};
// handle put request in user route - update user profile (requires valid token)
handler._users.put = (requestProperties, callback) => {
  // validate first name (optional - only update if provided)
  const firstName =
    typeof requestProperties.body.firstName === "string" &&
    requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : false;

  // validate last name (optional - only update if provided)
  const lastName =
    typeof requestProperties.body.lastName === "string" &&
    requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : false;

  // validate phone number (required - identifies the user to update)
  const phone =
    typeof requestProperties.body.phone === "string" &&
    requestProperties.body.phone.trim().length === 11
      ? requestProperties.body.phone
      : false;

  // validate password (optional - only update if provided)
  const password =
    typeof requestProperties.body.password === "string" &&
    requestProperties.body.password.trim().length > 0
      ? requestProperties.body.password
      : false;

  if (!phone) {
    callback(404, { error: "Requested user not found!" });
    return;
  }

  // at least one field must be provided to update
  if (firstName || lastName || password) {
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

    // verify token belongs to the requested phone before updating
    tokenVerify(token, phone, (isUser) => {
      if (!isUser) {
        callback(403, { error: "Authentication failure!" });
        return;
      }

      readData("users", phone, (err, data) => {
        if (err) {
          callback(500, { error: "Could not update the user." });
          return;
        }

        const userData = { ...parseJson(data) };

        // update only the fields that were provided
        if (firstName) userData.firstName = firstName;
        if (lastName) userData.lastName = lastName;
        if (password) userData.password = hash(password);

        updateData("users", phone, userData, (error) => {
          if (error) {
            callback(500, { error: "Could not update the user." });
            return;
          }

          callback(200, { message: "User was updated successfully!" });
        });
      });
    });
  } else {
    callback(400, { error: "At least one field must be provided to update" });
  }
};
// handle delete request in user route - delete user account (requires valid token)
handler._users.delete = (requestProperties, callback) => {
  // validate phone number from query string (must be 11 char string)
  const phone =
    typeof requestProperties.queryObj?.phone === "string" &&
    requestProperties.queryObj?.phone.trim().length === 11
      ? requestProperties.queryObj?.phone
      : false;

  if (!phone) {
    callback(404, { error: "Requested user not found!" });
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

  // verify token belongs to the requested phone before deleting
  tokenVerify(token, phone, (isUser) => {
    if (!isUser) {
      callback(403, { error: "Authentication failure!" });
      return;
    }

    // verify user exists before deleting
    readData("users", phone, (err) => {
      if (err) {
        callback(404, { error: "Requested user was not found!" });
        return;
      }

      // delete the user from storage
      deleteData("users", phone, (err) => {
        if (err) {
          callback(500, { error: "Could not delete requested user!" });
          return;
        }

        callback(200, { message: "User was deleted successfully!" });
      });
    });
  });
};

export const { userHandler } = handler;
