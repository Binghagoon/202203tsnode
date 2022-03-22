import express, { Response } from "express";
import {
  QueryError,
  Connection,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
} from "mysql2";
import { CallStatus } from "../types/types";
import moment from "moment-timezone";

const objectKeyRename = (
  obj: { [x: string]: any },
  originalName: string,
  changedName: string
): void => {
  obj[changedName] = obj[originalName];
  delete obj[originalName];
};

const isError = (x: any): x is Error => typeof x == "object" && "message" in x;
const isQueryError = (x: any): x is QueryError =>
  typeof x == "object" && "code" in x;
/**
 * message string property in Error Object must have 3-digit end of string which is HTTP error code.
 * Error example new Error("No sufficient arguments.400");.
 * 4XX:Error Object or number.
 * 5XX: Error Object or number or string.
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
    message = "Unknown error";
    code = 500;
    stack = "There is no stack.";
    let seoulTime = moment().tz("Asia/Seoul").format();
    seoulTime = seoulTime.slice(0, -6); //Delete +09:00
    console.error("\n-------Error Print");
    if (isQueryError(e)) {
      console.error(`Query error name: ${e.name}`);
      console.error(`Query message: ${e.message}`);
      message = "Query error.";
      code = 500;
      stack = e.stack ? e.stack : stack;
    } else if (isError(e)) {
      let errorMessage = e.message;
      let codeString = errorMessage.slice(-3);
      code = parseInt(codeString);
      if(!isNaN(code)){
        message = errorMessage.slice(0, -3);
      }else{
        message = "Pure Error Object. Described on stderr.";
      }
      stack = e.stack ? e.stack : stack;
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
    console.error(`Time(in KST): ${seoulTime}`);
    console.error(`Error: ${message}`);
    console.error(`Code:${code}`);
    console.error(`Stack↓\n${stack}`);
    console.error("-------Error Print End\n");
    console.log(
      `Error occurred: {\n  Time(in KST):${seoulTime},\n  Error: ${message},\n  Code:${code}\n}`
    );

    res.status(code).send({ status: "error", errorMessage: message });
    return null;
  }
};
/**
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
        errorMessage: "No sufficient arguments",
      });
      return true;
    } else {
      throw new Error("No sufficient arguments400");
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
  catchError,
  allowCallStatus,
  statusToNumber,
};
