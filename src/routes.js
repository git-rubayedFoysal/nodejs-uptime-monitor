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
import { checkHandler } from "./handler/routesHandlers/checkHandler.js";

// route table - maps trimmed url path to its handler
const routes = {
  sample: sampleHandler,
  user: userHandler,
  token: tokenHandler,
  check: checkHandler,
};

export default routes;
