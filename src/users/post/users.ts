import { RequestHandler } from "express";
import catchError from "src/base_modules/catch_error";
import noSufficientArgumentError from "src/base_modules/not_sufficient_arguments";
import { AddUser } from "src/base_modules/user_function";
import { Executable } from "types/types";

const execute: Executable = (app, conn) => {
  const postUsers: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const arg = req.body;
      noSufficientArgumentError([arg.realname, arg.username, arg.email, arg.phone]);
      const insertId = await AddUser(conn, arg.realname, arg.username, arg.email, arg.phone);
      res.status(200).send({
        status: "success",
        id: insertId,
      });
    })
  app.post("/users", postUsers);
  return {
    post: ["/users"],
  }
}
export default execute;