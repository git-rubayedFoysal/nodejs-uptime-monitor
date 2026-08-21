/*
 * Title: Utilities
 * Description: Handle utilities function
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-21
 */

// dependencies
import { createHmac } from "node:crypto";
import { env } from "./environments.js";

// module - scaffolding
const utilities = {};

utilities.parseJson = (jsonString) => {
  let output;
  try {
    output = JSON.parse(jsonString);
  } catch {
    output = {};
  }

  return output;
};

utilities.hash = (str) => {
  if (typeof str === "string" && str.length > 0) {
    let hash = createHmac("sha256", env.secreteKey).update(str).digest("hex");
    return hash;
  } else {
    return false;
  }
};

export const { parseJson, hash } = utilities;
