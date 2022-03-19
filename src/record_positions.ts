// It's referred from 202009-node/record-positions.js at 83a8d7c1e2df81a7fa79cbf1c03014547b0f2de0

import { Executable } from "../types/types";
import { RequestHandler } from "express";

const execute: Executable = async (app, conn) => {
  const getRecordPositions: RequestHandler = (req, res) => {
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
      console.log("error occurred. Please see the error log.");
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };
  let a = function () {};

  app.get("/record-position", getRecordPositions);
  app.get("/record-positions", getRecordPositions);

  return {
    get: ["/record-position", "/record-positions"],
  };
};
export default execute;
