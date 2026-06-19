export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// 카카오 로그인 시작 주소. 서버의 /api/oauth/kakao/login 으로 보내면
// 서버가 카카오 인가 페이지로 리다이렉트한다.
export const getLoginUrl = () => {
  return `${window.location.origin}/api/oauth/kakao/login`;
};
