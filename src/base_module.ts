import express, { Response } from "express";
import {
  QueryError,
  Connection,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
  FieldPacket,
} from "mysql2";
import { CallStatus, QueryResults } from "../types/types";
import moment from "moment-timezone";
import isError from "./base_modules/type_guards/isError";

const objectKeyRename = (
  obj: { [x: string]: any },
  originalName: string,
  changedName: string
): void => {
  obj[changedName] = obj[originalName];
  delete obj[originalName];
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
    b = b || (val == undefined && val == "undefined");
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
  results: QueryResults | [QueryResults, any]
): results is RowDataPacket[] => {
  return (
    Array.isArray(results) &&
    !("affectedRow" in results[0]) &&
    !Array.isArray(results[0])
  );
};
const OkPacketTypeGuard = (
  results: QueryResults | [QueryResults, any]
): results is OkPacket => {
  return !Array.isArray(results) && "affectedRows" in results;
};
const connWithPromise = (
  conn: Connection,
  sql: string,
  params: any[],
  getField = false
): Promise<QueryResults | [QueryResults, FieldPacket[]]> =>
  new Promise(function (resolve, reject) {
    conn.query(sql, params, (err, results, field) => {
      if (err) reject(err);
      else resolve(getField ? [results, field] : results);
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
