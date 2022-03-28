import { RequestHandler } from "express";
import { Executable, QueryResults } from "../types/types";
import catchError from "./base_modules/catchError";
import { getRole } from "./base_modules/get_specific_data";
import connWithPromise from "./base_modules/conn_with_promise";
import noSufficientArgumentError from "./base_modules/not_sufficient_arguments";
import {
  OkPacketTypeGuard,
  selectTypeGuard,
} from "./base_modules/type_guards/query_results_type_guards";

const getSqlParams = (type: string) => {};
const execute: Executable = async function (app, conn) {
  const getSignIn: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "SELECT u.id, rl.role, u.realname FROM  `user` u" +
        " LEFT OUTER JOIN role_list rl ON u.role = rl.id " +
        "WHERE username = ? AND (pw IS NULL OR  pw = ?)";
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
        const result = results[0];
        res.send({
          role: result.role,
          id: result.id,
          realname: result.realname,
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
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
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
        updateUserResults: QueryResults;
      noSufficientArgumentError([id], res);
      const originRole = await getRole(id, conn);
      if (originRole != null && args.force != "true") {
        res.send({
          status: "error",
          errorMassage: "There is already defined role. Role is " + originRole,
        });
        return;
      }
      if (type == "student") {
        sql =
          "INSERT INTO student_info (id, student_number, major) VALUES(?, ?, ?);";
        params = [args.id, args.studentNumber, args.major];
        updateUserResults = await connWithPromise(
          conn,
          "UPDATE `user` SET role = 1 WHERE id = ?",
          [id]
        );
      } else if (type == "driver") {
        sql = "INSERT INTO driver_info (id, license, `name`) VALUES (?, ?, ?);";
        updateUserResults = await connWithPromise(
          conn,
          "UPDATE `user` SET role = 2 WHERE id = ?",
          [id]
        );
        params = [args.id, args.license, args.carname];
      } else if (type == "administrator") {
        updateUserResults = await connWithPromise(
          conn,
          "UPDATE `user` SET role = 3 WHERE id = ?",
          [id]
        );
      } else {
        res.send({
          status: "error",
          errorMessage: "type string not valid role please read API.",
        });
        return;
      }
      if (!OkPacketTypeGuard(updateUserResults))
        throw new Error("updateUserResult is not OKPacket.");
      if (updateUserResults.affectedRows != 1)
        throw new Error("`user` table had not updated.");
      noSufficientArgumentError(params, res);
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
