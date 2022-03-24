import { Connection } from "mysql2";
import connWithPromise from "./conn_with_promise";

const getPositionName = async function (
  number: Number,
  conn: Connection
): Promise<string> {
  let sql = "SELECT name FROM record_position WHERE id = ?";
  let results = await connWithPromise(conn, sql, [number]);
  if (Array.isArray(results) && "name" in results[0]) {
    let name: string = results[0].name;
    return name;
  } else {
    throw new Error("Position name is not string.");
  }
};

const getPhoneAddress = async function (
  number: Number,
  conn: Connection
): Promise<string> {
  let sql = "SELECT phone FROM `user` WHERE id = ?";
  let results = await connWithPromise(conn, sql, [number]);
  if (Array.isArray(results) && "phone" in results[0]) {
    let phone: string = results[0].phone;
    return phone;
  } else {
    throw new Error("Phone address is not string.");
  }
};
export default { getPhoneAddress, getPositionName };
