import { RequestHandler } from "express";
import { Connection } from "mysql2";
import catchError from "../base_modules/catch_error";
import connWithPromise from "../base_modules/conn_with_promise";
import isNumeric, { numericTest } from "../base_modules/is_numeric";
import {
  OkPacketTypeGuard,
  selectTypeGuard,
} from "../base_modules/type_guards/query_results_type_guards";
import sensitiveValue from "../../data/sensitive-value.json";
import { Executable } from "types/types";

const getLoc = async (conn: Connection, id: string) => {
  const sql = "SELECT latitude, longitude FROM user_location WHERE id =?;";
  const params = [id];
  const results = await connWithPromise(conn, sql, params);
  if (!selectTypeGuard(results)) {
    throw "Type mismatched.";
  }
  const result = results[0];
  return result;
};

const updateLoc = async (
  conn: Connection,
  id: any,
  latitude: any,
  longitude: any
) => {
  const sql =
    "UPDATE user_location  SET latitude =?, longitude =? WHERE `id` = ?;";
  const params = [latitude, longitude, id];
  const results = await connWithPromise(conn, sql, params);
  if (!OkPacketTypeGuard(results)) {
    throw "Type mismatched.";
  }
  if (results.affectedRows == 1) {
    return true;
  } else return false;
};
const insertLoc = async (conn: Connection, id: string) => {
  const sql = "INSERT INTO user_location (`id`) VALUES (?);";
  const params = [id];
  const results = await connWithPromise(conn, sql, params);
  if (OkPacketTypeGuard(results)) {
    if (results.affectedRows == 1) {
      return true;
    }
    return false;
  }
  return false;
};

const execute: Executable = (app, conn) => {
  const post: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const id = req.params.id;
      if (!isNumeric(id)) {
        res.status(400).send({
          status: "error",
          errorMassage: "`id` must be numeric.",
        });
        return;
      }
      const latitude = req.body.latitude;
      const longitude = req.body.longitude;
      if (!isNumeric(latitude) || !isNumeric(longitude)) {
        res.status(400).send({
          status: "error",
          errorMassage: "`latitude` and `longitude` must be numeric.",
        });
        return;
      }
      if ((await getLoc(conn, id)) == undefined) {
        await insertLoc(conn, id);
      }
      if (await updateLoc(conn, id, latitude, longitude)) {
        res.send({
          status: "success",
        });
      } else throw "Internal server Error.500";
    });
  const getFromId: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const id = req.params.id;
      const short = req.query.short;
      if (!isNumeric(id)) {
        res.status(400).send({
          status: "error",
          errorMassage: "`id` must be numeric.",
        });
        return;
      }
      const result = await getLoc(conn, id);
      res.send(result);
    });
  const getAll: RequestHandler = (req, res) =>
    catchError(res, async () => {
      if (req.query.key != sensitiveValue.key) {
        throw new Error("key is incorrect 400");
      }
      const sql = "SELECT * FROM user_location;";
      const results = await connWithPromise(conn, sql);
      res.send(results);
    });
  const deleteLoc: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "UPDATE user_location SET latitude = NULL, longitude = NULL WHERE `id` = ?;";
      const id = req.params.id;
      if (!numericTest(id)) {
        res
          .status(400)
          .send({ status: "error", errorMessage: "id is not numeric" });
      }
      const results = await connWithPromise(conn, sql, [id]);
      if (!OkPacketTypeGuard(results)) {
        throw "Type Mismatched.";
      }
      if (results.affectedRows == 1) {
        res.send({ status: "success" });
        return;
      }
    });
  app.post("/location/:id", post);
  app.put("/location/:id", post);
  app.get("/location/:id", getFromId);
  app.get("/location", getAll);
  app.delete("/location/:id", deleteLoc);
  return {
    post: ["/location/:id"],
    put: ["/location/:id"],
    get: ["/location/:id", "/location"],
    delete: ["/location/:id"],
  };
};

export default execute;
