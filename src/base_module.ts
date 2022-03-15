import express, { Request, Response, NextFunction, Express } from "express";
import { QueryError, Connection } from "mysql2";
import { Executable, PathObject } from "../types/types";

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

export {
  objectKeyRename,
  treatError,
  noSufficientArgumentError,
  connWithPromise,
};
