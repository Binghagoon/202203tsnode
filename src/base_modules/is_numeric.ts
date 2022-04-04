/** ref. https://www.delftstack.com/howto/javascript/check-if-string-is-number-javascript/ */
const isNumeric = (val: any) =>
  typeof val == "string" ? !isNaN(Number(val)) : false;
export const numericTest = (val: any, valueName = "Value") => {
  if (isNumeric(val)) return true;
  else throw new Error(valueName + " is not numeric.400");
};
export default isNumeric;
