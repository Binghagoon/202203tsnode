import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import { numericTest } from "../../base_modules/is_numeric";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";
import { OkPacketTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";

const execute: Executable = (app, conn) => {
  const putStudentInfo: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "UPDATE student_info SET student_number = ?, major = ? WHERE `id` = ?";
      const id = req.params.id;
      const studentNumber = req.body.studentNumber;
      const major = req.body.major;
      const params = [studentNumber, major, id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.affectedRows == 1) {
        res.send({
          status: "success",
        });
      } else {
        res.send({
          status: "error",
          errorMassage: "Not affected",
        });
      }
    });
  const putDriverInfo: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "UPDATE driver_info SET license = ?, name = ? WHERE `id` = ?";
      const id = req.params.id;
      const license = req.body.license;
      const name = req.body.carName;
      const params = [license, name, id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.affectedRows == 1) {
        res.send({
          status: "success",
        });
      } else {
        res.send({
          status: "error",
          errorMassage: "Not affected",
        });
      }
    });
  const putUsers: RequestHandler = (req, res, next) =>
    catchError(res, async () => {
      const type = req.body.type;
      numericTest(req.params.id);
      if (type == "student") {
        return putStudentInfo(req, res, next);
      } else if (type == "driver") {
        return putDriverInfo(req, res, next);
      } else {
        res.status(400).send({
          status: "error",
          errorMessage: "`type` must be either 'driver' or 'student'",
        });
        return;
      }
    });
  app.put("/users/:id", putUsers);
  return {
    put: ["/users/:id"],
  };
};
export default execute;
