const objectKeyCopy = (
    obj: { [x: string]: any },
    originalName: string,
    changedName: string
  ): void => {
    obj[changedName] = obj[originalName];
  };
export default objectKeyCopy;  