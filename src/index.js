/*
 * Title: Uptime Monitoring Application
 * Description: A RESTful API for monitoring the uptime and downtime of user-defined URLs.
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-19
 */

// dependencies
import server from "./server.js";
import worker from "./lib/worker.js";

// app object - module scaffolding
const app = {};

app.init = () => {
  // start the server
  server.init();

  // start the worker
  worker.init();
};

app.init();

export default app;
