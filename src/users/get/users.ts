import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import { selectTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";
import sensitiveValue from "../../../data/sensitive-value.json";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";
import objectKeyRename from "../../base_modules/objectKeyRename";

const execute: Executable = (app, conn) => {
  const getUsers: RequestHandler = (req, res) =>
    catchError(res, async () => {
      if (req.query.key != sensitiveValue.key) {
        throw new Error("key is incorrect 400");
      }
      const sql = "SELECT * FROM user_view;";
      const results = await connWithPromise(conn, sql, []);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      results.map(value => {
        objectKeyRename(value, "student_number", "studentNumber");
        objectKeyRename(value, "car_id", "carId");
      });

      res.send(results);
    });
  app.get("/users", getUsers);
  return {
    get: ["/users"],
  };
};
export default execute;
