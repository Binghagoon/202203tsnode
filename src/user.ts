import express, { Request, Response, NextFunction, Express } from "express";
import { QueryError, Connection } from "mysql2";
import { Executable, PathObject } from "../types/types";
function objectKeyRename(
  obj: { [x: string]: any },
  originalName: string,
  changedName: string
) {
  obj[changedName] = obj[originalName];
  delete obj[originalName];
}

function treatError(err: QueryError | null, res: Response) {
  if (!err) return 0;
  console.log(err.stack);
  if (res) {
    res.send({
      status: "error",
      errorMessage: "not defined error",
    });
  }
  debugger;
  return 1;
}

function noSufficientArgumentError(
  args: any[],
  res: express.Response<any, Record<string, any>>
) {
  //to be tested.
  let b = false;
  for (const val of args) {
    b = b || val == undefined;
  }
  if (b) {
    res.send({
      status: "error",
      errorMessage: "not sufficient arguments.",
    });
    return true;
  }
  return false;
}

const execute = async function (
  app: Express,
  conn: Connection
): Promise<PathObject | void> {
  async function getId(req: Request, res: Response) {
    try {
      let sql = "SELECT `id` FROM `user` WHERE username = ?";
      let username = req.query.username;
      conn.query(sql, [username], function (err, results) {
        if (!Array.isArray(results)) return;
        let result = results[0];
        objectKeyRename(result, "no", "id");
        res.send(results[0]);
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  }

  async function getUserInfo(req: Request, res: Response) {
    try {
      let sql = "SELECT *  FROM user_view WHERE id = ?";
      let id = req.query.id;
      if (noSufficientArgumentError([id], res)) {
        return;
      }
      conn.query(sql, [id], function (err, results) {
        if (!Array.isArray(results)) return;
        if (treatError(err, res)) {
          return;
        }
        let result = results[0];
        res.send(result);
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  }

  async function getStudentInfo(req: Request, res: Response) {
    try {
      let sql = "SELECT id, student_number, major FROM user_view WHERE `id`=?";
      let id = req.query.id;
      debugger;
      conn.query(sql, [id], function (err, results) {
        if (!Array.isArray(results)) return;
        if (treatError(err, res)) {
          return;
        }
        let result = results[0];
        objectKeyRename(result, "student_number", "studentNumber");
        res.send(result);
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  }

  async function getDriverInfo(req: Request, res: Response) {
    try {
      let sql = "SELECT id, licence, carname FROM user_view WHERE `id`=?";
      let id = req.query.id;
      conn.query(sql, [id], function (err, results) {
        if (!Array.isArray(results)) return;
        if (treatError(err, res)) {
          return;
        }
        let result = results[0];
        res.send(result);
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  }

  async function postUpdateStudentInfo(req: Request, res: Response) {
    try {
      let sql =
        "UPDATE student_info SET student_number = ?, major = ? WHERE `id` = ?";
      let id = req.body.id;
      let studentNumber = req.body.studentNumber;
      let major = req.body.major;
      let params = [studentNumber, major, id];
      if (noSufficientArgumentError(params, res)) {
        return;
      }
      conn.query(sql, params, function (err, results) {
        if (!Array.isArray(results)) return;
        if (treatError(err, res)) {
          return;
        }
        res.send({
          status: "success",
        });
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  }

  async function postUpdateDriverInfo(req: Request, res: Response) {
    try {
      let sql = "UPDATE driver_info SET licence = ?, name = ? WHERE `id` = ?";
      let id = req.body.id;
      let licence = req.body.licence;
      let name = req.body.carName;
      let params = [licence, name, id];
      if (noSufficientArgumentError(params, res)) {
        return;
      }
      conn.query(sql, params, function (err, results) {
        if (!Array.isArray(results)) return;
        if (treatError(err, res)) {
          return;
        }
        res.send({
          status: "success",
        });
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  }

  app.get("/get-id", getId);
  app.get("/get-user-info", getUserInfo);
  app.get("/get-student-info", getStudentInfo);
  app.get("/get-driver-info", getDriverInfo);
  app.post("/update-student-info", postUpdateStudentInfo);
  app.post("/update-driver-info", postUpdateDriverInfo);

};
export default execute;
