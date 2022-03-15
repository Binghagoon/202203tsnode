import express, { Request, Response, NextFunction } from "express";
import {
  createConnection,
  QueryError,
  RowDataPacket,
  OkPacket,
  ResultSetHeader,
} from "mysql2";
import value from "./sensitive-value.json";
import packageJson from "../package.json";
import { execute as user } from "./user";
const app = express();
const conn = createConnection(value.dbinfo);

conn.query("SELECT ?", [1], function (err: QueryError | null, result) {});

app.get("/welcome", async (req: Request, res: Response, next: NextFunction) => {
  res.send("welcome!");
});
user(app, conn);

app.listen(value.port, () => {
  console.log(`
  ################################################
  🛡️  Server listening on port: ${value.port}
  ################################################
`);
});
