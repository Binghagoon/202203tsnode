// It's refered from 202009-node/record-positions.js at 83a8d7c1e2df81a7fa79cbf1c03014547b0f2de0

import { AsyncExecutable,AppCallback } from "../types/types";

const execute: AsyncExecutable = async (app, conn) => {
  const getrecordPositions: AppCallback = (req, res) => {
    try {
      conn.query("SELECT * FROM record_position;", function (err, results) {
        if (err) throw err;
        if (!Array.isArray(results)) return;
        results.map(function (value, index, array) {
          if ("latitude" in value && "longitude" in value) {
            value.lat = value.latitude;
            value.lng = value.longitude;
          } else {
            console.error("Result rows don't have latitude and longitude.");
          }
        });
        res.send(results);
      });
    } catch (e) {
      console.error(e);
      console.log("error occured please see error log.");
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  }
  let a = function(){
    
  }

  app.get("/record-position", getrecordPositions);
  app.get("/record-positions", getrecordPositions);

  return {
    get: ["/record-position", "/record-positions"],
  };
};
export default execute;
