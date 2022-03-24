import { QueryError } from "mysql2";

const isQueryError = (x: any): x is QueryError =>
  typeof x == "object" && "code" in x;
export default isQueryError;
