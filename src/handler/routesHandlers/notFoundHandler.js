/*
 * Title: Not Found Handler
 * Description: Handle 404 route
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-19
 */

// module scaffolding
const handler = {};

// fallback handler - responds with 404 for any unmatched route
handler.notFoundHandler = (requestProperties, callback) => {
  console.log(requestProperties);
  callback(404, {
    message: "Your requested URL not found!",
  });
};

export const { notFoundHandler } = handler;
