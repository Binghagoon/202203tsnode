import { TokenObject } from "types/types";
import { exec } from "child_process";
import * as fs from "fs";
import tokenObjectTypeGuard from "./type_guards/token_object";
import seoulTime from "./seoulTime";
import { command } from "../curl";

let port: number | null = null;
let path: string | null = null;
let kakaoToken: TokenObject | null = null;

const setPort = (num: number) => {
  if (port) throw new Error("Port number can change only once.");
  port = num;
};
const getPort = () => {
  if (port) return port;
  else throw new Error("Port number did not defined.");
};
const setPath = (arg: string) => {
  if (path) throw new Error("Path string can change only once.");

  //Verify path TBD
  path = arg;
  exec("cat " + path, (error, stdout, stderr) => {
    if (error) {
      console.log(error);
      throw new Error("Error occurred while reading token.");
    }
    console.log(`stderr while token reading:${stderr}`);
    try {
      kakaoToken = JSON.parse(stdout);
      console.log(`kakao token read well. values are ${stdout}`);
    } catch (e) {
      console.log(e);
      console.error(e);
      throw e;
    }
  });
};
const getPath = () => {
  if (path) return path;
  else throw new Error("Path string did not defined.");
};
const getToken = () => {
  let newToken;
  if (kakaoToken) {
    newToken = Object.assign<object, TokenObject>({}, kakaoToken);
    if (tokenObjectTypeGuard(newToken)) return newToken;
  } else throw new Error("There is no token.");
  return kakaoToken; //for type inference
};

const accessTokenRefresh = (token?: string, timeStamp?: number) => {
  if (!token) {
    command("getToken")
      .then((value) => {
        if (typeof value != "string" && tokenObjectTypeGuard(value))
          accessTokenRefresh(value.access_token, timeStamp);
      })
      .catch(console.log);
    return;
  }
  if (!timeStamp) timeStamp = seoulTime.getTimeStamp();
  if (!kakaoToken) throw new Error("There is no token.");

  kakaoToken.access_token = token;
  kakaoToken.time_stamp = timeStamp;
  const string = JSON.stringify(kakaoToken, null, 2);
  fs.writeFile(getPath(), string, (err) => {
    if (err) {
      debugger;
      console.error(err);
    } else {
      console.log("Kakao Token is wrote successfully.");
      console.log(string);
    }
  });
};
export default {
  setPort,
  getPort,
  setPath,
  getPath,
  getToken,
  accessTokenRefresh,
};

//to be Object
