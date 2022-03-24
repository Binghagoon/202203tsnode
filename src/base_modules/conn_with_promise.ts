import { Connection, FieldPacket } from "mysql2";
import { QueryResults } from "types/types";

const connWithPromise = (
  conn: Connection,
  sql: string,
  params: any[],
  getField = false
): Promise<QueryResults | [QueryResults, FieldPacket[]]> =>
  new Promise(function (resolve, reject) {
    conn.query(sql, params, (err, results, field) => {
      if (err) reject(err);
      else resolve(getField ? [results, field] : results);
    });
  });
export default connWithPromise;
