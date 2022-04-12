import { Connection } from "mysql2";
import connWithPromise from "./conn_with_promise";
import { OkPacketTypeGuard } from "./type_guards/query_results_type_guards";

const AddUser = async (conn: Connection, realname: any, username: any, email: any, phone: any) => {
  const sql = "INSERT INTO user (realname, username, email, phone) VALUES (?, ?, ?, ?);";
  const params = [realname, username, email, phone];
  const results = await connWithPromise(conn, sql, params);
  if (!OkPacketTypeGuard(results)) {
    throw "Type mismatched";
  }
  return results.insertId;
}
export { AddUser };