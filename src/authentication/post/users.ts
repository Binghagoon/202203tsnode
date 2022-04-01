import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";
import { OkPacketTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable } from "types/types";

const execute :Executable=(app,conn)=>{
  const postUsers: RequestHandler = (req, res) =>
  catchError(res, async () => {
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
      id: results.insertId,
    });
  });
  app.post("/auth/users", postUsers);
  return{
      post:["/auth/users"],
  }
}
export default execute;
