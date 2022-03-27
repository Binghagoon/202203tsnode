// It's referred from 202109-node/call.js at fa5fc60f884d1550739ee39b64f395a4136fd0c0.

//import getid from "./get-id-from-username";
import { allowCallStatus, statusToNumber } from "./base_module";
import { sendKakaoMessage } from "./message";
import { CallStatus, Executable, QueryResults } from "types/types";
import { RequestHandler } from "express";
import catchError from "./base_modules/catchError";
import objectKeyRename from "./base_modules/objectKeyRename";
import {
  OkPacketTypeGuard,
  selectTypeGuard,
} from "./base_modules/type_guards/query_results_type_guards";
import connWithPromise from "./base_modules/conn_with_promise";
import noSufficientArgumentError from "./base_modules/not_sufficient_arguments";
import specific from "./base_modules/get_specific_data";
import objectKeyCopy from "./base_modules/object_key_copy";

function checkStatusString(str: CallStatus) {
  try {
    let returnBool = false;
    allowCallStatus.forEach(function (value, index, array) {
      returnBool = value == str || returnBool;
    });
    return returnBool;
  } catch (e) {
    console.log(e);
    return false;
  }
}
const callViewRename = function (value: any) {
  objectKeyRename(value, "call_id", "callNo");
  objectKeyRename(value, "student_name", "studentName");
  objectKeyRename(value, "student_id", "studentId");
  objectKeyRename(value, "departure_name", "departure");
  objectKeyRename(value, "arrival_name", "arrival");
  objectKeyRename(value, "student_phone", "phoneNumber");
  objectKeyRename(value, "is_wheelchair_seat", "isWheelchairSeat");
  objectKeyRename(value, "driver_name", "driverName");
  objectKeyRename(value, "driver_id", "driverId");

  objectKeyCopy(value, "driverId", "driverid");
  objectKeyCopy(value, "studentId", "studentid");
};

const execute: Executable = async function (app, conn) {
  const postCallRequest: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql =
        "INSERT INTO `call` (student_id, departure_id, arrival_id, is_wheelchair_seat)" +
        "VALUES(?, ?, ?, ?);";
      const no = req.body.id;
      //let no = await getid.execute(conn, id);
      const departureNo = req.body.departureNo;
      const arrivalNo = req.body.arrivalNo;
      let isWheelchairSeat;
      try {
        isWheelchairSeat = parseInt(req.body.isWheelchairSeat);
      } catch (e) {
        console.log("may be isWheelchairSeat can not parse to Integer.");
        res.send({
          status: "error",
          errorMessage: "isWheelchairSeat can not parse to Integer.",
        });
      }
      const params = [no, departureNo, arrivalNo, isWheelchairSeat];
      noSufficientArgumentError(params);
      let kakaoResult;
      try {
        let departureName = await specific.getPositionName(departureNo, conn);
        let arrivalName = await specific.getPositionName(arrivalNo, conn);
        let phoneAddress = await specific.getPhoneAddress(no, conn);
        kakaoResult = await sendKakaoMessage({
          departure: departureName,
          arrival: arrivalName,
          phoneAddress: phoneAddress,
        });
      } catch (e) {
        console.log("Error occurred while sending kakao message.");
        console.log(e);
        kakaoResult = {
          status: "error",
          errorMessage: e,
        };
      }
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      const result = {
        callNo: results.insertId,
        kakaoResult: kakaoResult,
      };
      if (results.affectedRows != 1) {
        throw "Multiple line affected.";
      }
      res.send(result);
      console.log("%s has called request! callNo is %s", no, results.insertId);
    });

  const getCallStatus: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "SELECT * FROM call_view WHERE call_id = ?";
      const no = req.query.callNo;
      const params = [no];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results[0] == undefined) {
        res.send({
          status: "error",
          message: "There is no such call.",
        });
        return;
      }
      let result: any = results[0];
      let success = result.driver_id != undefined;
      let driverid = result.driver_id;
      let callStatus = result.status;

      res.send({
        callSuccess: success,
        driverid: driverid,
        callStatus: callStatus,
      });
    });

  const getNoDriverCall: RequestHandler = (req, res) =>
    catchError(res, async () => {
      let sql = "SELECT * FROM call_view WHERE status = 'waiting'";
      const results = await connWithPromise(conn, sql, []);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }
      try {
        results.map(callViewRename);
        res.send(results);
      } catch (e) {
        throw "Error occurred renaming";
      }
    });
  const postCallAccept: RequestHandler = (req, res) =>
    catchError(res, async () => {
      let sql = "SELECT status FROM call_view cv WHERE cv.call_id = ?";
      let callNo = req.body.callNo;
      let results = await connWithPromise(conn, sql, [callNo]);
      if (selectTypeGuard(results)) {
        let status: CallStatus = results[0].status;
        if (status != "waiting") {
          res.status(500).send({
            status: "error",
            ErrorMessage: "You have selected not waiting call.",
          });
        }
      } else {
        throw "SQL return type mismatched. sql is " + sql;
      }

      sql = "UPDATE `call` c SET driver_id = ?, c.`status` = 2  WHERE c.id = ?";
      let driverid = req.body.driverid;
      let params = [driverid, callNo];
      noSufficientArgumentError(params);

      results = await connWithPromise(conn, sql, params);
      if (Array.isArray(results)) {
        throw "call results are not expected value.";
      }

      if (results.affectedRows == 0) {
        console.log(`Nothing is accepted. ${callNo} is call number.`);
        res.send({
          status: "error",
          errorMessage: "nothing is accepted.",
        });
        return;
      }
      sql = "SELECT student_id FROM call_view WHERE call_id = ?";
      noSufficientArgumentError([callNo]);
      results = await connWithPromise(conn, sql, [callNo]);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched";
      }

      let result = results[0];
      if (!("student_id" in result)) {
        throw "results are not expected value.";
      }
      res.send({
        studentid: result.student_id,
      });
    });

  const postCallEnd: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "UPDATE `call` c SET c.`status` = 4  WHERE c.id = ?";
      const no = req.body.callNo;
      const params = [no];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.affectedRows == 0) {
        console.log(`Nothing is ended. ${no} is call number.`);
        res.send({
          status: "error",
          errorMessage: "nothing is ended.",
        });
        return;
      }
      console.log(`Call of number ${no} is ended successfully.`);
      res.send({
        status: "success",
      });
    });

  const postCallCancel: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "UPDATE `call` c SET c.`status` = 1  WHERE c.id = ?";
      const callNo = req.body.callNo;
      const params = [callNo];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.affectedRows == 0) {
        console.log(`Nothing is deleted. ${callNo} is call number.`);
        res.send({
          status: "error",
          errorMessage: "nothing is deleted.",
        });
        return;
      }
      console.log(`Call of number ${callNo} is deleted.`);
      res.send({
        status: "success",
      });
    });
  const postChangeCallStatus: RequestHandler = (req, res) =>
    catchError(res, async () => {
      const sql = "UPDATE `call` c SET c.`status` = ?  WHERE c.id = ?";
      const callStatus: CallStatus = req.body.callStatus;
      const callNo = req.body.callNo;
      const params = [statusToNumber[callStatus], callNo];
      if (!checkStatusString(callStatus)) {
        res.status(500).send({
          status: "error",
          errorMessage: "Status is not allowed string.",
        });
        return;
      }
      const results = await connWithPromise(conn, sql, params);
      if (!OkPacketTypeGuard(results)) {
        throw "Type mismatched";
      }
      if (results.affectedRows == 1) {
        res.status(200).send({
          status: "success",
        });
      } else if (results.affectedRows > 1) {
        res.status(200).send({
          status: "error",
          errorMessage:
            "Affected multiple lines. Please note server administrator.",
        });
      } else if (results.affectedRows == 0) {
        res.status(200).send({
          status: "error",
          errorMessage: "Not affected. Please use right callNo.",
        });
      }
    });
  const getCallInfo: RequestHandler = (req, res) => {
    catchError(res, async () => {
      const sql = "SELECT * FROM call_view WHERE call_id = ?;";
      const query = req.query;
      const id: any = query.id ? query.id : query.callId; //TBD type guard
      const params = [id];
      noSufficientArgumentError(params);
      const results = await connWithPromise(conn, sql, params);
      if (!selectTypeGuard(results)) {
        throw "Type mismatched.";
      }
      if (results.length != 1) {
        throw "Length does not 1.";
      }
      const result = results[0];
      callViewRename(result);
      res.send(result);
    });
  };

  app.get("/call-info", getCallInfo);
  app.get("/get-call-info", getCallInfo);
  app.post("/call-request", postCallRequest);
  app.get("/call-status", getCallStatus);
  app.get("/no-driver-call", getNoDriverCall);
  app.post("/call-accept", postCallAccept);
  app.post("/drive-end", postCallEnd);
  app.post("/call-end", postCallEnd);
  app.post("/call-cancel", postCallCancel);
  app.post("/reservation-delete", postCallCancel);
  app.post("/change-call-status", postChangeCallStatus);
  app.put("/call-status", postChangeCallStatus);
  return {
    put: ["/call-status"],
    post: [
      "/call-request",
      "/call-accept",
      "/drive-end",
      "/call-end",
      "/call-cancel",
      "/reservation-delete",
      "/change-call-status",
    ],
    get: ["/call-status"],
  };
};
export default execute;
