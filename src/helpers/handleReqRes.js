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
import { parseJson } from "./utilities.js";

// module scaffolding
const handler = {};

// unified request-response handler - parses the request, routes it, sends a json response
handler.handleReqRes = (req, res) => {
  // parse the incoming url into path, query params and headers
  const parsedURL = new URL(req.url, `http://${req.headers.host}`);
  const path = parsedURL.pathname;
  const method = req.method.toLowerCase();
  // strip leading/trailing slashes to get a clean route key
  const trimmedPath = path.replace(/^\/|\/$/g, "");
  const queryObj = Object.fromEntries(parsedURL.searchParams);
  const headersObj = req.headers;

  // bundle everything a route handler may need
  const requestProperties = {
    parsedURL,
    path,
    trimmedPath,
    queryObj,
    headersObj,
    method,
  };

  // decode the request body chunk by chunk
  const decoder = new StringDecoder("utf8");
  let realData = "";

  // choose the matching route handler or fall back to the 404 handler
  const chosenRoute = routes[trimmedPath]
    ? routes[trimmedPath]
    : notFoundHandler;

  req.on("data", (buffer) => {
    realData += decoder.write(buffer);
  });

  // body fully received - execute the chosen route handler and respond
  req.on("end", () => {
    realData += decoder.end();

    chosenRoute(
      { ...requestProperties, body: parseJson(realData) },
      (statusCode, payload) => {
        // enforce safe defaults for status code and payload
        statusCode = typeof statusCode === "number" ? statusCode : 500;
        payload = typeof payload === "object" ? payload : {};

        const payloadString = JSON.stringify(payload);

        // send the final json response
        res.setHeader("Content-type", "application/json");
        res.writeHead(statusCode);
        res.end(payloadString);
      },
    );
  });

  req.on("error", (error) => {
    console.error(error);
    throw error;
  });
};

export const { handleReqRes } = handler;
