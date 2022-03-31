import { Executable } from "types/types";
import signUpAllow from "./post/sign_up_allow";
import signUp from "./post/sign_up";
import merge from "../base_modules/merge_path_object";
import signIn from "./get/sign_in";

const execute: Executable = async function (app, conn) {
  return merge(
    await signUp(app, conn),
    await signUpAllow(app, conn),
    await signIn(app, conn)
  );
};
export default execute;
