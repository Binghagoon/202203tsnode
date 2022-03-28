import { Connection } from "mysql2";
import connWithPromise from "./conn_with_promise";
import { selectTypeGuard } from "./type_guards/query_results_type_guards";

const getPositionName = async (number: Number, conn: Connection) => {
  const sql = "SELECT name FROM record_position WHERE id = ?";
  const results = await connWithPromise(conn, sql, [number]);
  if (selectTypeGuard(results)) {
    const name = results[0].name;
    if (typeof name != "string") throw new Error("Name is not string.");
    return name;
  }
  throw new Error("Results is not RawDataPacket.");
};

const getPhoneAddress = async (number: Number, conn: Connection) => {
  const sql = "SELECT phone FROM `user` WHERE id = ?";
  const results = await connWithPromise(conn, sql, [number]);
  if (selectTypeGuard(results)) {
    const phone = results[0].phone;
    if (typeof phone != "string") throw new Error("Phone is not string.");
    return phone;
  }
  throw new Error("Results is not RawDataPacket.");
};

const getRole = async (id: any, conn: Connection) => {
  const sql = "SELECT role FROM user_view WHERE `id` = ?;";
  const params = [id];
  const results = await connWithPromise(conn, sql, params);
  if (!selectTypeGuard(results)) {
    throw "Type mismatched.";
  }
  const role = results[0].role;
  if (typeof role != "string"&& role!==null) throw new Error("Role is not string or null.");
  return role;
};

export default { getPhoneAddress, getPositionName, getRole };
export { getPhoneAddress, getPositionName, getRole };
