import sensitive from "../data/sensitive-value.json";
import seoul from "./base_modules/seoulTime";
export const receiverToUuid: { [user: string]: string } = {
  minseong: sensitive.friends.elements[0].uuid,
  driver1: sensitive.friends.elements[1].uuid,
  driver2: sensitive.friends.elements[2].uuid,
};
export const receiver: string[] = [];
export const getReceiver = (): string[] => {
  const hour = seoul.getHour();
  if (hour < 8 || hour > 19) {
    let msuuid = sensitive.friends.elements[0].uuid;
    if (receiver.includes(msuuid)) return [msuuid];
    else return [];
  } else {
    return receiver;
  }
};
