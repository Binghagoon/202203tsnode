const d = new Date();
const addSeconds = function (date: Date, diff?: number) {
  if (!diff) return date;
  let newDate = new Date(date);
  newDate.setTime(newDate.getTime() + diff * 1000);
  return newDate;
};
/** `diff` should be how much add seconds */
const getTime = (diff?: number) => {
  return addSeconds(d, diff).toLocaleString(undefined, {
    timeZone: "Asia/Seoul",
  });
};
const getHour = () => (d.getUTCHours() + 9) % 24;
const getTimeStamp = () => Math.floor(Date.now() / 1000);
export default { getTime, getHour, getTimeStamp };
