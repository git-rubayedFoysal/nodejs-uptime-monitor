/*
 * Title: Uptime Monitoring Application
 * Description: A RESTFull API to monitor up or down time of user defined links
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-19
 */

// dependencies
import http from "node:http";
import { handleReqRes } from "./helpers/handleReqRes.js";

// app object - module scaffolding
const app = {};

// configuration
app.config = {
  port: 3000,
};

// create server
app.createServer = () => {
  const server = http.createServer(app.handleReqRes);

  server.listen(app.config.port, () => {
    console.log(`Server Started at http://localhost:${app.config.port}`);
  });
};

// handle Request Response
app.handleReqRes = handleReqRes;

// start server
app.createServer();
