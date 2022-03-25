import { KakaoError } from "types/types";
const isKakaoError = (x: any): x is KakaoError => "msg" in x && "code" in x;
export default isKakaoError;
