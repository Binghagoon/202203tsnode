import { TokenObject } from "./../types/types.d";
import commandObjectJSON from "./curlCommand.json";
import { kakao_token as kakaoToken } from "./sensitive-value.json";
import { exec } from "child_process";

export const execCommand = (command: string): Promise<TokenObject> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        console.log(`error: ${error.message}`);
        debugger;
        reject(error);
      }
      console.log(`stdout: ${stdout}`);
      try {
        const data: TokenObject = JSON.parse(stdout);
        resolve(data);
      } catch (e) {
        debugger;
        console.log("Error occurred while parsing.");
      }
    });
  });
};

export const createCommand = (
  templateObject: TokenObject | null,
  curl: { exe: string; headers: string[]; data: string[] }
): string => {
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
        JSON.stringify(templateObject)
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

export const command = (
  templateObject: TokenObject | null,
  curl: { exe: string; headers: string[]; data: string[] }
): Promise<TokenObject> => {
  return execCommand(createCommand(templateObject, curl));
};

export const commandObject = commandObjectJSON;
