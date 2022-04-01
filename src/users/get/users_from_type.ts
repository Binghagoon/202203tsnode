import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";
import objectKeyRename from "../../base_modules/objectKeyRename";
import objectKeyCopy from "../../base_modules/object_key_copy";
import { selectTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";

const execute: Executable = (app, conn) => {
  const getStudentInfo: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "SELECT id, student_number, major FROM user_view WHERE `id`=?";
      const id = req.query.id;
      noSufficientArgumentError([id]);
      const results = await connWithPromise(conn, sql, [id]);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      const result = results[0];
      objectKeyRename(result, "student_number", "studentNumber");
      res.send(result);
    });

  const getDriverInfo: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "SELECT license, carname, car_id, phone FROM user_view WHERE `id`=?";
      const id = req.query.id;
      noSufficientArgumentError([id]);
      const results = await connWithPromise(conn, sql, [id]);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      const result = results[0];

      objectKeyRename(result, "car_id", "carId");

      objectKeyCopy(result, "phone", "phoneNumber");
      objectKeyCopy(result, "phone", "phonenumber");
      objectKeyCopy(result, "carId", "carid");
      res.send(result);
    });

  const getUsers: RequestHandler = (req, res, next) =>
    catchError(res, async () => {
      const type = req.query.type;
      if (type == "driver") {
        return getDriverInfo(req, res, next);
      } else if (type == "student") {
        return getStudentInfo(req, res, next);
      } else {
        res.status(400).send({
          status: "error",
          errorMessage: "`type` must be either 'driver' or 'student'",
        });
        return;
      }
    });

  app.get("/users/:id", getUsers);
};
export default execute;