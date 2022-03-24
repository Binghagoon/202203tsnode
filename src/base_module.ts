import { CallStatus } from "../types/types";

//type GetUserData = (arg: any, conn:Connection) => any;


const allowCallStatus: CallStatus[] = [
  "waiting",
  "canceled",
  "allocated",
  "moving",
  "finish",
];

const statusToNumber: { [status in CallStatus]: number } = {
  waiting: 0,
  canceled: 1,
  allocated: 2,
  moving: 3,
  finish: 4,
};

export {
  allowCallStatus,
  statusToNumber,
};
