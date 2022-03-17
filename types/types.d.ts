import express, { Request, Response, NextFunction, Express } from "express";
import {
  createConnection,
  QueryError,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
  Connection,
} from "mysql2";
type AsyncExecutable = (app: Express, conn: Connection)=>Promise<PathObject | void>;
export type PathObject = {
  get?: string[];
  post?: string[];
  put?: string[];
  delete?: string[];
};
export type Executable = (app: Express, conn: Connection) => PathObject | void;
export type TokenObject = {
  [key: string]: any;
  error?: Error;
  refresh_token: string;
  refresh_token_expires_in: number;
  scope: string;
  token_type: string;
  time_stamp: number;
  access_token: string;
  expires_in: number;
};
export type AppCallback = (req: Request, res:Response) => void | any | Promise<void | any>;
