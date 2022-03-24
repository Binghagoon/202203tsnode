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
import { catchError } from "./base_module";
import * as uuid from "./uuid";

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
  if (value == "--receiver") {
    const receiverList = shellArgs.slice(index + 1);
    receiverList.forEach((value) => {
      if (value == "drivers")
        uuid.receiver.push(
          uuid.receiverToUuid["driver1"],
          uuid.receiverToUuid["driver2"]
        );
      else  uuid.receiver.push(uuid.receiverToUuid[value]);
    });
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
      "Server Alive!! It's time is " +
        d.toLocaleString(undefined, { timeZone: "Asia/Seoul" }) +
        " maybe this is KST.\n"
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

const OpenPort = (portNumber: number)=>
  new Promise<null>((resolve, reject) =>
    app
      .listen(portNumber, () => {
        resolve(null);
      })
      .on("error", reject)
  );
OpenPort(sensitive.port)
  .then(function () {
    console.log(`http server opened on port ${sensitive.port}`);
    console.log(`Database is ${sensitive.dbinfo.database}`);
  })
  .catch((e) => {
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
