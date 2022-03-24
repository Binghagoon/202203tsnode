import { Response } from "express";
const noSufficientArgumentError = (args: any[], res?: Response): boolean => {
  //to be tested.
  let b = false;
  for (const val of args) {
    b = b || (val == undefined && val == "undefined");
  }
  if (b) {
    if (res) {
      res.send({
        status: "error",
        errorMessage: "No sufficient arguments",
      });
      return true;
    } else {
      throw new Error("No sufficient arguments400");
    }
  }
  return false;
};
export default noSufficientArgumentError;