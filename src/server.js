/*
 * Title: Server
 * Description: Server create here.
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-24
 */

// dependencies
import http from "node:http";
import { handleReqRes } from "./helpers/handleReqRes.js";
import { env } from "./helpers/environments.js";

// app object - module scaffolding
const server = {};

// create and start the http server
server.createServer = () => {
  // wire the unified request-response handler into node's http server
  const myServer = http.createServer(server.handleReqRes);

  // listen on the port defined by the current environment
  myServer.listen(env.port, () => {
    console.log(`Server Started at http://localhost:${env.port}`);
  });
};

// reuse the shared request-response handler from helpers
server.handleReqRes = handleReqRes;

// initialize the server
server.init = () => {
  // start server
  server.createServer();
};

export default server;
