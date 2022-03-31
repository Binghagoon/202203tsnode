import { Connection } from "mysql2";
import connWithPromise from "./conn_with_promise";
import { selectTypeGuard } from "./type_guards/query_results_type_guards";

type HourAndMinute = [number, number];
type minute = number;
type AllowPacket = [minute, minute, number, string?]; // [0]:start  [1]: end  [2]:id  [3]:comment
const allowMinute: AllowPacket[] = [];

const isInt = (number: number) => number - Math.floor(number) == 0;

const changeToMinute = (hour: number, minute: number) => hour * 60 + minute;

const changeToHourAndMinutePacket = (minute: minute): HourAndMinute =>
  isInt(minute) ? [Math.floor(minute / 60), minute % 60] : [NaN, NaN];

const isIn = (minute: minute, allowPacket: AllowPacket) =>
  allowPacket[0] < minute && minute < allowPacket[1];

const addAllowMinute = (allow: AllowPacket) =>
  allowMinute.push(allow) == 1 ? true : false;

const isMinuteValid = (minute: minute) =>
  isInt(minute) && 0 < minute && minute < 60 * 24;

const isAllowMinute = (minute: minute) => {
  let allowable = true;
  allowMinute.forEach((value) => {
    allowable = allowable && !isIn(minute, value);
  });
  return allowable;
};
const getAllowMinuteFromSql = async (conn: Connection) => {
  const sql = "SELECT * FROM allow_time";
  const results = await connWithPromise(conn, sql);
  if (selectTypeGuard(results)) {
    results.forEach((value) =>
      addAllowMinute([value.start, value.end, value.id, value.comment])
    );
  } else throw new Error("Type mismatched.");
};
const removeAllowMinute = (id: number) =>
  allowMinute.forEach((value, index) =>
    value[2] == id ? allowMinute.slice(index, 1) : undefined
  );
const updateAllowMinute = (packet: AllowPacket) =>
  allowMinute.forEach((value) =>
    value[2] == packet[2] ? (value = packet) : undefined
  );

export default {
  initialize: getAllowMinuteFromSql,
  isAllowMinute,
  isMinuteValid,
  changeToHourAndMinutePacket,
  removeAllowMinute,
  updateAllowMinute,
  addAllowMinute,
};
