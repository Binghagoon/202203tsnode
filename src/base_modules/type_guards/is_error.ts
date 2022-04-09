const isError = (x: any): x is Error => typeof x == "object" && "message" in x;
export default isError;
