import seoulTime from "./seoulTime";
import bsData from "./data";

const timeOutWork = async () => {
  try {
    console.log("Refreshing token.");
    if (!(await bsData.getNewerTokenFromFile())) await bsData.doRefresh();
    await verifyToken();
  } catch (e) {
    console.log("Error on refreshing. Please see stderr.");
    console.error(e);
    debugger;
    throw e;
  }
};

export const verifyToken = async (forceRefresh: boolean = false) => {
  const kakaoToken = await bsData.getToken();
  const ts = seoulTime.getTimeStamp();
  const diff = kakaoToken.time_stamp + kakaoToken.expires_in - ts;
  if (diff <= 0) {
    console.log("Kakao token has been expired before %d seconds.", -diff);
  } else {
    console.log(
      `Kakao token can live for ${diff} seconds from now.` +
        `\n\t(Now is ${ts}, also as ${seoulTime.getTime()} in KST)` +
        `\n\tWhen time is ${seoulTime.getTime(diff)}, Token will die.`
    );
    console.log(
      "Add event of refreshing token at %s in KST",
      seoulTime.getTime(diff - 100)
    );
    setTimeout(timeOutWork, (diff - 100) * 1000);
    const rdiff =
      kakaoToken.time_stamp + kakaoToken.refresh_token_expires_in - ts;
    console.log(
      `Refresh token can live before ${seoulTime.getTime(rdiff)} in KST.`
    );
  }
  if (isNaN(diff) || diff < 1000 || forceRefresh) {
    console.log("Getting new tokens...");
    await timeOutWork();
  }
};
