import { Executable, PathObject, TokenObject } from "./../types/types.d";
import { RequestHandler } from "express";
import * as sensitiveValue from "../data/sensitive-value.json";
import * as fs from "fs";
import * as curl from "./curl";
import seoulTime from "./base_modules/seoulTime";
import catchError from "./base_modules/catchError";
import { OkPacketTypeGuard } from "./base_modules/type_guards/query_results_type_guards";
import connWithPromise from "./base_modules/conn_with_promise";
import noSufficientArgumentError from "./base_modules/not_sufficient_arguments";
import tokenObjectTypeGuard from "./base_modules/type_guards/token_object";
import data from"./base_modules/data"

let refreshToken: string, accessToken: string, kakaoToken: TokenObject;
const WritePromise = (path: string, data: string) =>
  new Promise<boolean>((resolve, reject) =>
    fs.writeFile(path, data, (err) => {
      if (err) {
        debugger;
        console.error(err);
        reject(err);
      } else {
        resolve(true);
      }
    })
  );
  /**@deprecated */
const newSensitive = (newKakaoToken: TokenObject) => {
  let newObject: any = { ...sensitiveValue };
  delete newObject.default;
  newObject.kakao_token = newKakaoToken;
  return newObject;
};
export const writeToken = async (newToken: any) => {
  if (!tokenObjectTypeGuard(newToken)) throw "Type mismatched.";
  for (const property in newToken) {
    const strValue = newToken[property];
    if (isNaN(parseInt(strValue))) {
      continue;
    }
    newToken[property] = parseInt(strValue);
  }
  const ts = seoulTime.getTimeStamp();
  newToken.time_stamp = ts;
  if (typeof newToken.access_token == "number") {
    throw new Error("Why access token is number?500");
  }
  const string = JSON.stringify(newToken, null, 2);
  await WritePromise(data.getPath(), string);
  return newToken;
};

export const verifyToken = async (forceRefresh: boolean = false) => {
  const ts = seoulTime.getTimeStamp();
  const diff = kakaoToken.time_stamp + kakaoToken.expires_in - ts;
  if (diff <= 0) {
    console.log("Kakao token has been expired before %d seconds.", -diff);
  } else {
    console.log(
      `Kakao token can live for ${diff} seconds from now.` +
        `\n\t(Now is ${ts}, also as ${seoulTime.getTime()} in KST)` +
        `\n\tWhen time is ${seoulTime.getTime(diff)}, Token will die.`
    );
    const timeOutWork = async () => {
      try {
        console.log("Refreshing token.");
        await doRefreshToken();
        await verifyToken();
      } catch (e) {
        console.log("Error on refreshing. Please see stderr.");
        console.error(e);
        debugger;
        throw e;
      }
    };
    console.log(
      "Add event of refreshing token at %s in KST",
      seoulTime.getTime(diff - 100)
    );
    setTimeout(timeOutWork, (diff - 100) * 1000);
    const rdiff =
      kakaoToken.time_stamp + kakaoToken.refresh_token_expires_in - ts;
    console.log(
      `Refresh token can live before ${seoulTime.getTime(rdiff)} in KST.`
    );
  }
  if (isNaN(diff) || diff < 1000 || forceRefresh) {
    console.log("Getting new tokens...");
    try {
      await doRefreshToken();
      await verifyToken();
    } catch (e) {
      console.log("Error on refreshing. Please see stderr.");
      console.error(e);
      debugger;
      throw e;
    }
  }
  accessToken = kakaoToken.access_token;
  refreshToken = kakaoToken.refresh_token;
};

/**@deprecated */
export const doRefreshToken = async () => {
  const ts = seoulTime.getTimeStamp();
  const diff =
    kakaoToken.refresh_time_stamp + kakaoToken.refresh_token_expires_in - ts;
  if (diff < 0) {
    console.log(
      "Refresh token has been expired too. Please get with Kakao log in."
    );
    return;
  }
  let data = await curl.command("getToken"); //e.g: {"access_token":"rqun4rzjndO2Ns48epBZCXyTNhwwy5M51X8HSgorDNQAAAF_tIb4Dg","token_type":"bearer","expires_in":21599}

  if (tokenObjectTypeGuard(data)) {
    try {
      if (data.error) {
        console.log("Error occurred.");
        console.log(data);
        return;
      }
      data.time_stamp = ts;
      kakaoToken.access_token = data.access_token;
      kakaoToken.time_stamp = data.time_stamp;
      data = kakaoToken;
      let writeResult = await writeToken(data);
      if (writeResult) return writeResult;
      else console.log("There is no Write Result.");
    } catch (e) {
      console.log("Error occurred while updating token.");
      console.error(e);
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
      const ts = seoulTime.getTimeStamp();
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
      if (req.body.key != sensitiveValue.key) {
        throw new Error("key is incorrect 400");
      }
      let data = await curl.command("isValid", { access_token: accessToken });
      console.log(data);
      res.send(data);
    });
  kakaoToken =data.getToken();
  verifyToken();

  app.post("/set-token", postSetToken);
  app.post("/token", postToken);
  app.post("/kt-test", kakaoTokenTest);
  app.post("/refresh-token", postRefreshToken);
};
export default execute;
