import { CommandType, Curl, SendKakaoMessageOptions } from "./../types/types.d";
import commandObject from "../data/curlCommand.json";
import { exec } from "child_process";
import { getReceiver } from "./uuid";
import bmData from "./base_modules/data";
import { isPromise } from "util/types";

const memoObject = {
  object_type: "text",
  text: "텍스트 영역입니다. 최대 200자 표시 가능합니다.",
  link: {
    web_url: "https://developers.kakao.com",
    mobile_web_url: "https://developers.kakao.com",
  },
  button_title: "바로 확인",
};
const sendMessageTemplate = {
  object_type: "text",
  text: "호출이 들어왔습니다.\n좌석은 ${seatType}이고, 출발지는 ${departure}이고, 도착지는 ${arrival}입니다.\n 전화번호는 ${phoneAddress}입니다.",
  link: {
    web_url: "https://kubus.bingha.me",
    mobile_web_url: "https://kubus.bingha.me",
  },
  button_title: "바로 확인",
};

const execCommand = (command: string): Promise<object> => {
  return new Promise<object>((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        console.error(`error: ${error.message}`);
        debugger;
        reject(error);
      }
      try {
        const data: object = JSON.parse(stdout);
        resolve(data);
      } catch (e) {
        console.error(e);
        debugger;
        console.log("Error occurred while parsing. What is failed is on stderr.");
        console.error(`Parse failed string:${stdout}`);
        reject(e);
      }
    });
  });
};

const createCommand = async (messageContents: string | null, curl: Curl) => {
  let command = curl.exe;
  let header = "";
  let data = "";
  let tokenObject = await bmData.getToken();
  curl.headers.forEach((value, index, array) => {
    if (value.includes("Bearer")) {
      value = value.replace("${accessToken}", tokenObject.access_token);
    }
    header = `${header} -H "${value}" `;
  });
  curl.data.forEach((value, index, array) => {
    if (value.includes("${templateObject}")) {
      value = value.replace(
        "${templateObject}",
        messageContents ? messageContents : JSON.stringify(memoObject)
      );
    } else if (value.includes("receiver_uuids")) {
      let rcv = getReceiver();
      let string = '"' + rcv.join('","') + '"';
      value = value.replace("list", string);
    } else if (value.includes("${refreshToken}")) {
      value = value.replace("${refreshToken}", tokenObject.refresh_token);
    }
    data = `${data} --data-urlencode '${value}'`;
  });
  //console.log(`${command}\n${header}\n${data}`);
  command = command + header + data;
  return command;
};

function departureArrivalReplace({
  departure,
  arrival,
  phoneAddress,
  seatType,
}: SendKakaoMessageOptions) {
  let template = Object.assign({}, sendMessageTemplate);
  template.text = template.text.replace(
    "${seatType}",
    seatType ? seatType : "미정"
  );
  template.text = template.text.replace("${departure}", departure);
  template.text = template.text.replace("${arrival}", arrival);
  template.text = template.text.replace("${phoneAddress}", phoneAddress);
  return JSON.stringify(template);
}

/**
 * If you send message you should fulfill option otherwise message is not sended.
 */
const command = async (
  type: CommandType,
  options?: SendKakaoMessageOptions
) => {
  let exec = async (messageContents: string | null, curl: Curl) =>
    execCommand(await createCommand(messageContents, curl));
  if (type == "memo") {
    return await exec(JSON.stringify(memoObject), commandObject.memo);
  } else if (type == "friends") {
    return await exec(null, commandObject.friends);
  } else if (type == "getToken") {
    return await exec(null, commandObject.getToken);
  } else if (type == "sendMessage") {
    if (!options) {
      console.error("Options are omitted.");
      console.log("Error occurred at command at curl.ts.");
      console.log("Kakao message is not sended.");
      throw new Error("Message is not sended");
    }
    return await exec(
      departureArrivalReplace(options),
      commandObject.sendMessage
    );
  } else if (type == "isValid") {
    return await exec(null, commandObject.isValid);
  }
  throw new Error("Nothing executed.500");
};

export { command };
