import express, { Request, Response, NextFunction, Express } from 'express';
import { createConnection, QueryError, RowDataPacket, OkPacket, ResultSetHeader, Connection } from "mysql2";
type AsyncExecutable = Promise<Executable>;
export type PathObject ={
  get: string[] | null;
  post: string[] | null;
  put: string[] | null;
};
export type Executable = (
  app: Express,
  conn: Connection
) => PathObject | void;
