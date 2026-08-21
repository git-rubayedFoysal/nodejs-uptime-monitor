/*
 * Title: Routes
 * Description: Application Routes
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-19
 */

// Dependencies
import { sampleHandler } from "./handler/routesHandlers/sampleHandler.js";
import { userHandler } from "./handler/routesHandlers/userHandler.js";

const routes = {
  sample: sampleHandler,
  user: userHandler,
};

export default routes;
