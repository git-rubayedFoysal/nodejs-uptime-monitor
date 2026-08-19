/*
 * Title: Handle Request Response
 * Description: Handle Request Response
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-19
 */

// dependencies
import { StringDecoder } from "node:string_decoder";
import routes from "../routes.js";
import { notFoundHandler } from "../handler/routesHandlers/notFoundHandler.js";

// module scaffolding
const handler = {};

// handle Request Response
handler.handleReqRes = (req, res) => {
  const parsedURL = new URL(req.url, `http://${req.headers.host}`);
  const path = parsedURL.pathname;
  const method = req.method.toLowerCase();
  const trimmedPath = path.replace(/^\/|\/$/g, "");
  const queryObj = Object.fromEntries(parsedURL.searchParams);
  const headersObj = req.headers;

  const requestProperties = {
    parsedURL,
    path,
    trimmedPath,
    queryObj,
    headersObj,
    method,
  };

  const decoder = new StringDecoder("utf8");
  let realData = "";

  const chosenRoute = routes[trimmedPath]
    ? routes[trimmedPath]
    : notFoundHandler;

  chosenRoute(requestProperties, (statusCode, payload) => {
    statusCode = typeof statusCode === "number" ? statusCode : 500;
    payload = typeof payload === "object" ? payload : {};

    const payloadString = JSON.stringify(payload);

    // return the final response
    res.writeHead(statusCode);
    res.end(payloadString);
  });

  req.on("data", (buffer) => {
    realData += decoder.write(buffer);
  });

  req.on("end", () => {
    realData += decoder.end();
    console.log(realData);

    // response handle
    res.end("Hello Programmer!");
  });
};

export const { handleReqRes } = handler;
