import { Executable, PathObject, TokenObject } from "./../types/types.d";
import { RequestHandler } from "express";
import { key } from "../data/sensitive-value.json";
import * as curl from "./curl";
import seoulTime from "./base_modules/seoul_time";
import catchError from "./base_modules/catch_error";
import { OkPacketTypeGuard } from "./base_modules/type_guards/query_results_type_guards";
import connWithPromise from "./base_modules/conn_with_promise";
import noSufficientArgumentError from "./base_modules/not_sufficient_arguments";
import bsData from "./base_modules/data";

const execute: Executable = async (app, conn) => {
  const postRefreshToken: RequestHandler = (req, res) =>
    catchError(res, async () => {
      bsData.doRefresh();
      console.log("Token has been refreshed successfully.");
      res.send({
        status: "success",
      });
    });

  const postToken: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "INSERT INTO kakao_token (kakao_id, refresh_token, time_stamp, " +
        " access_token, expires_in) VALUES (?,?,?,?,?)";
      const body = req.body;
      const param = [
        body.kakao_id,
        body.refresh_token,
        seoulTime.getTimeStamp(),
        body.access_token,
        body.expires_in,
      ];
      noSufficientArgumentError(param);
      const results = await connWithPromise(conn, sql, param);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.affectedRows == 1) {
        res.send({
          status: "success",
        });
      } else if (results.affectedRows == 0) {
        res.send({
          status: "error",
          errorMessage: "Not affected",
        });
      } else {
        res.send({
          status: "error",
          errorMessage: "Other error",
        });
      }
    });

  const kakaoTokenTest: RequestHandler = (req, res) =>
    catchError(res, async () => {
      if (req.body.key != key) {
        throw new Error("key is incorrect 400");
      }
      let data = await curl.command("isValid");
      console.log(data);
      res.send(data);
    });
  app.post("/token", postToken);
  app.post("/kt-test", kakaoTokenTest);
  app.post("/refresh-token", postRefreshToken);
};

export default execute;
