import { RequestHandler } from "express";
import allowTime from "../base_modules/allow_times";
import catchError from "../base_modules/catch_error";
import connWithPromise from "../base_modules/conn_with_promise";
import noSufficientArgumentError from "../base_modules/not_sufficient_arguments";
import { selectTypeGuard } from "../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";

const execute: Executable = (app, conn) => {
  const checkTime: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const queryMinute = req.query.minute;
      if (typeof queryMinute != "string") {
        res.send({ status: "error", errorMessage: "Time must be string." });
        return;
      }
      const minute = parseInt(queryMinute);
      if (!allowTime.isMinuteValid(minute)) {
        res.send({
          status: "error",
          errorMessage:
            "Time must be valid whose value is between 0 and 12 * 2 * 60.",
        });
        return;
      }
      const result = allowTime.isAllowMinute(minute);
      res.send({ status: result });
    });
  const getAllowTimesAll: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT * FROM allow_time;";
      const results = await connWithPromise(conn, sql);
      res.send(results);
    });

  const getAllowTimes: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT * FROM allow_time WHERE id = ?;";
      const params = [req.params.id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (selectTypeGuard(results)) {
        res.send(results[0]);
      } else {
        res.send({ status: "error", errorMassage: "This is not select" });
      }
    });

  app.get("/allow-times/check", checkTime);
  app.get("/allow-times", getAllowTimesAll);
  app.get("/allow-times/:id", getAllowTimes);

  return {
    get: ["/allow-times/check", "/allow-times", "/allow-times/:id"],
  };
};

export default execute;
