/*
 * Title: Uptime Monitoring Application
 * Description: A RESTful API for monitoring the uptime and downtime of user-defined URLs.
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-19
 */

// dependencies
import http from "node:http";
import { handleReqRes } from "./helpers/handleReqRes.js";
import { env } from "./helpers/environments.js";
// import { deleteData } from "./lib/data.js";

// app object - module scaffolding
const app = {};

app.createServer = () => {
  const server = http.createServer(app.handleReqRes);

  server.listen(env.port, () => {
    console.log(`Server Started at http://localhost:${env.port}`);
  });
};

// handle Request Response
app.handleReqRes = handleReqRes;

// start server
app.createServer();
