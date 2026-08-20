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
};

environments.production = {
  port: 5000,
  envName: "production",
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
