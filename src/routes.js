/*
 * Title: Routes
 * Description: Application Routes
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-19
 */

// Dependencies
import { sampleHandler } from "./handler/routesHandlers/sampleHandler.js";
import { userHandler } from "./handler/routesHandlers/userHandler.js";
import { tokenHandler } from "./handler/routesHandlers/tokenHandler.js";

const routes = {
  sample: sampleHandler,
  user: userHandler,
  token: tokenHandler,
};

export default routes;
