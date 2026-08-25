/*
 * Title: Notification Library
 * Description: Handle all main functions of notification
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-24
 */

// dependencies

import https from "node:https";
import queryString from "node:querystring";
import { env } from "./environments.js";

// module scaffolding
const notification = {};

// SMS.BD error messages

const smsBdErrors = {
  400: "The request was rejected due to a missing or invalid parameter.",
  403: "You don't have permission to perform this request.",
  404: "The requested resource was not found.",
  405: "Authorization required.",
  409: "Unknown error occurred on the server.",
  410: "Account expired.",
  411: "Reseller account expired or suspended.",
  412: "Invalid schedule.",
  413: "Invalid Sender ID.",
  414: "Message is empty.",
  415: "Message is too long.",
  416: "No valid phone number found.",
  417: "Insufficient balance.",
  420: "Message content is blocked.",
  421: "You can only send SMS to your registered phone number until the first balance recharge.",
};

// send SMS using SMS.BD REST API

notification.sendSmsSmsBd = (phone, msg, callback) => {
  // input validation

  const userPhone =
    typeof phone === "string" && phone.trim().length === 11
      ? phone.trim()
      : false;

  const userMsg =
    typeof msg === "string" &&
    msg.trim().length > 0 &&
    msg.trim().length <= 1600
      ? msg.trim()
      : false;

  if (!userPhone || !userMsg) {
    callback("Given parameter was missing or invalid!");
    return;
  }

  // build SMS.BD payload

  const payload = {
    api_key: env.smsBd.apiKey,
    msg: userMsg,
    to: `88${userPhone}`,
  };

  // encode payload

  const stringifyPayload = queryString.stringify(payload);

  // configure request

  const requestDetails = {
    hostname: "api.sms.net.bd",
    method: "POST",
    path: "/sendsms",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringifyPayload),
    },
  };

  // create request

  const req = https.request(requestDetails, (res) => {
    let responseData = "";

    // collect response data

    res.on("data", (chunk) => {
      responseData += chunk;
    });

    // process response

    res.on("end", () => {
      let result;

      try {
        result = JSON.parse(responseData);
      } catch {
        callback(`Invalid response from SMS.BD: ${responseData}`);
        return;
      }

      // success

      if (result.error === 0) {
        callback(false);
        return;
      }

      // known SMS.BD error

      const errorMessage = smsBdErrors[result.error] || "Unknown SMS.BD error.";

      callback(`SMS.BD Error ${result.error}: ${errorMessage}`);
    });
  });

  // handle network error

  req.on("error", (error) => {
    callback(error);
  });

  // send request

  req.write(stringifyPayload);
  req.end();
};

export const { sendSmsSmsBd } = notification;
