// It's refered from 202109-node/message.js at dd4aa05e8fa024d46cfa2849156db725098af7ed.

let accessToken: String, refrashToken: String;
import { RequestHandler } from "express";
import { Executable, SendKakaoMeessageOptions } from "types/types";
import {commend} from"./curl";

async function friendList() {
  return await commend("friends");
}

const execute: Executable = async function (app, conn) {
  const getFriendList: RequestHandler = async (req, res) => {
    try {
      let list;
      try {
        list = friendList();
      } catch (e) {
        debugger;
      }
      res.send(list);
    } catch (e) {
      console.log(e);
      res
        .status(500)
        .send({ status: "error", errorMessage: "Internal Server Error" });
    }
  };
  const sendMessage: RequestHandler = async (req, res) => {
      try {
        await sendKakaoMessage({
          departure: "서울",
          arrival: "부산",
          phoneAddress: "010-1111-2222",
          seatType:"테스트",
        });
        res.send({ status: "success" });
      } catch (e) {
        console.log(e);
        console.log(e);
        res
          .status(500)
          .send({ status: "error", errorMessage: "Internal Server Error" });
      }
  };

  app.get("/friend-list", getFriendList);
  app.post("/send-message", sendMessage);
  app.get("/send-message", sendMessage);
};
async function sendKakaoMessage(options: SendKakaoMeessageOptions) {
  let massage = await commend("sendMessage", options);
  return massage;
}
export{
  /** option needs to be object and have departure, arrival, phoneAddress, ?seatType */
  sendKakaoMessage,
}
export default execute;