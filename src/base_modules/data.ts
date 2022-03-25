import { TokenObject } from "types/types";
import { exec } from "child_process";
import {writeFile} from "fs";
import tokenObjectTypeGuard from "./type_guards/token_object";
import seoulTime from "./seoulTime";
import { command } from "../curl";

let port: number | null = null;
let path: string | null = null;
let kakaoToken: TokenObject | null = null;
let tokenPromise: Promise<TokenObject>;

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
  tokenPromise = new Promise((resolve, reject) =>
    exec("cat " + path, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
        reject(new Error("Error occurred while reading token."));
      }
      console.log(`stderr while token reading:${stderr}`);
      try {
        kakaoToken = JSON.parse(stdout);
        if (!kakaoToken) reject(new Error("Parse didn't work perfectly."));
        else {
          console.log(`kakao token read well. values are ${stdout}`);
          resolve(kakaoToken);
        }
      } catch (e) {
        console.log(e);
        console.error(e);
        reject(e);
      }
    })
  );
};
const getPath = () => {
  if (path) return path;
  else throw new Error("Path string did not defined.");
};
const getToken = () => {
  let newToken;
  if (kakaoToken) {
    newToken = Object.assign<object, TokenObject>({}, kakaoToken);
    return newToken as TokenObject;
  } else return tokenPromise;
};
/** `token` will be newer token and if `undefined` will run commend for get newer token.*/
const accessTokenRefresh = async (token?: string, timeStamp?: number) => {
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
  writeFile(getPath(), string, (err) => {
    if (err) {
      debugger;
      console.error(err);
    } else {
      console.log("Kakao Token is wrote successfully.");
      console.log(string);
    }
  });
  return token;
};
const doRefresh = () => accessTokenRefresh();
export default {
  setPort,
  getPort,
  setPath,
  getPath,
  getToken,
  doRefresh,
};

//to be Object
