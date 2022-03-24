// It's referred from 202009-node/record-positions.js at 83a8d7c1e2df81a7fa79cbf1c03014547b0f2de0

import { Executable } from "../types/types";
import { RequestHandler } from "express";
import catchError from "./base_modules/catchError";
import {selectTypeGuard} from "./base_modules/type_guards/query_results_type_guards";
import connWithPromise from "./base_modules/conn_with_promise";

const execute: Executable = async (app, conn) => {
  const getRecordPositions: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const results = await connWithPromise(
        conn,
        "SELECT * FROM record_position;",
        []
      );
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
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
  app.get("/record-position", getRecordPositions);
  app.get("/record-positions", getRecordPositions);

  return {
    get: ["/record-position", "/record-positions"],
  };
};
export default execute;
