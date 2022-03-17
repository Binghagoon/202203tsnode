import express from "express";
import bodyPraser from "body-parser";
import fs from "fs/promises";
import sensitive from "./sensitive-value.json";
import mysql from "mysql2";
import recordPositions from "./record_positions";
import userLocation from "./user-location";
import call from "./call";
import user from "./user";
import authentication from "./authentication";
import message from "./message";
import kakaoToken from "./kakao_token";

const app = express();
const conn = mysql.createConnection(sensitive.dbinfo);
conn.connect();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

//var serverFunction = require("./open_server");
const executableJS = [
  recordPositions,
  userLocation,
  call,
  user,
  authentication,
  message,
  kakaoToken,
];
const promise = executableJS.map((jsFile) => jsFile.execute(app, conn));
Promise.all(promise)
  .then(function (values) {
    console.log("All files are executed.");
  })
  .catch(function (error) {
    debugger;
    console.log("Error occured.");
  });

app.get("/", function (req, res) {
  try {
    let d = new Date();
    res.send(
      "Server Alive!! It's time is " +
        d.toLocaleString(undefined, { timeZone: "Asia/Seoul" }) +
        " maybe this is KST.\n"
    );
      } catch (e) {
      console.error(e);
      console.log("error occured please see error log.");
    res
      .status(500)
      .send({ status: "error", errorMessage: "Internal Server Error" });
  }
});
app.post("/post-test", async function (req, res) {
  try {
    debugger;
    res.send(`Hello`);
      } catch (e) {
      console.error(e);
      console.log("error occured please see error log.");
    res
      .status(500)
      .send({ status: "error", errorMessage: "Internal Server Error" });
  }
});
app.get("/throw-error", async function (req, res) {
  try {
      } catch (e) {
      console.error(e);
      console.log("error occured please see error log.");
    res
      .status(500)
      .send({ status: "error", errorMessage: "Internal Server Error" });
  }
});
//app.post('/sign-out',serverFunction.SignOut(conn));
//app.post('/sign-up', serverFunction.SignUp(conn));
//app.post('/sign-up-allow', serverFunction.SignUpAllow(conn));
//app.get("/all-user-get", serverFunction.AllUserGet(conn));
//app.post("/user-config", serverFunction.UserConfig(conn));
//app.post('/login', serverFunction.Login(conn));
//app.post('/logout', serverFunction.Logout(conn));
//app.get("/get-location", serverFunction.GetLocation(conn));
//app.post("/session-update", serverFunction.SessionUpdate(conn));

app.listen(sensitive.port, () => {
  console.log("http server opened on port %d", sensitive.port);
  console.log(`Database is ${sensitive.dbinfo.database}`);
});
/*
app.get('/sign-all', (req, res)=>{
    //var sql = 'SELECT * FROM `user` u INNER JOIN `user_role` ur on  u.`no` = ur.`no` INNER JOIN roletype rt ON rt. WHERE `id` = ?;';
    var sql = 'SELECT u.`no`, `name`, `id`, `role` FROM `user` u ' +
              'INNER JOIN `user_role` ur ON ur.`no` = u.`no` ' +
              'INNER JOIN roletype rt ON rt.role_no = ur.role_no ';
    var arg = req.query;
    var params = [arg.id];
    conn.query(sql, params, (err, results, fields)=>{
        if(err){ console.log(err.stack); throw err}
        console.log("Sign in");
        console.log(results);
        if(results.length == 0)  res.status(200).send({'notRegistered':true});
        else res.status(200).send(results[0]);
    });
});
*/
