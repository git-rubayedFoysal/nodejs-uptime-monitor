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

// TODO: remove it latter
// createData(
//   "test",
//   "newFile",
//   { country: "Bangladesh", language: "Bangla" },
//   (error) => {
//     if (error) {
//       console.error(error.message);
//       return;
//     }

//     console.log("Data created successfully!");
//   },
// );

// readData("test", "newFile", (error, data) => {
//   if (error) {
//     console.error(error.message);
//     return;
//   }

//   console.log(data);
// });

// updateData(
//   "test",
//   "newFile",
//   { country: "India", language: "Hindi" },
//   (error) => {
//     if (error) {
//       console.error(error.message);
//       return;
//     }

//     console.log("Data updated successfully!");
//   },
// );

// deleteData("test", "newFile", (error) => {
//   if (error) {
//     console.log(error.message);
//     return;
//   }

//   console.log("Data deleted successfully!");
// });

// create server
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
