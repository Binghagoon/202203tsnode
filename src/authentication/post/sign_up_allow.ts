import { RequestHandler } from "express";
import catchError from "../../base_modules/catch_error";
import connWithPromise from "../../base_modules/conn_with_promise";
import { getRole } from "../../base_modules/get_specific_data";
import noSufficientArgumentError from "../../base_modules/not_sufficient_arguments";
import { OkPacketTypeGuard } from "../../base_modules/type_guards/query_results_type_guards";
import { Executable, QueryResults } from "types/types";

/** @deprecated  change to PUT /users/:id */
const execute: Executable = (app, conn) => {
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

  app.post("/sign-up-allow", putSignUpAllow);
  return {
    post: ["/sign-up-allow"],
  };
};

export default execute;
