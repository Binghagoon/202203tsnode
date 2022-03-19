import express, { Response } from "express";
import { QueryError, Connection } from "mysql2";
import { CallStatus } from "../types/types";

const objectKeyRename = (
  obj: { [x: string]: any },
  originalName: string,
  changedName: string
): void => {
  obj[changedName] = obj[originalName];
  delete obj[originalName];
};

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
const raise500 = (res: Response, reason?: string, error?: Error | any) => {
  if (reason) {
    console.log("Get an error because %s", reason);
  }
  res
    .status(500)
    .send({ status: "error", errorMessage: "Internal Server Error" });
};
const ifErrorRaise500 = async (
  res: Response,
  callback: Function | ((...args: any) => Promise<any>)
) => {
  try {
    return await callback();
  } catch (e) {
    console.error(e);
    raise500(res, undefined, e);
  }
};

const noSufficientArgumentError = (
  args: any[],
  res: express.Response<any, Record<string, any>>
): boolean => {
  //to be tested.
  let b = false;
  for (const val of args) {
    b = b || val == undefined;
  }
  if (b) {
    res.send({
      status: "error",
      errorMessage: "not sufficient arguments.",
    });
    return true;
  }
  return false;
};

const connWithPromise = (
  conn: Connection,
  sql: string,
  params: any[]
): Promise<any> => {
  return new Promise(function (resolve, reject) {
    conn.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};
//type GetUserData = (arg: any, conn:Connection) => any;

const getPositionName = async function (
  number: Number,
  conn: Connection
): Promise<string> {
  let sql = "SELECT name FROM record_position WHERE id = ?";
  let results = await connWithPromise(conn, sql, [number]);
  return results[0].name;
};

const getPhoneAddress = async function (
  number: Number,
  conn: Connection
): Promise<string> {
  let sql = "SELECT phone FROM `user` WHERE id = ?";
  let results = await connWithPromise(conn, sql, [number]);
  return results[0].mp;
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
  raise500,
  ifErrorRaise500 as raiseInternalServerError,
  ifErrorRaise500 as tryCatch,
  ifErrorRaise500,
  getPhoneAddress,
  getPositionName,
  allowCallStatus,
  statusToNumber,
};
