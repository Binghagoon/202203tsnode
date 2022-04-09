// It's referred from 202009-node/user-location.js at d79410924f350a5a88694c77fb02527abcaf188d

import { Executable } from "../types/types";
import { RequestHandler } from "express";
import catchError from "./base_modules/catch_error";
import {
  OkPacketTypeGuard,
  selectTypeGuard,
} from "./base_modules/type_guards/query_results_type_guards";
import connWithPromise from "./base_modules/conn_with_promise";
import noSufficientArgumentError from "./base_modules/not_sufficient_arguments";

const execute: Executable = async (app, conn) => {
  /**@deprecated changed to POST /location/:id */
  const locationInsert: RequestHandler = async (req, res) =>
    catchError(res, async () => {
      const sql =
        "INSERT INTO user_location (id, latitude, longitude) VALUES (?, ?, ?);";
      const no = req.body.id;
      const name = req.body.name;
      const latitude = req.body.latitude;
      const longitude = req.body.longitude;
      const params = [no, latitude, longitude];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.affectedRows == 1) {
        res.send({
          status: "success",
        });
        console.log(
          "%s is traced.\n first location is (%s, %s)",
          name,
          latitude,
          longitude
        );
      } else throw "Not inserted.";
    });

  /**@deprecated changed to POST /location/:id */
  const locationUpdate: RequestHandler = async (req, res) =>
    catchError(res, async () => {
      const sql =
        "UPDATE user_location SET latitude = ?, longitude = ? WHERE id = ?;";
      const no = req.body.id;
      const latitude = req.body.latitude;
      const longitude = req.body.longitude;
      const params = [latitude, longitude, no];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) throw "Type mismatched";
      if (results.affectedRows == 0) throw "Not affected";
      if (results.affectedRows > 1) throw "More affected.";
      res.send({
        status: "success",
      });
    });

  /**@deprecated changed to DELETE /location/:id */
  const locationDelete: RequestHandler = async (req, res) =>
    catchError(res, async () => {
      const sql = "DELETE FROM user_location WHERE id = ?;";
      const id = req.body.id;
      const params = [id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) throw "Type mismatched";
      if (results.affectedRows == 0) {
        res.send({
          status: "error",
          errorMassage: "value does not existing.",
        });
        return;
      }
      res.send({
        status: "success",
      });
      console.log("someone is untraced.");
    });

  /**@deprecated changed to GET /location/:id */
  const getLocation: RequestHandler = async (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT latitude, longitude FROM user_location WHERE id = ?";
      const no = req.query.id;
      const params = [no];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!selectTypeGuard(results)) throw "Type mismatched";
      res.send(results[0]);
      conn.query(sql, [no], function (err, results) {});
    });

  app.post("/my-location-insert", locationInsert); //will be deprecated
  app.post("/location-insert", locationInsert);
  app.post("/my-location-update", locationUpdate); //will be deprecated
  app.post("/location-update", locationUpdate);
  app.post("/my-location-delete", locationDelete); //will be deprecated
  app.post("/location-delete", locationDelete);
  app.get("/get-location", getLocation);

  return {
    get: ["/get-location"],
    post: [
      "/my-location-insert",
      "/location-insert",
      "/my-location-update",
      "/location-update",
      "/my-location-delete",
      "/location-delete",
    ],
  };
};
export default execute;
