const d = new Date();
const getSeoulTime = () => {
  return d.toLocaleString(undefined, { timeZone: "Asia/Seoul" });
};
const getHour = () => (d.getUTCHours() + 9) % 24;
export default{ getSeoulTime, getHour };
