
const objectKeyRename = (
    obj: { [x: string]: any },
    originalName: string,
    changedName: string
  ): void => {
    obj[changedName] = obj[originalName];
    delete obj[originalName];
  };
export default objectKeyRename;  