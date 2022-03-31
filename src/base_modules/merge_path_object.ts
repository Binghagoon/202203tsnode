import { PathObject } from "types/types";
const concat = (...args: string[]): string[] => {
  let stringList: string[] = [];
  args.forEach((value) => (stringList = stringList.concat(value)));
  return stringList;
};
const merge = (...arg: (PathObject| void)[]): PathObject => {
  const getString: string[] = [];
  const postString: string[] = [];
  const putString: string[] = [];
  const deleteString: string[] = [];
  arg.forEach((value) => {
    if (!value) return;
    value.get ? getString.push(...value.get) : undefined;
    value.put ? putString.push(...value.put) : undefined;
    value.post ? postString.push(...value.post) : undefined;
    value.delete ? deleteString.push(...value.delete) : undefined;
  });
  return {
    get: getString,
    put: putString,
    post: postString,
    delete: deleteString,
  };
};

export default merge;
