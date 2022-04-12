import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";
import { selectTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";

const execute: Executable = (app, conn) => {
  const getId: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT `id` FROM `user` WHERE username = ?";
      const username = req.query.username;
      noSufficientArgumentError([username]);
      const results = await connWithPromise(conn, sql, [username]);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      let result = results[0];
      res.send(result);
    });
  app.get("/users/id", getId);
  return {
    get: ["/users/id"],
  }
}
export default execute;