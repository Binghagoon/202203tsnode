import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import { numericTest } from "../../base_modules/is_numeric";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";
import { selectTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";

const execute: Executable = (app, conn) => {
  const getUsersFromId: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT *  FROM user_view WHERE id = ?";
      const id = req.params.id;
      noSufficientArgumentError([id]);
      numericTest(id, "id");
      const results = await connWithPromise(conn, sql, [id]);
      if (selectTypeGuard(results)) {
        const result = results[0];
        res.send(result);
      } else {
        throw "Type mismatched";
      }
    });
  app.get("/users/:id", getUsersFromId);
  return {
    get: ["/users/:id"],
  };
};
export default execute;