import { OkPacket, RowDataPacket } from "mysql2";
import { QueryResults } from "types/types";
const selectTypeGuard = (
  results: QueryResults | [QueryResults, any]
): results is RowDataPacket[] => {
  return (
    (Array.isArray(results) && results.length == 0) ||
    (Array.isArray(results) &&
      typeof results[0] == "object" &&
      !("affectedRow" in results[0]) &&
      !Array.isArray(results[0]))
  );
};
const OkPacketTypeGuard = (
  results: QueryResults | [QueryResults, any]
): results is OkPacket => {
  return !Array.isArray(results) && "affectedRows" in results;
};
export { selectTypeGuard, OkPacketTypeGuard };
