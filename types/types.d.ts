import express, { Request, Response, NextFunction, Express } from "express";
import {
  createConnection,
  QueryError,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
  Connection,
} from "mysql2";
export type PathObject = {
  get?: string[];
  post?: string[];
  put?: string[];
  delete?: string[];
};
export type KakaoError = {
  msg: string;
  code: number;
};
export type Executable = (
  app: Express,
  conn: Connection
) => PathObject | void | Promise<PathObject | void>;
export type TokenObject = {
  [key: string]: any;
  error?: Error;
  refresh_token: string;
  refresh_token_expires_in: number;
  refresh_time_stamp: number;
  scope: string;
  token_type: string;
  time_stamp: number;
  access_token: string;
  expires_in: number;
};
export type CallStatus =
  | "waiting"
  | "canceled"
  | "allocated"
  | "moving"
  | "finish";
export type SQLType = "SELECT" | "UPDATE" | "DELETE" | "INSERT";
export type SendKakaoMessageOptions = {
  departure: string;
  arrival: string;
  phoneAddress: string;
  seatType?: string;
};
export type ErrorKakaoResult = {
  msg: string;
  code: number;
};
export type QueryResults =
  | OkPacket
  | ResultSetHeader
  | RowDataPacket[]
  | RowDataPacket[][]
  | OkPacket[];

export type CommandType =
  | "memo"
  | "sendMessage"
  | "friends"
  | "getToken"
  | "isValid";
export type Curl = { exe: string; headers: string[]; data: string[] };
