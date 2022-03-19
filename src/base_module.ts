import express, { Response } from "express";
import {
  QueryError,
  Connection,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
} from "mysql2";
import { CallStatus, HTTPError } from "../types/types";
import moment from "moment-timezone";

const objectKeyRename = (
  obj: { [x: string]: any },
  originalName: string,
  changedName: string
): void => {
  obj[changedName] = obj[originalName];
  delete obj[originalName];
};

const isHTTPError = (e: unknown): e is HTTPError => {
  if (Array.isArray(e)) {
    return typeof e[0] == "string" && typeof e[1] == "number";
  } else {
    return false;
  }
};
const isError = (x: any): x is Error => "message" in x;
/**
 * 
 * @param res Express res
 * @param callback Some function, function or Promise; async function
 * @param args function's arguments
 * @returns callback return value: any
 */
const catchError = async (
  res: Response,
  callback: Function | ((...args: any) => Promise<any> | any),
  ...args: any[]
) => {
  try {
    return await callback(...args);
  } catch (e) {
    let message: string, code: number, stack: string, errorObject: Error;
    errorObject = new Error();
    stack = errorObject.stack ? errorObject.stack : "Can't find stack.";
    message = "Unknown error";
    code = 500;
    if (isHTTPError(e)) {
      message = e[0];
      code = e[1];
    } else if (isError(e)) {
      message = e.message;
      code = 500;
    } else if (typeof e == "string") {
      message = e;
      code = 500;
    } else if (typeof e == "number") {
      if (e == 400) {
        message = "Bad request, in most cases argument is not sufficient.";
      } else if (e >= 400 || e < 500) {
        message = "Client Error";
      }
      if (e == 500) {
        message = "Internal Server Error";
      }
      if (e > 500 || e < 600) {
        message = "Other server Error";
      }
      code = e;
    }
    let seoulTime = moment().tz("Asia/Seoul").format();
    console.error(
      `-------Error Print
      Time(in KST): ${seoulTime}
      Error: ${message}
      Code:${code}
      Stack:${stack}
      -------Error Print End`
    );
    res.status(code).send({ status: "error", errorMessage: message });
    return null;
  }
};
/**
 * 
 * @param err 
 * @param res 
 * @param location
 * @returns
 * @deprecated  
 */
const treatError = (
  err: QueryError | null,
  res: Response,
  location?: string
): number => {
  if (!err) return 0;
  console.log(err.stack);
  if (res) {
    res.send({
      status: "error",
      errorMessage: "not defined error",
    });
  }
  debugger;
  return 1;
};
/**
 * 
 * @param res 
 * @param reason 
 * @param error 
 * @param code
 * @deprecated 
 */
const raiseError = (
  res: Response,
  reason?: string,
  error?: Error | any,
  code?: number
) => {
  console.log("Error occurred time is %s", moment().tz("Asia/Seoul").format());
  if (reason) console.log("Get an error because %s", reason);
  if (error) {
    if (isError(error)) {
      console.log(`Error object says "${error.message}"`);
    } else if (typeof error == "string") {
      console.log(`Error string says "${error}"`);
    }
    console.error(error);
  }
  if (!code) {
    res
      .status(500)
      .send({ status: "error", errorMessage: "Internal Server Error" });
  } else {
    res.status(code).send({ status: "error", errorMessage: reason });
  }
};
/**
 * 
 * @param res 
 * @param callback 
 * @returns 
 * @deprecated
 */
//const raiseHTTPError(res:Response, code:number,option?:{reason?:string,}) //TBD
const ifErrorRaise500 = async (
  res: Response,
  callback: Function | ((...args: any) => Promise<any>)
) => {
  try {
    return await callback();
  } catch (e) {
    raiseError(res, undefined, e);
  }
};

const noSufficientArgumentError = (
  args: any[],
  res?: express.Response<any, Record<string, any>>
): boolean => {
  //to be tested.
  let b = false;
  for (const val of args) {
    b = b || val == undefined;
  }
  if (b) {
    if (res) {
      res.send({
        status: "error",
        errorMessage: "not sufficient arguments.",
      });
      return true;
    } else {
      throw "No sufficient arguments";
    }
  }
  return false;
};

const selectTypeGuard = (
  results:
    | OkPacket
    | ResultSetHeader
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket[]
): results is RowDataPacket[] => {
  return (
    Array.isArray(results) &&
    !("affectedRow" in results[0]) &&
    !Array.isArray(results[0])
  );
};
const OkPacketTypeGuard = (
  results:
    | OkPacket
    | ResultSetHeader
    | RowDataPacket[]
    | RowDataPacket[][]
    | OkPacket[]
): results is OkPacket => {
  return !Array.isArray(results) && "affectedRow" in results;
};
const connWithPromise = (
  conn: Connection,
  sql: string,
  params: any[]
): Promise<
  OkPacket | ResultSetHeader | RowDataPacket[] | RowDataPacket[][] | OkPacket[]
> =>
  new Promise(function (resolve, reject) {
    conn.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
//type GetUserData = (arg: any, conn:Connection) => any;

const getPositionName = async function (
  number: Number,
  conn: Connection
): Promise<string> {
  let sql = "SELECT name FROM record_position WHERE id = ?";
  let results = await connWithPromise(conn, sql, [number]);
  if (Array.isArray(results) && "name" in results[0]) {
    let name: string = results[0].name;
    return name;
  } else {
    throw new Error("Position name is not string.");
  }
};

const getPhoneAddress = async function (
  number: Number,
  conn: Connection
): Promise<string> {
  let sql = "SELECT phone FROM `user` WHERE id = ?";
  let results = await connWithPromise(conn, sql, [number]);
  if (Array.isArray(results) && "phone" in results[0]) {
    let phone: string = results[0].phone;
    return phone;
  } else {
    throw new Error("Phone address is not string.");
  }
};

const getTimeStamp = () => Math.floor(Date.now() / 1000);

const allowCallStatus: CallStatus[] = [
  "waiting",
  "canceled",
  "allocated",
  "moving",
  "finish",
];

const statusToNumber: { [status in CallStatus]: number } = {
  waiting: 0,
  canceled: 1,
  allocated: 2,
  moving: 3,
  finish: 4,
};

export {
  objectKeyRename,
  treatError,
  noSufficientArgumentError,
  connWithPromise,
  getTimeStamp,
  raiseError as raise500,
  ifErrorRaise500 as raiseInternalServerError,
  ifErrorRaise500 as tryCatch,
  ifErrorRaise500,
  getPhoneAddress,
  getPositionName,
  selectTypeGuard,
  OkPacketTypeGuard,
  allowCallStatus,
  statusToNumber,
};
