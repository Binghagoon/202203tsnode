import { RequestHandler } from "express";
import { Executable } from "../types/types";
import {
  noSufficientArgumentError,
  treatError,
  connWithPromise,
} from "./base_module";

const execute: Executable = async function (app, conn) {
  const getSignIn: RequestHandler = async (req, res) => {
    try {
      let sql =
        "SELECT u.id, rl.role FROM  `user` u LEFT OUTER JOIN role_list rl ON u.role = rl.id WHERE username = ? AND (pw IS NULL OR  pw = ?)";
      let arg = req.query;
      let params = [arg.username, arg.pw];
      if (noSufficientArgumentError(params, res)) {
        return;
      }
      conn.query(sql, params, function (err, results: any[], fields) {
        if (treatError(err, res, "signIn")) {
          return;
        } else if (results.length == 0) {
          res.status(400).send({ status: "fail" });
        } else if (results[0]["role"] == null) {
          res.status(401).send({ status: "notAllowed" });
        } else {
          let result = results[0];
          res.status(200).send({
            role: result.role,
            id: result.no,
          });
        }
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  const postSignUp: RequestHandler = async (req, res) => {
    try {
      //POST
      let sql =
        "INSERT INTO user (realname, username, email, phone) VALUES (?, ?, ?, ?);";
      let arg = req.body;
      let params = [arg.realname, arg.username, arg.email, arg.phone];
      if (noSufficientArgumentError(params, res)) {
        return;
      }
      console.log("Sign up from" + arg.username);
      conn.query(sql, params, function (err, results, fields) {
        if (treatError(err, res, "signUp")) {
          return;
        }
        console.log("Registered.");
        res.status(200).send({
          status: "success",
        });
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  const putSignUpAllow: RequestHandler = async (req, res) => {
    try {
      let args = req.body;
      let type = args.type;
      let id = args.id;
      let sql = "",
        params,
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
        sql = "INSERT INTO driver_info (id, licence, `name`) VALUES (?, ?, ?);";
        updateUserResults = await connWithPromise(
          conn,
          "UPDATE `user` SET role = 2 WHERE id = ?",
          [args.id]
        );
        params = [args.id, args.licence, args.carname];
      } else if (type == "administrator") {
        //TBD
        return;
      }

      conn.query(sql, params, async function (err, results, fields) {
        if (Array.isArray(results)) {
          return;
        }
        if (err) {
          console.log(err);
          res.status(500).send({
            status: "error",
            errorMessage: "Error rised when insert.",
          });
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
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };
};
export default execute;
