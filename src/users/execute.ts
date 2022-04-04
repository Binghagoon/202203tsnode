import merge from "../base_modules/merge_path_object";
import { Executable } from "types/types";
import ufi from "./get/users_from_id";
import uft from "./get/users_from_type";
import putUsers from "./put/users";
import getAllUsers from "./get/users";
import delUsers from "./delete/users";

const execute: Executable = async (app, conn) =>
  merge(
    await ufi(app, conn),
    await uft(app, conn),
    await putUsers(app, conn),
    await getAllUsers(app, conn),
    await delUsers(app, conn)
  );

export default execute;
