// It's refereed from 202009-node/user-location.js at d79410924f350a5a88694c77fb02527abcaf188d

import { Executable } from "../types/types";
import { Response, Request, RequestHandler } from "express";

const execute: Executable = async (app, conn) => {
  const locationInsert: RequestHandler = async (req, res) => {
    try {
      let sql =
        "INSERT INTO user_location (id, latitude, longitude) VALUES (?, ?, ?);";
      let no = req.body.id;
      let name = req.body.name;
      let latitude = req.body.latitude;
      let longitude = req.body.longitude;
      let params = [no, latitude, longitude];
      conn.query(sql, params, function (err, results) {
        if (err) {
          res.send({
            status: "error",
            errorMessage: "Duplicate user's location. use location-update.",
          });
          return;
        }
        res.send({
          status: "success",
        });
        console.log(
          "%s is traced.\n first location is (%s, %s)",
          name,
          latitude,
          longitude
        );
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  const locationUpdate: RequestHandler = async (req, res) => {
    try {
      let sql =
        "UPDATE user_location SET latitude = ?, longitude = ? WHERE id = ?;";
      let no = req.body.id;
      let latitude = req.body.latitude;
      let longitude = req.body.longitude;
      let params = [latitude, longitude, no];
      conn.query(sql, params, function (err, results) {
        if (err) {
          res.send({
            status: "error",
            errorMessage: err.stack,
          });
          return;
        }
        res.send({
          status: "success",
        });
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  const locationDelete: RequestHandler = async (req, res) => {
    try {
      let sql = "DELETE FROM user_location WHERE id = ?;";
      let id = req.body.id;
      let params = [id];
      conn.query(sql, params, function (err, results) {
        if (err) {
          res.send({
            status: "error",
            errorMessage: err.stack,
          });
          return;
        }
        if (Array.isArray(results)) {
          console.error("results are Array. Error on locationDelete.");
          res
            .status(500)
            .send({ status: "error", errorMessage: "Internal Server Error" });
          return;
        }
        if (results.affectedRows == 0) {
          res.send({
            status: "error",
            errorMassage: "value does not existing.",
          });
          return;
        }
        res.send({
          status: "success",
        });
        console.log("someone is untraced.");
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  const getLocation: RequestHandler = async (req, res) => {
    try {
      let sql = "SELECT latitude, longitude FROM user_location WHERE id = ?";
      let no = req.query.id;
      conn.query(sql, [no], function (err, results) {
        if (!Array.isArray(results)) {
          console.error("results are not array. Error occurred on getLocation.");
          res
            .status(500)
            .send({ status: "error", errorMessage: "Internal Server Error" });
          return;
        }
        res.send(results[0]);
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  app.post("/my-location-insert", locationInsert); //will be deprecated
  app.post("/location-insert", locationInsert);
  app.post("/my-location-update", locationUpdate); //will be deprecated
  app.post("/location-update", locationUpdate);
  app.post("/my-location-delete", locationDelete); //will be deprecated
  app.post("/location-delete", locationDelete);
  app.get("/get-location", getLocation);

  return {
    get: ["/get-location"],
    post: [
      "/my-location-insert",
      "/location-insert",
      "/my-location-update",
      "/location-update",
      "/my-location-delete",
      "/location-delete",
    ],
  };
};
export default execute;
