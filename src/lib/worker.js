/*
 * Title: WOrker Library
 * Description: Worker related file
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-24
 */

// dependencies
import { sendSmsSmsBd } from "../helpers/notification.js";
import { parseJson } from "../helpers/utilities.js";
import { listData, readData, updateData } from "./data.js";
import http from "node:http";
import https from "node:https";
// module-scaffolding
const worker = {};

// gather all stored checks and queue each one for validation
worker.getherChecks = () => {
  // read the checks directory listing
  listData("checks", (listErr, allFileNames) => {
    if (listErr && allFileNames?.length <= 0) {
      console.log("Error: Could not find any checks to process!");
      return;
    }

    // read every check file and validate its data
    allFileNames.forEach((fileName) => {
      readData("checks", fileName, (readErr, checkData) => {
        if (readErr && !checkData) {
          console.log(readErr.message);
          return;
        }

        // hand off parsed data for validation
        worker.validateCheckData(parseJson(checkData));
      });
    });
  });
};

// validate check data - normalize state and lastChecked before performing the check
worker.validateCheckData = (orgCheckData) => {
  // invalid or malformed check data
  if (!orgCheckData || !orgCheckData.id) {
    console.log("Error: Check was invalid or not proper formatted.");
    return;
  }

  // default state to down unless it was previously up/down
  orgCheckData.state =
    typeof orgCheckData.state === "string" &&
    ["up", "down"].indexOf(orgCheckData.state) > -1
      ? orgCheckData.state
      : "down";

  // keep the previous lastChecked timestamp if it is valid
  orgCheckData.lastChecked =
    typeof orgCheckData.lastChecked === "number" && orgCheckData.lastChecked > 0
      ? orgCheckData.lastChecked
      : false;

  // proceed with the actual uptime check
  worker.performCheck(orgCheckData);
};

// perform the uptime check - sends an http/https request to the url being monitored
worker.performCheck = (orgCheckData) => {
  // outcome object filled in by the response/error/timeout handlers below
  let checkOutcome = {
    error: false,
    respondCode: null,
    errorValue: null,
  };

  // guard flag so the outcome is processed only once per request
  let outcomeSent = false;

  // split the stored url into protocol, hostname and path parts
  const parseUrl = new URL(orgCheckData.protocol + "://" + orgCheckData.url);

  const hostname = parseUrl.hostname;
  const path = `${parseUrl.pathname}${parseUrl.search}`;

  const requestDetails = {
    protocol: parseUrl.protocol,
    hostname,
    method: orgCheckData.method.toUpperCase(),
    path,
    timeout: orgCheckData.timeoutSec * 1000,
  };

  // choose the http or https module based on the check's protocol
  const chosenProtocol = orgCheckData.protocol === "http" ? http : https;

  // response body is discarded - only the status code matters here
  let req = chosenProtocol.request(requestDetails, (res) => {
    res.on("data", () => {});

    // response completed - record status code and process outcome
    res.on("end", () => {
      checkOutcome.respondCode = res.statusCode;
      if (!outcomeSent) {
        worker.processCheckOutcome(orgCheckData, checkOutcome);
        outcomeSent = true;
      }
    });
  });

  // connection / request error occurred
  req.on("error", (e) => {
    checkOutcome.error = true;
    checkOutcome.errorValue = e;
    if (!outcomeSent) {
      worker.processCheckOutcome(orgCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // request exceeded the configured timeout
  req.on("timeout", () => {
    checkOutcome.error = true;
    checkOutcome.errorValue = "timeout";
    if (!outcomeSent) {
      worker.processCheckOutcome(orgCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  req.end();
};

// process the check outcome - decide new state, persist it, alert user on change
worker.processCheckOutcome = (orgCheckData, checkOutcome) => {
  // a check is up only when no error occurred and status code is in successCode list
  let state =
    !checkOutcome.error &&
    checkOutcome.respondCode &&
    orgCheckData.successCode.indexOf(checkOutcome.respondCode) > -1
      ? "up"
      : "down";

  // alert is wanted only when the state changed since the last check
  const alertWanted = orgCheckData.lastChecked && orgCheckData.state !== state;

  let newCheckData = orgCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // persist the updated check state
  updateData("checks", newCheckData.id, newCheckData, (updateErr) => {
    if (updateErr) {
      console.log(updateErr.message);
      return;
    }

    // state unchanged - no alert needed
    if (!alertWanted) {
      console.log("State remain same, therefore alert not needed.");
      return;
    }

    // notify the owner about the state change
    worker.alertUser(newCheckData);
  });
};

// alert the check owner via SMS about a state change
worker.alertUser = (newCheckData) => {
  let msg = `Alert: Your check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state}`;
  let phone = newCheckData.phone;

  sendSmsSmsBd(phone, msg, (err) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(`User was alerted to a status change via SMS:${msg}`);
  });
};

// run the check loop continuously - gathers and performs checks every 1 minute
worker.loop = () => {
  setInterval(() => {
    worker.getherChecks();
  }, 1000 * 60);
};

// initialize the worker - gather all checks once, then start the loop
worker.init = () => {
  // start worker - gather all checks file
  worker.getherChecks();

  // call the loop for continuous check lookup
  worker.loop();
};

export default worker;
