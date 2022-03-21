import { TokenObject } from "types/types";
const isAllString = function (...args: any) {
  let b = false;
  for (const arg in args) {
    b = b && typeof arg == "string";
  }
  return b;
};
export const tokenObjectTypeGuard = function (x: any): x is TokenObject {
  return (
    typeof x == "object" &&
    isAllString(x.refresh_token, x.scope, x.access_token)
  );
};
