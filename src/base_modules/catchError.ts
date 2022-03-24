import moment from "moment";
import isError from "./type_guards/isError";
import isQueryError from "./type_guards/isQueryError";
import { Response } from "express";

/**
 * message string property in Error Object must have 3-digit end of string which is HTTP error code.
 * Error example new Error("No sufficient arguments.400");.
 * 4XX:Error Object or number.
 * 5XX: Error Object or number or string.
 * @param res Express res
 * @param callback Some function, function or Promise; async function
 * @param args function's arguments
 * @returns callback return value: any
 */
const catchError = async (
  res: Response,
  callback: Function | ((...args: any) => Promise<any> | any),
  ...args: any[]
) => {
  try {
    return await callback(...args);
  } catch (e) {
    let message: string, code: number, stack: string, errorObject: Error;
    message = "Unknown error";
    code = 500;
    stack = "There is no stack.";
    let seoulTime = moment().tz("Asia/Seoul").format();
    seoulTime = seoulTime.slice(0, -6); //Delete +09:00
    console.error("\n-------Error Print");
    if (isQueryError(e)) {
      console.error(`Query error name: ${e.name}`);
      console.error(`Query message: ${e.message}`);
      message = "Query error.";
      code = 500;
      stack = e.stack ? e.stack : stack;
    } else if (isError(e)) {
      let errorMessage = e.message;
      let codeString = errorMessage.slice(-3);
      code = parseInt(codeString);
      if (!isNaN(code)) {
        message = errorMessage.slice(0, -3);
      } else {
        message = "Pure Error Object. Described on stderr.";
      }
      stack = e.stack ? e.stack : stack;
    } else if (typeof e == "string") {
      message = e;
      code = 500;
    } else if (typeof e == "number") {
      if (e == 400) {
        message = "Bad request, in most cases argument is not sufficient.";
      } else if (e >= 400 || e < 500) {
        message = "Client Error";
      }
      if (e == 500) {
        message = "Internal Server Error";
      }
      if (e > 500 || e < 600) {
        message = "Other server Error";
      }
      code = e;
    }
    console.error(`Time(in KST): ${seoulTime}`);
    console.error(`Error: ${message}`);
    console.error(`Code:${code}`);
    console.error(`Stack↓\n${stack}`);
    console.error("-------Error Print End\n");
    console.log(
      `Error occurred: {\n  Time(in KST):${seoulTime},\n  Error: ${message},\n  Code:${code}\n}`
    );
    res.status(code).send({ status: "error", errorMessage: message });
    return null;
  }
};
export default catchError;