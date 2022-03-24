import express, {
  Request,
  Response,
  NextFunction,
  Express,
  RequestHandler,
} from "express";
import Connection from "mysql2/typings/mysql/lib/Connection";
import { Executable, PathObject } from "../types/types";
import {
  objectKeyRename,
  noSufficientArgumentError,
  connWithPromise,
  selectTypeGuard,
  OkPacketTypeGuard,
} from "./base_module";
import * as sensitiveValue from "../data/sensitive-value.json";
import catchError from "./base_modules/catchError";

const execute: Executable = async function (app, conn) {
  const getId: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT `id` FROM `user` WHERE username = ?";
      const username = req.query.username;
      noSufficientArgumentError([username]);
      const results = await connWithPromise(conn, sql, [username]);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      let result = results[0];
      res.send(result);
    });

  const getUserInfo: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT *  FROM user_view WHERE id = ?";
      const id = req.query.id;
      noSufficientArgumentError([id]);
      const results = await connWithPromise(conn, sql, [id]);
      if (selectTypeGuard(results)) {
        const result = results[0];
        res.send(result);
      } else {
        throw "Type mismatched";
      }
    });

  const getStudentInfo: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "SELECT id, student_number, major FROM user_view WHERE `id`=?";
      const id = req.query.id;
      noSufficientArgumentError([id]);
      const results = await connWithPromise(conn, sql, [id]);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      const result = results[0];
      objectKeyRename(result, "student_number", "studentNumber");
      res.send(result);
    });

  const getDriverInfo: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT id, license, carname FROM user_view WHERE `id`=?";
      const id = req.query.id;
      noSufficientArgumentError([id]);
      const results = await connWithPromise(conn, sql, [id]);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      const result = results[0];
      res.send(result);
    });

  const postUpdateStudentInfo: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "UPDATE student_info SET student_number = ?, major = ? WHERE `id` = ?";
      const id = req.body.id;
      const studentNumber = req.body.studentNumber;
      const major = req.body.major;
      const params = [studentNumber, major, id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.affectedRows == 1) {
        res.send({
          status: "success",
        });
      } else {
        res.send({
          status: "error",
          errorMassage: "Not affected",
        });
      }
    });
  const postUpdateDriverInfo: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "UPDATE driver_info SET license = ?, name = ? WHERE `id` = ?";
      const id = req.body.id;
      const license = req.body.license;
      const name = req.body.carName;
      const params = [license, name, id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.affectedRows == 1) {
        res.send({
          status: "success",
        });
      } else {
        res.send({
          status: "error",
          errorMassage: "Not affected",
        });
      }
    });
  const getAllUsers: RequestHandler = (req, res) =>
    catchError(res, async () => {
      if (req.body.key != sensitiveValue.key) {
        throw new Error("key is incorrect 400");
      }
      const sql = "SELECT * FROM user_view;";
      const results = await connWithPromise(conn, sql, []);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      res.send(results);
    });

  app.get("/get-id", getId);
  app.get("/all-users", getAllUsers);
  app.get("/get-user-info", getUserInfo);
  app.get("/get-student-info", getStudentInfo);
  app.get("/get-driver-info", getDriverInfo);
  app.post("/update-student-info", postUpdateStudentInfo);
  app.post("/update-driver-info", postUpdateDriverInfo);
  return {
    get: ["/get-id", "/all-users", "/get-user-info", "/get-driver-info"],
    post: ["/update-student-info", "/update-driver-info"],
  };
};
export default execute;
