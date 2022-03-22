// It's referred from 202109-node/message.js at dd4aa05e8fa024d46cfa2849156db725098af7ed.

let accessToken: String, refreshToken: String;
import { RequestHandler } from "express";
import { Executable, SendKakaoMessageOptions } from "types/types";
import { catchError } from "./base_module";
import { command } from "./curl";
import * as sensitiveValue from "../data/sensitive-value.json";

function friendList() {
  return  command("friends");
}

const execute: Executable = async function (app, conn) {
  const getFriendList: RequestHandler = async (req, res) =>
    catchError(res, async () => {
      if (req.query.key != sensitiveValue.key) {
        throw new Error("key is incorrect 400");
      }
      let list;
      try {
        list = await friendList();
      } catch (e) {
        debugger;
      }
      res.send(list);
    });
  const sendMessage: RequestHandler = async (req, res) =>
    catchError(res, async () => {
      let data =await sendKakaoMessage({
        departure: "서울",
        arrival: "동대구",
        phoneAddress: "010-1111-2222",
        seatType: "테스트",
      });
      console.log(data);
      res.send(data);
    });

  app.get("/friend-list", getFriendList);
  app.post("/send-message", sendMessage);
  app.get("/send-message", sendMessage);
};
async function sendKakaoMessage(options: SendKakaoMessageOptions) {
  let message = await command("sendMessage", options);
  return message;
}
export {
  /** option needs to be object and have departure, arrival, phoneAddress, ?seatType */
  sendKakaoMessage,
};
export default execute;
