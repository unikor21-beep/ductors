import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import axios from "axios";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USERINFO_URL = "https://kapi.kakao.com/v2/user/me";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerKakaoOAuthRoutes(app: Express) {
  // 1) 로그인 시작: 카카오 인가 페이지로 리다이렉트
  app.get("/api/oauth/kakao/login", (req: Request, res: Response) => {
    const restApiKey = process.env.KAKAO_REST_API_KEY;
    if (!restApiKey) {
      res.status(500).json({ error: "KAKAO_REST_API_KEY is not configured" });
      return;
    }
    const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/callback/kakao`;
    const authUrl = new URL("https://kauth.kakao.com/oauth/authorize");
    authUrl.searchParams.set("client_id", restApiKey);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    res.redirect(302, authUrl.toString());
  });

  // 2) 콜백: 인가 코드 -> 토큰 -> 사용자 정보 -> 세션 발급
  app.get("/api/oauth/callback/kakao", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    const restApiKey = process.env.KAKAO_REST_API_KEY;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;
    if (!restApiKey) {
      res.status(500).json({ error: "KAKAO_REST_API_KEY is not configured" });
      return;
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/callback/kakao`;

    try {
      // 토큰 발급
      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: restApiKey,
        redirect_uri: redirectUri,
        code,
      });
      if (clientSecret) tokenParams.set("client_secret", clientSecret);

      const tokenRes = await axios.post(KAKAO_TOKEN_URL, tokenParams.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      });
      const accessToken = tokenRes.data.access_token as string;

      // 사용자 정보 조회
      const userRes = await axios.get(KAKAO_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const kakaoId = String(userRes.data.id);
      const kakaoAccount = userRes.data.kakao_account ?? {};
      const profile = kakaoAccount.profile ?? {};
      const openId = `kakao_${kakaoId}`;

      // 사용자 저장 (있으면 업데이트, 없으면 생성)
      await db.upsertUser({
        openId,
        name: profile.nickname ?? null,
        email: kakaoAccount.email ?? null,
        profileImage: profile.profile_image_url ?? null,
        loginMethod: "kakao",
        lastSignedIn: new Date(),
      });

      // 세션 토큰 생성 & 쿠키 설정
      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.nickname || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error: any) {
      console.error("[Kakao OAuth] Callback failed", error?.response?.data ?? error);
      res.status(500).json({ error: "Kakao OAuth callback failed" });
    }
  });
}
