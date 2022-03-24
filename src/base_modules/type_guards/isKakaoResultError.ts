import { ErrorKakaoResult } from "types/types";

export const isErrorKakaoResult = (message: any): message is ErrorKakaoResult => {
    return typeof message == "object" && "msg" in message && "code" in message;
  };