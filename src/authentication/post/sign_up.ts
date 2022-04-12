import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";
import { OkPacketTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";
import { AddUser } from "../../base_modules/user_function";

/** @deprecated  change to POST /users */
const execute: Executable = (app, conn) => {
  const postSignUp: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const arg = req.body;
      noSufficientArgumentError([arg.realname, arg.username, arg.email, arg.phone]);
      const insertId = await AddUser(conn, arg.realname, arg.username, arg.email, arg.phone);
      res.status(200).send({
        status: "success",
        id: insertId,
      });
    });
  app.post("/sign-up", postSignUp);
  return {
    post: ["/sign-up"],
  }
}
export default execute;
