/*
 * Title: Sample Handler
 * Description: Handle Sample Route
 * Author: Rubayed Ahmed Foysal
 * Date: 2026-08-19
 */

// module scaffolding
const handler = {};

handler.sampleHandler = (requestProperties, callback) => {
  console.log(requestProperties);

  callback(200, {
    message: "This is a sample route.",
  });
};

export const { sampleHandler } = handler;
