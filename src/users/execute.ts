import merge from "../base_modules/merge_path_object";
import { Executable } from "types/types";
import ufi from "./get/users_from_id";
import putUsers from "./put/users";
import getAllUsers from "./get/users";
import delUsers from "./delete/users";
import getId from "./get/id"

const execute: Executable = async (app, conn) =>
  merge(
    await ufi(app, conn),
    await putUsers(app, conn),
    await getAllUsers(app, conn),
    await delUsers(app, conn),
    await getId(app, conn),
  );

export default execute;
