// It's referred from 202109-node/call.js at fa5fc60f884d1550739ee39b64f395a4136fd0c0.

//import getid from "./get-id-from-username";
import {
  treatError,
  objectKeyRename,
  noSufficientArgumentError,
  allowCallStatus,
  statusToNumber,
  getPositionName,
  getPhoneAddress,
  ifErrorRaise500,
  raise500,
  connWithPromise,
  selectTypeGuard,
} from "./base_module";
import { sendKakaoMessage } from "./message";
import { CallStatus, Executable } from "types/types";
import { RequestHandler } from "express";

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

const execute: Executable = async function (app, conn) {
  const postCallRequest: RequestHandler = async (req, res) => {
    try {
      //POST
      let sql =
        "INSERT INTO `call` (student_id, departure_id, arrival_id, is_wheelchair_seat)" +
        "VALUES(?, ?, ?, ?);";
      let no = req.body.id;
      //let no = await getid.execute(conn, id);
      let departureNo = req.body.departureNo;
      let arrivalNo = req.body.arrivalNo;
      let isWheelchairSeat;
      try {
        isWheelchairSeat = parseInt(req.body.isWheelchairSeat);
      } catch (e) {
        console.log("may be isWheelchairSeat can not parse to Integer.");
        res.send({
          status: "error",
          errorMessage: "isWheelchairSeat can not parse to Integer.",
        });
        return;
      }
      let params = [no, departureNo, arrivalNo, isWheelchairSeat];
      if (noSufficientArgumentError(params, res)) {
        return;
      }
      try {
        let departureName = await getPositionName(departureNo, conn);
        let arrivalName = await getPositionName(arrivalNo, conn);
        let phoneAddress = await getPhoneAddress(no, conn);
        await sendKakaoMessage({
          departure: departureName,
          arrival: arrivalName,
          phoneAddress: phoneAddress,
        });
      } catch (e) {
        console.log("Error occurred while sending kakao message.");
        console.log(e);
        debugger;
      }
      conn.query(sql, params, (err, results, fields) => {
        if (Array.isArray(results)) {
          raise500(res);
          return;
        }
        if (treatError(err, res, "callRequest")) {
          return;
        }
        let result = {
          callNo: results.insertId,
        };
        if (results.affectedRows != 1) {
          console.log("There is some problem near on call.js:77");
          res.send({
            status: "error",
            errorMessage: "Affected multiple rows.",
          });
        }
        res.send(result);
        console.log(
          "%s has called request! callNo is %s",
          no,
          results.insertId
        );
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  const getCallStatus: RequestHandler = (req, res) => {
    try {
      //GET
      let sql = "SELECT * FROM call_view WHERE call_id = ?";
      let no = req.query.callNo;
      let params = [no];
      if (noSufficientArgumentError(params, res)) {
        return;
      }
      conn.query(sql, params, function (err, results, fields) {
        if (treatError(err, res, "callStatus")) {
          raise500(res);
          return;
        }
        if (!Array.isArray(results)) {
          raise500(res);
          return;
        }
        if (results[0] == undefined) {
          res.send({
            status: "error",
            message: "There is no such call.",
          });
          return;
        }
        ifErrorRaise500(res, () => {
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
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  const getNoDriverCall: RequestHandler = (req, res) => {
    try {
      let sql = "SELECT * FROM call_view WHERE status = 'waiting'";
      conn.query(sql, function (err, results) {
        if (treatError(err, res, "noDriverCall")) {
          raise500(res);
          return;
        }
        if (!Array.isArray(results)) {
          raise500(res);
          return;
        }
        results.map(function (value) {
          objectKeyRename(value, "call_id", "callNo");
          objectKeyRename(value, "student_name", "studentName");
          objectKeyRename(value, "student_id", "studentid");
          objectKeyRename(value, "departure_name", "departure");
          objectKeyRename(value, "arrival_name", "arrival");
          objectKeyRename(value, "student_phone", "phoneNumber");
          objectKeyRename(value, "is_wheelchair_seat", "isWheelchairSeat");
        });
        res.send(results);
      });
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  const postCallAccept: RequestHandler = (req, res) =>
    ifErrorRaise500(res, async () => {
      let sql = "SELECT status FROM call_view cv WHERE cv.id = ?";
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

      if (noSufficientArgumentError(params, res)) {
        return;
      }
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
      results = await connWithPromise(conn, sql, [callNo]);
      if (!Array.isArray(results)) {
        throw "call_view results are not expected value.";
      }

      let result = results[0];
      if (!("student_id" in result)) {
        throw "results are not expected value.";
      }
      res.send({
        studentid: result.student_id,
      });
    });

  const postCallEnd: RequestHandler = (req, res) => {
    try {
      let sql = "UPDATE `call` c SET c.`status` = 4  WHERE c.id = ?";
      let callNo = req.body.callNo;
      let no = callNo;
      let params = [no];
      if (noSufficientArgumentError(params, res)) {
        return;
      }
      conn.query(sql, [no], function (err, results, fields) {
        if (treatError(err, res, "callEnd")) {
          raise500(res);
          return;
        }
        if (Array.isArray(results)) {
          raise500(res);
          return;
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
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

  const postCallCancel: RequestHandler = (req, res) => {
    try {
      //POST
      let sql = "UPDATE `call` c SET c.`status` = 1  WHERE c.id = ?";
      let callNo = req.body.callNo;
      let params = [callNo];
      if (noSufficientArgumentError(params, res)) {
        return;
      }
      conn.query(sql, params, function (err, results, fields) {
        if (treatError(err, res, "callCancel")) {
          return;
        }
        if (Array.isArray(results)) {
          raise500(res);
          return;
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
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };
  const postChangeCallStatus: RequestHandler = (req, res) => {
    try {
      let sql = "UPDATE `call` c SET c.`status` = ?  WHERE c.id = ?";
      let callStatus: CallStatus = req.body.callStatus;
      let callNo = req.body.callNo;
      let param = [statusToNumber[callStatus], callNo];
      if (!checkStatusString(callStatus)) {
        res.status(500).send({
          status: "error",
          errorMessage: "Status is not allowed string.",
        });
        return;
      }
      conn.query(sql, param, async function (err, results, fields) {
        if (Array.isArray(results)) {
          raise500(res);
          return;
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
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };

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
