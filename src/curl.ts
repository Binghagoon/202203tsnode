import {
  CommendType,
  Curl,
  SendKakaoMeessageOptions,
  TokenObject,
} from "./../types/types.d";
import commendObject from "./curlCommand.json";
import { kakao_token as kakaoToken } from "./sensitive-value.json";
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
const sendMessageTemplete = {
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
}: SendKakaoMeessageOptions) {
  let template = Object.assign({}, sendMessageTemplete);
  template.text = template.text.replace(
    "${seatType}",
    seatType ? seatType : "미정"
  );
  template.text = template.text.replace("${departure}", departure);
  template.text = template.text.replace("${arrival}", arrival);
  template.text = template.text.replace("${phoneAddress}", phoneAddress);
  return JSON.stringify(template);
}
/** If you send message you should fulfill option otherwise message is not sended. */
const commend = async (
  type: CommendType,
  options?: SendKakaoMeessageOptions
) => {
  let exec = async (templateObject: string | null, curl: Curl) =>
    execCommand(createCommand(templateObject, curl));
  if (type == "memo") {
    return await exec(JSON.stringify(memoObject), commendObject.memo);
  } else if (type == "friends") {
    throw new Error("Not implemented") //TBD
  } else if (type == "getToken") {
    return await exec(null, commendObject.getToken);
  } else if (type == "sendMessage") {
    if (!options) {
      console.error("Options are omitted.");
      console.log("Error occured at commend at curl.ts.");
      console.log("Kakao message is not sended.");
      throw new Error("Message is not sended");
    }
    return await exec(
      departureArrivalReplace(options),
      commendObject.sendMessage
    );
  }
};

export { commend };
