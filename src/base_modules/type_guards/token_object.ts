import { TokenObject } from "types/types";
const isAllString = function (...args: any) {
  let b = true;
  for (const arg in args) {
    b = b && typeof arg == "string";
  }
  return b;
};
export const tokenObjectTypeGuard = function (x: any): x is TokenObject {
  return (
    typeof x == "object" &&
    isAllString(x.refresh_token, x.scope, x.access_token, x.refresh_time_stamp)
  );
};
export default tokenObjectTypeGuard;