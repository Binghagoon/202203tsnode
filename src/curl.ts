import {
  CommandType,
  Curl,
  SendKakaoMessageOptions,
  TokenObject,
} from "./../types/types.d";
import commandObject from "./curlCommand.json";
import { kakao_token as kakaoToken } from "../sensitive-value.json";
import { exec } from "child_process";

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
    web_url: "https://smartku.net",
    mobile_web_url: "https://smartku.net",
  },
  button_title: "바로 확인",
};

const execCommand = (command: string): Promise<object | string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        console.error(`error: ${error.message}`);
        debugger;
        reject(error);
      }
      console.log(`stdout: ${stdout}`);
      try {
        const data: object = JSON.parse(stdout);
        resolve(data);
      } catch (e) {
        console.error(e);
        debugger;
        console.log("Error occurred while parsing.");
        return stdout;
      }
    });
  });
};

const createCommand = (templateObject: string | null, curl: Curl): string => {
  let command = curl.exe;
  let header = "";
  let data = "";
  curl.headers.forEach((value, index, array) => {
    if (value.includes("Bearer")) {
      value = value.replace("${accessToken}", kakaoToken.access_token);
    }
    header = `${header} -H "${value}" `;
  });
  curl.data.forEach((value, index, array) => {
    if (value.includes("${templateObject}")) {
      value = value.replace(
        "${templateObject}",
        templateObject ? templateObject : JSON.stringify(memoObject) + "1"
      );
    }
    if (value.includes("${refreshToken}")) {
      value = value.replace("${refreshToken}", kakaoToken.refresh_token);
    }
    data = `${data} --data-urlencode "${value}"`;
  });
  console.log(`${command}\n${header}\n${data}`);
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

/** If you send message you should fulfill option otherwise message is not sended.
 * And If you check `kakao_token` is valid then option must have access_token.
 */
const command = async (
  type: CommandType,
  options?:
    | SendKakaoMessageOptions
    | { access_token?: string; accessToken?: string }
) => {
  let exec = async (templateObject: string | null, curl: Curl) =>
    execCommand(createCommand(templateObject, curl));
  if (type == "memo") {
    return await exec(JSON.stringify(memoObject), commandObject.memo);
  } else if (type == "friends") {
    throw new Error("Not implemented"); //TBD
  } else if (type == "getToken") {
    return await exec(null, commandObject.getToken);
  } else if (type == "sendMessage") {
    if (!options) {
      console.error("Options are omitted.");
      console.log("Error occurred at command at curl.ts.");
      console.log("Kakao message is not sended.");
      throw new Error("Message is not sended");
    }
    if (!("departure" in options)) throw "Error";
    return await exec(
      departureArrivalReplace(options),
      commandObject.sendMessage
    );
  } else if (type == "isValid") {
    if (!(typeof options == "object")) {
      throw 'isValid need options["access_token"]';
    }
    if ("access_token" in options&& typeof options.access_token != "undefined") {
      kakaoToken.access_token = options.access_token;
    } else if ("accessToken" in options&& typeof options.accessToken != "undefined") {
      kakaoToken.access_token = options.accessToken;
    }
    return await exec(null, commandObject.isValid);
  }
};

export { command };
