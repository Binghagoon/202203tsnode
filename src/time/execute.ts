import { RequestHandler } from "express";
import catchError from "../base_modules/catch_error";
import connWithPromise from "../base_modules/conn_with_promise";
import noSufficientArgumentError from "../base_modules/not_sufficient_arguments";
import {
  OkPacketTypeGuard,
  selectTypeGuard,
} from "../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";
import allowTime from "../base_modules/allow_times";
import getExe from "./get";

const execute: Executable = async (app, conn) => {
  const putAllowTimes: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "UPDATE allow_time SET start = ?, end = ?, comment = ? WHERE id = ?;";
      const body = req.body;
      const params = [body.start, body.end, body.comment, req.params.id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type Mismatched.";
      }
      if (results.affectedRows == 1) {
        await allowTime.initialize(conn,true);
        res.send({ status: "success" });

      } else {
        res.send({
          status: "error",
          errorMessage: "There is no value such id.",
        });
      }
    });

  const postAllowTimes: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "INSERT INTO allow_time (start,end,comment) VALUES (?,?,?);";
      const body = req.body;
      const params = [body.start, body.end, body.comment];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type Mismatched.";
      }
      if (results.affectedRows == 1) {
        const start = parseInt(body.start);
        const end = parseInt(body.end);
        const id = parseInt(req.params.id);
        allowTime.addAllowMinute([start, end, id]);
        res.send({ status: "success", id: results.insertId });
      } else {
        res.send({ status: "error", errorMassage: "Not affected." });
      }
    });
  const deleteAllowTimes: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "DELETE FROM allow_time WHERE id = ?;";
      const params = [req.params.id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type Mismatched.";
      }
      if (results.affectedRows == 1) {
        await allowTime.initialize(conn,true);
        res.send({ status: "success" });
      } else {
        res.send({ status: "error", errorMassage: "Not affected." });
      }
    });

  await allowTime.initialize(conn);

  const get = await getExe(app, conn);
  if (typeof get == "object") {
    app.put("/allow-times/:id", putAllowTimes);
    app.post("/allow-times", postAllowTimes);
    app.delete("/allow-times/:id", deleteAllowTimes);
    return {
      get: get.get,
      put: ["/allow-times/:id"],
      post: ["/allow-times"],
      delete: ["/allow-times/:id"],
    };
  } else throw new Error("time/get has not executed.");
};
export default execute;
