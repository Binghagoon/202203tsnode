import { Executable, PathObject, TokenObject } from "./../types/types.d";
import express, {
  Request,
  Response,
  NextFunction,
  Express,
  RequestHandler,
} from "express";
import { QueryError, Connection } from "mysql2";
import * as sensitiveValue from "./sensitive-value.json";
import { kakao_token as kakaoToken } from "./sensitive-value.json";
import * as fs from "fs";
import { getTimeStamp } from "./base_module";
import * as curl from "./curl";

let refreshToken: string, accessToken: string;

export const writeToken = (data: TokenObject): void => {
  let stringData: string;
  try {
    let newToken: TokenObject = sensitiveValue.kakao_token;
    for (const property in data) {
      const strValue = data[property];
      if (typeof strValue !== "string") {
        continue;
      }
      let number = parseInt(strValue);
      if (isNaN(number)) {
        continue;
      }
      newToken[property] = number;
    }
    let newSensitiveValue = sensitiveValue;
    newSensitiveValue.kakao_token = newToken;
    stringData = JSON.stringify(newSensitiveValue, null, 2);
  } catch (e) {
    console.error(e);
    console.log("error occured please see error log.");
    return;
  }
  fs.writeFile("./sensitive-value.json", stringData, (err) => {
    if (err) {
      debugger;
      console.log("Error occurred while writing token.");
    } else {
      console.log("The token has been written successfully.");
    }
  });
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
  const diff = kakaoToken.time_stamp + kakaoToken.expires_in - ts;
  if (diff < 0) {
    console.log(
      "Refresh token has been expired too. Please get with Kakao log in."
    );
    return;
  }
  let data = await curl.command(null, curl.commandObject.getToken);
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
};

const execute: Executable = async (app, conn) => {
  const postSetToken: RequestHandler = async (req, res) => {
    try {
      accessToken = req.body["access_token"];
      refreshToken = req.body["refresh_token"];
      console.log(
        `Access Token: ${accessToken}\nRefresh Token: ${refreshToken}`
      );
      const ts = getTimeStamp();
      req.body.time_stamp = ts;
      writeToken(req.body);
      res.status(200).send({
        status: "success",
      });
    } catch (e) {
      console.log(e);
      res.status(500).send({
        status: "error",
        errorMessage: "Internal Server Error",
      });
    }
  };
  const postRefrashToken: RequestHandler = async (req, res) => {
    try {
      await doRefreshToken();
      console.log("Token has been refreshed successfully.");
      res.send({
        status: "success",
      });
      return;
    } catch (e) {
      console.log("Error occured while refreshing token.");
      console.error("Error occured while refreshing token.");
      console.error(e);
      res.status(500).send({
        status: "error",
      });
      return;
    }
  };

  verifyToken();

  app.post("/set-token", postSetToken);
  app.post("/refresh-token", postRefrashToken);
};
export default execute;
