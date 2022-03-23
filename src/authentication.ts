import { RequestHandler } from "express";
import { Executable } from "../types/types";
import {
  noSufficientArgumentError,
  treatError,
  connWithPromise,
  catchError,
  selectTypeGuard,
  OkPacketTypeGuard,
} from "./base_module";

const execute: Executable = async function (app, conn) {
  const getSignIn: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "SELECT u.id, rl.role FROM  `user` u LEFT OUTER JOIN role_list rl ON u.role = rl.id WHERE username = ? AND (pw IS NULL OR  pw = ?)";
      const arg = req.query;
      const params = [arg.username, arg.pw];
      if (noSufficientArgumentError(params, res)) {
        return;
      }
      const results = await connWithPromise(conn, sql, params);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.length == 0) {
        res.status(400).send({ status: "fail" });
      } else if (results[0]["role"] == null) {
        res.status(401).send({ status: "notAllowed" });
      } else {
        let result = results[0];
        res.send({
          role: result.role,
          id: result.id,
        });
      }
    });

  const postSignUp: RequestHandler = (req, res) =>
    catchError(res, async () => {
      //POST
      const sql =
        "INSERT INTO user (realname, username, email, phone) VALUES (?, ?, ?, ?);";
      const arg = req.body;
      const params = [arg.realname, arg.username, arg.email, arg.phone];
      noSufficientArgumentError(params);
      console.log("Sign up from" + arg.username);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      console.log("Registered.");
      res.status(200).send({
        status: "success",
      });
    });

  const putSignUpAllow: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const args = req.body;
      const type = args.type;
      const id = args.id;
      let sql = "",
        params: any[] = [],
        updateUserResults;
      if (type == "student") {
        sql =
          "INSERT INTO student_info (id, student_number, major) VALUES(?, ?, ?);";
        params = [args.id, args.studentNumber, args.major];
        updateUserResults = await connWithPromise(
          conn,
          "UPDATE `user` SET role = 1 WHERE id = ?",
          [args.id]
        );
      } else if (type == "driver") {
        sql = "INSERT INTO driver_info (id, license, `name`) VALUES (?, ?, ?);";
        updateUserResults = await connWithPromise(
          conn,
          "UPDATE `user` SET role = 2 WHERE id = ?",
          [args.id]
        );
        params = [args.id, args.license, args.carname];
      } else if (type == "administrator") {
        //TBD
        return;
      }
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        return;
      }
      if (results.affectedRows == 1) {
        res.send({
          status: "success",
        });
      } else {
        res.send({
          status: "error",
          errorMessage: "Operation is not affected.",
        });
      }
    });
  app.get("/sign-in", getSignIn);
  app.post("/sign-up", postSignUp);
  app.put("/sign-up-allow", putSignUpAllow);
  app.post("/sign-up-allow", putSignUpAllow);

  return {
    put: ["/sign-up-allow"],
    get: ["/sign-in"],
    post: ["/sign-up", "/sign-up-allow"],
  };
};
export default execute;
