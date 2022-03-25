import express from "express";
import sensitive from "../data/sensitive-value.json";
import mysql from "mysql2";
import recordPositions from "./record_positions";
import userLocation from "./user_location";
import call from "./call";
import user from "./user";
import authentication from "./authentication";
import message from "./message";
import kakaoToken from "./kakao_token";
import * as uuid from "./uuid";
import { execSync } from "child_process";
import catchError from "./base_modules/catchError";
import data from "./base_modules/data";
import seoulTime from "./base_modules/seoulTime";

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
];
const promise = executableJS.map((jsFile) => jsFile(app, conn));
Promise.all(promise)
  .then(function (values) {
    console.log("All files are executed.");
  })
  .catch(function (error) {
    debugger;
    console.log("Error occurred.");
  });

app.get("/", (req, res) =>
  catchError(res, async () => {
    let d = new Date();
    res.send(
      `Server Alive!! It's time is  ${seoulTime.getTime()}  maybe this is KST.\n`
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
  new Promise<null>((resolve, reject) =>
    app
      .listen(portNumber, () => {
        resolve(null);
      })
      .on("error", reject)
  );
OpenPort(data.getPort())
  .then(function () {
    console.log(`http server opened on port ${data.getPort()}`);
    console.log(`Database is ${sensitive.dbinfo.database}`);
    try {
      const revision = execSync("git rev-parse HEAD").toString().trim();
      const branch = execSync("git rev-parse --abbrev-ref HEAD")
        .toString()
        .trim();
      console.log(`Git hash: ${revision.substring(0, 6)} and Branch:${branch}`);
    } catch (e) {
      console.error(e);
      console.log("Error on print git data. Please see stderr.");
    }
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
