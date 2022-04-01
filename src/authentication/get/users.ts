import { RequestHandler } from "express";
import catchError from "../../base_modules/catchError";
import connWithPromise from "../../base_modules/conn_with_promise";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";
import { selectTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";

const execute: Executable = (app, conn) => {
  const getUsers: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "SELECT u.id, rl.role, u.realname FROM  `user` u" +
        " LEFT OUTER JOIN role_list rl ON u.role = rl.id " +
        "WHERE username = ? AND (pw IS NULL OR  pw = ?)";
      const arg = req.query;
      const pw = arg.pw ? arg.pw : "null";
      const params = [arg.username, pw];
      noSufficientArgumentError(params);
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
  app.get("/users", getUsers);
  return {
    get: ["/users"],
  };
};
export default execute;
