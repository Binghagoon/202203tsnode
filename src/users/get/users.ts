import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import { selectTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";
import sensitiveValue from "../../../data/sensitive-value.json";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";

const execute: Executable = (app, conn) => {
  const getAllUsers: RequestHandler = (req, res) =>
    catchError(res, async () => {
      if (req.query.key != sensitiveValue.key) {
        throw new Error("key is incorrect 400");
      }
      const sql = "SELECT * FROM user_view;";
      const results = await connWithPromise(conn, sql, []);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      res.send(results);
    });
  const getId: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT `id` FROM `user` WHERE username = ?";
      const username = req.query.username;
      noSufficientArgumentError([username]);
      const results = await connWithPromise(conn, sql, [username]);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      let result = results[0];
      res.send(result);
    });
  const getUsers: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT * FROM user_view WHERE id = ?";
      const id = req.params.id;
      noSufficientArgumentError([id]);
      const results = await connWithPromise(conn, sql, [id]);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      let result = results[0];
      res.send(result);
    });
  app.get("/users", getAllUsers);
  app.get("/users/id", getId);
  app.get("/users/:id", getUsers);
  return {
    get: ["/users", "/users/id", "/users/:id"],
  };
};
export default execute;
