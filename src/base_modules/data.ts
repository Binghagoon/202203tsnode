let port: number | null = null;
let path: string | null = null;

const setPort = (num: number) => {
  if (port) throw new Error("Port number can change only once.");
  port = num;
};
const getPort = () => {
  if (port) return port;
  else throw new Error("Port number did not defined.");
};
const setPath = (arg: string) => {
  if (path) throw new Error("Path string can change only once.");

  //Verify path TBD
  path = arg;
};
const getPath = () => {
  if (path) return path;
  else throw new Error("Path string did not defined.");
};
export default { setPort, getPort, setPath, getPath };

//to be Object
