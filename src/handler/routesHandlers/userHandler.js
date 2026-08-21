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

// module scaffolding
const handler = {};

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

// handle get request in user route
handler._users.get = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.queryObj?.phone === "string" &&
    requestProperties.queryObj?.phone.trim().length === 11
      ? requestProperties.queryObj?.phone
      : false;

  if (phone) {
    readData("users", phone, (err, data) => {
      if (err) {
        callback(500, { error: "Requested user not found!" });
        return;
      }

      const user = { ...parseJson(data) };
      delete user.password;
      callback(200, user);
    });
  } else {
    callback(404, { error: "Requested user not found!" });
  }
};

// TODO: Check authentication before each request

// handle post request in user route
handler._users.post = (requestProperties, callback) => {
  const firstName =
    typeof requestProperties.body.firstName === "string" &&
    requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : false;

  const lastName =
    typeof requestProperties.body.lastName === "string" &&
    requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : false;

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

  const tosAgreement =
    typeof requestProperties.body.tosAgreement === "boolean" &&
    requestProperties.body.tosAgreement === true
      ? requestProperties.body.tosAgreement
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    readData("users", phone, (error) => {
      if (error) {
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
    callback(404, {
      error: "You have a problem in your request.",
    });
  }
};
// handle put request in user route
handler._users.put = (requestProperties, callback) => {
  const firstName =
    typeof requestProperties.body.firstName === "string" &&
    requestProperties.body.firstName.trim().length > 0
      ? requestProperties.body.firstName
      : false;

  const lastName =
    typeof requestProperties.body.lastName === "string" &&
    requestProperties.body.lastName.trim().length > 0
      ? requestProperties.body.lastName
      : false;

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

  if (!phone) {
    callback(404, { error: "Requested user not found!" });
    return;
  }

  if (firstName || lastName || password) {
    readData("users", phone, (err, data) => {
      if (err) {
        callback(500, { error: "Could not update the user." });
        return;
      }

      const userData = { ...parseJson(data) };

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
  }
};
// handle delete request in user route
handler._users.delete = (requestProperties, callback) => {
  const phone =
    typeof requestProperties.queryObj.phone === "string" &&
    requestProperties.queryObj.phone.trim().length === 11
      ? requestProperties.queryObj.phone
      : false;

  if (!phone) {
    callback(404, { error: "Requested user not found!" });
    return;
  }

  deleteData("users", phone, (err) => {
    if (err) {
      callback(500, { error: "Could not delete requested user!" });
      return;
    }

    callback(200, { message: "User was deleted successfully!" });
  });
};

export const { userHandler } = handler;
