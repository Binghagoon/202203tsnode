import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import { numericTest } from "../../base_modules/is_numeric";
import { selectTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";
import objectKeyRename from "../../base_modules/objectKeyRename";
import { Connection } from "mysql2";

const getRole = async (conn: Connection, id: any) => {
  const sql = "SELECT role FROM user_view WHERE `id` = ?;";
  const results = await connWithPromise(conn, sql, [id]);
  if (selectTypeGuard(results)) {
    const role = results[0].role;
    if (typeof role != "string") throw "Type mismatched.";
    return role.toLowerCase();
  }
  return "undefined";
}

const getStudent = async (conn: Connection, id: string) => {
  const sql = "SELECT student_number, major FROM  student_info WHERE id = ?;";
  const results = await connWithPromise(conn, sql, [id]);
  if (!selectTypeGuard(results)) {
    throw "Type mismatched";
  }
  const result = results[0];
  objectKeyRename(result, "student_number", "studentNumber");
  return result;
}
const getDriver = async (conn: Connection, id: string) => {
  const sql = "SELECT license, `name` car_name, car_id FROM  driver_info WHERE id = ?;";
  const results = await connWithPromise(conn, sql, [id]);
  if (!selectTypeGuard(results)) {
    throw "Type mismatched";
  }
  const result = results[0];
  objectKeyRename(result, "car_name", "carName");
  objectKeyRename(result, "car_id", "carId");
  return result;
}
const getGeneral = async (conn: Connection, id: string) => {
  const sql = "SELECT *  FROM user_view WHERE id = ?";
  numericTest(id, "id");
  const results = await connWithPromise(conn, sql, [id]);
  if (!selectTypeGuard(results)) {
    throw "Type mismatched";
  }
  const result = results[0];
  objectKeyRename(result, "student_number", "studentNumber");
  objectKeyRename(result, "car_id", "carId");
  return result;
}

const execute: Executable = (app, conn) => {
  const getUsersFromId: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const type = req.query.type;
      const id = req.params.id;
      const role = await getRole(conn, id);
      if (type == "driver" && role == "driver") {
        res.send(await getDriver(conn, id));
      } else if (type == "student" && role == "student") {
        res.send(await getStudent(conn, id));
      } else if (type == undefined) {
        res.send(await getGeneral(conn, id));
      } else if (type != role) {
        res.status(400).send({ status: "error", errorMessage: "Role did not matched" });
      }
    });
  app.get("/users/:id", getUsersFromId);
  return {
    get: ["/users/:id"],
  };
};
export default execute;