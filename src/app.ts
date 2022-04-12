import express from "express";
import sensitive from "../data/sensitive-value.json";
import mysql from "mysql2";
import recordPositions from "./record_positions";
import userLocation from "./user_location";
import call from "./call";
import user from "./user";
import authentication from "./authentication/execute";
import message from "./message";
import kakaoToken from "./kakao_token";
import * as uuid from "./uuid";
import { execSync } from "child_process";
import catchError from "./base_modules/catch_error";
import data from "./base_modules/data";
import seoulTime from "./base_modules/seoul_time";
import { verifyToken } from "./base_modules/verify_token";
import time from "./time/execute";
import merge from "./base_modules/merge_path_object";
import users from "./users/execute";
import location from "./location/execute";

const app = express();
let conn = mysql.createConnection(sensitive.dbinfo);
const revision = execSync("git rev-parse HEAD").toString().trim();
const branch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
const shortRevision = revision.substring(0, 6);
let verbose: boolean = false;
conn.connect((err) => {
  if (err) {
    console.error(err);
    throw err;
  }
  console.log("Connected to database.");
  setTimeout(() =>
    conn.query("SELECT 1;",
      () => console.log("Query which let connection live send.")),
    14000 * 1000)// interactive_time out = 28800
});
conn.on("error", (err: { code: any; }) => {
  console.log("DB Error : ", err);
  if (err.code == 'PROTOCOL_CONNECTION_LOST') {
    conn = mysql.createConnection(sensitive.dbinfo);
  } else {
    console.log("Not expected error.");
  }  

})
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
const shellArgs = process.argv.slice(2);
shellArgs.forEach((value, index, array) => {
  if (value == "--receiver" || value == "-rcv") {
    const receiverList = shellArgs.slice(index + 1);
    receiverList.forEach((value) => {
      if (value == "drivers")
        uuid.receiver.push(
          uuid.receiverToUuid["driver1"],
          uuid.receiverToUuid["driver2"]
        );
      else {
        let uu = uuid.receiverToUuid[value];
        if (uu) uuid.receiver.push(uu);
      }
    });
  } else if (value == "--port" || value == "-p") {
    try {
      data.setPort(parseInt(array[index + 1]));
    } catch (e) {
      console.log("Port number should be number whose value is integer.");
      console.log(e);
      console.error(e);
    }
  } else if (value == "--kakao-path" || value == "-kp") {
    try {
      data.setPath(array[index + 1]);
    } catch (e) {
      console.log(e);
      console.error(e);
    }
  } else if (value == "-v") {
    verbose = true;
  }
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
  time,
  users,
  location,
];
const promise = executableJS.map((jsFile) => jsFile(app, conn));
Promise.all(promise)
  .then(function (values) {
    console.log("All files are executed.");
    if (verbose)
      console.log(
        "Available path list is " +
        JSON.stringify(merge(...values), undefined, 2)
      );
  })
  .catch(function (error) {
    debugger;
    console.log("Error occurred.");
    console.log(error);
    console.error(error);
    throw error;
  });
verifyToken();

app.get("/", (req, res) =>
  catchError(res, async () => {
    let testQuery = new Promise((resolve, reject) => conn.query("SELECT 1;", (err) => err ? reject(err) : resolve(true)));
    let connectionState;
    try {
      if (await testQuery) connectionState = "connected";
    } catch (e) {
      connectionState = "disconnected or error";
    }
    res.send(
      `Server Alive!! It's time is  ${seoulTime.getTime()}  maybe this is KST.\n` +
      `Git branch is ${branch} and git revision is ${revision}.\n` +
      `Mysql connection is ${connectionState}.\n`
    );
  })
);
//app.post('/sign-out',serverFunction.SignOut(conn));
//app.post('/sign-up', serverFunction.SignUp(conn));
//app.post('/sign-up-allow', serverFunction.SignUpAllow(conn));
//app.get("/all-user-get", serverFunction.AllUserGet(conn));
//app.post("/user-config", serverFunction.UserConfig(conn));
//app.post('/login', serverFunction.Login(conn));
//app.post('/logout', serverFunction.Logout(conn));
//app.get("/get-location", serverFunction.GetLocation(conn));
//app.post("/session-update", serverFunction.SessionUpdate(conn));

const OpenPort = (portNumber: number) =>
  new Promise<void>((resolve, reject) =>
    app
      .listen(portNumber, resolve)
      .on("error", reject)
  );
OpenPort(data.getPort())
  .then(function () {
    console.log(`http server opened on port ${data.getPort()}`);
    console.log(`Database is ${sensitive.dbinfo.database}`);
    console.log(`Git revision: ${shortRevision} and Branch:${branch}`);
  })
  .catch((e) => {
    console.log("Can`t open port %d", data.getPort());
    throw e;
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
