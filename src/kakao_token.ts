import { Executable, PathObject, TokenObject } from "./../types/types.d";
import express, {
  Request,
  Response,
  NextFunction,
  Express,
  RequestHandler,
} from "express";
import { QueryError, Connection } from "mysql2";
import * as sensitiveValue from "../data/sensitive-value.json";
import { kakao_token as kakaoToken } from "../data/sensitive-value.json";
import * as fs from "fs";
import {
  catchError,
  connWithPromise,
  getTimeStamp,
  noSufficientArgumentError,
  OkPacketTypeGuard,
} from "./base_module";
import * as curl from "./curl";
import { tokenObjectTypeGuard } from "./type_guards";

let refreshToken: string, accessToken: string;
const WritePromise = (path: string, data: string) =>
  new Promise<void>((resolve, reject) =>
    fs.writeFile(path, data, (err) => {
      if (err) {
        debugger;
        reject();
      } else {
        resolve();
      }
    })
  );
const newSensitive = (newKakaoToken: TokenObject) => {
  let newObject: any = { ...sensitiveValue };
  delete newObject.default;
  newObject.kakao_token = newKakaoToken;
  return newObject;
};
export const writeToken = async (newToken: any) => {
  try {
    if (!tokenObjectTypeGuard(newToken)) throw "Type mismatched.";
    for (const property in newToken) {
      const strValue = newToken[property];
      if (isNaN(parseInt(strValue))) {
        continue;
      }
      newToken[property] = parseInt(strValue);
    }
    const ts = getTimeStamp();
    newToken.time_stamp = ts;
    newToken.refresh_time_stamp = ts;
    const string = JSON.stringify(newSensitive(newToken), null, 2);
    await WritePromise("./data/sensitive-value.json", string);
  } catch (e) {
    console.error(e);
    console.log(
      "error occurred while writing token. Please see the error log."
    );
    console.log(e);
    return;
  }
};

export const verifyToken = async (forceRefresh: boolean = false) => {
  const ts = getTimeStamp();
  const diff = kakaoToken.time_stamp + kakaoToken.expires_in - ts;
  if (diff <= 0) {
    console.log("Kakao token has been expired before %d seconds.", -diff);
  } else {
    console.log(
      `Kakao token can live for ${diff} seconds from now. (Now is ${ts}.)`
    );
    const rdiff =
      kakaoToken.time_stamp + kakaoToken.refresh_token_expires_in - ts;
    console.log(
      `Refresh token can live for ${rdiff} seconds from now. Please refresh.`
    );
  }
  if (isNaN(diff) || diff < 1000 || forceRefresh) {
    console.log("Getting new tokens...");
    await doRefreshToken(kakaoToken.refresh_token);
  }
  accessToken = kakaoToken.access_token;
  refreshToken = kakaoToken.refresh_token;
};

const doRefreshToken = async (refresh_token?: string) => {
  const ts = getTimeStamp();
  const diff = kakaoToken.refresh_time_stamp + kakaoToken.refresh_token_expires_in - ts;
  if (diff < 0) {
    console.log(
      "Refresh token has been expired too. Please get with Kakao log in."
    );
    return;
  }
  let data = await curl.command("getToken");
  const isTokenObject = (
    data: string | object | undefined
  ): data is TokenObject => {
    return (data as TokenObject).token_type !== undefined;
  };
  if (isTokenObject(data)) {
    try {
      if (data.error) {
        console.log("Error occurred.");
        console.log(data);
        return;
      }
      data.time_stamp = ts;
      kakaoToken.access_token = data.access_token;
      kakaoToken.expires_in = data.expires_in;
      kakaoToken.time_stamp = ts;
      writeToken(kakaoToken);
    } catch (e) {
      console.log("Error occurred while updating token.");
      debugger;
    }
  }
};

const execute: Executable = async (app, conn) => {
  const postSetToken: RequestHandler = (req, res) =>
    catchError(res, async () => {
      accessToken = req.body["access_token"];
      refreshToken = req.body["refresh_token"];
      console.log(
        `Access Token: ${accessToken}\nRefresh Token: ${refreshToken}`
      );
      const ts = getTimeStamp();
      req.body.refresh_time_stamp = ts;
      await writeToken(req.body);
      res.status(200).send({
        status: "success",
      });
    });
  const postRefreshToken: RequestHandler = (req, res) =>
    catchError(res, async () => {
      await doRefreshToken();
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
        getTimeStamp(),
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
      if (req.body.key != sensitiveValue.key) {
        throw new Error("key is incorrect 400");
      }
      let data = await curl.command("isValid", { access_token: accessToken });
      console.log(data);
      res.send(data);
    });

  verifyToken();

  app.post("/set-token", postSetToken);
  app.post("/token", postToken);
  app.post("/kt-test", kakaoTokenTest);
  app.post("/refresh-token", postRefreshToken);
};
export default execute;
