/*
 * Title: Environments
 * Description: Handle environments related work
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-20
 */

// module scaffolding
const environments = {};

environments.staging = {
  port: 3000,
  envName: "staging",
  secreteKey: "stagingKey",
  maxCheck: 5,
  smsBd: {
    apiKey: process.env.SMS_BD_API_KEY,
  },
};

environments.production = {
  port: 5000,
  envName: "production",
  secreteKey: "productionKey",
  maxCheck: 5,
  smsBd: {
    apiKey: process.env.SMS_BD_API_KEY,
  },
};

// determine which environments passed
const currentEnvironment =
  typeof process.env.NODE_ENV === "string" ? process.env.NODE_ENV : "staging";

// export corresponding environment
const environmentToExport =
  typeof environments[currentEnvironment] === "object"
    ? environments[currentEnvironment]
    : environments.staging;

export const env = environmentToExport;
