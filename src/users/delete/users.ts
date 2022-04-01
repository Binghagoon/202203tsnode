import { RequestHandler } from "express";
import catchError from "src/base_modules/catch_error";
import connWithPromise from "src/base_modules/conn_with_promise";
import { numericTest } from "src/base_modules/is_numeric";
import noSufficientArgumentError from "src/base_modules/not_sufficient_arguments";
import { OkPacketTypeGuard } from "src/base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";
import sensitiveValue from "../../../data/sensitive-value.json";

const execute: Executable = (app, conn) => {
  const delUsers: RequestHandler = (req, res) =>
    catchError(res, async () => {
      if (req.body.password != sensitiveValue.key) {
        res.status(400).send({
          status: "error",
          errorMassage: "password doesn't matched.",
        });
        return;
      }
      const sql = "DELETE FROM `user` WHERE id = ?;";
      const id = req.params.id;
      numericTest(id, "id");
      const params = [id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (OkPacketTypeGuard(results)) {
        if (results.affectedRows == 1) {
          res.send({ status: "success" });
        }
        res.send({ status: "error", errorMessage: "Query doesn't affected." });
      } else {
        throw "Type mismatched.";
      }
    });
  app.delete("/users/:id", delUsers);
  return {
    delete: ["/users/:id"],
  };
};
export default execute;
