/*
 * Title: Not Found Handler
 * Description: Handle 404 route
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-19
 */

// module scaffolding
const handler = {};

handler.notFoundHandler = (requestProperties, callback) => {
  console.log(requestProperties);
  callback(404, {
    massage: "Your requested URL not found!",
  });
};

export const { notFoundHandler } = handler;
