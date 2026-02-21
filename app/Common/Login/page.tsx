"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ✅ 공용 세션 모듈
import { getRememberMe, setRememberMe } from "../Session/authStorage";
import { getSupabaseBrowserClient, resetSupabaseBrowserClient } from "../Session/supabaseBrowser";

export default function Login() {
  const router = useRouter();

  // ✅ rememberMe는 저장소에서 읽어서 초기 반영
  const [rememberMe, setRememberMeState] = useState(false);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // ✅ 처음 화면 뜰 때 rememberMe 반영 + 이미 로그인 되어있으면 홈으로
  useEffect(() => {
    const saved = getRememberMe();
    setRememberMeState(saved);

    // ✅ 이미 세션 있으면 로그인 페이지 스킵
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push("/");
    });
  }, [router]);

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function normalizeEmail(v: string) {
    return v.trim().toLowerCase();
  }

  function mapErrorToKorean(err: any) {
    const raw = (err?.message ?? "").toString();
    const m = raw.toLowerCase();

    if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
    if (m.includes("email not confirmed"))
      return "이메일 인증이 필요합니다. 받은 편지함에서 인증 메일을 확인해주세요.";
    if (m.includes("invalid email")) return "이메일 형식이 올바르지 않습니다.";
    if (m.includes("rate limit") || m.includes("too many requests"))
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    if (m.includes("network") || m.includes("failed to fetch") || m.includes("fetch"))
      return "네트워크 연결이 불안정합니다. 인터넷 상태를 확인해주세요.";

    return "로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  function validate() {
    const e = email.trim();
    if (!e) return "이메일을 입력해주세요.";
    if (!isValidEmail(e)) return "이메일 형식이 올바르지 않습니다.";
    if (!pw) return "비밀번호를 입력해주세요.";
    return "";
  }

  // ✅ 체크박스 변경 시: rememberMe 저장 + supabase client 정책 초기화
  function onRememberChange(checked: boolean) {
    setRememberMeState(checked);

    // 1) rememberMe 값을 localStorage에 저장
    setRememberMe(checked);

    // 2) supabase client를 다음 호출 때 새로 만들게 리셋
    //    (storage 정책이 바뀌었기 때문에)
    resetSupabaseBrowserClient();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const v = validate();
    if (v) {
      setErrorMsg(v);
      return;
    }

    setLoading(true);

    try {
      // ✅ 로그인 시점에 공용 client 가져오기
      const supabase = getSupabaseBrowserClient();

      const normalizedEmail = normalizeEmail(email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: pw,
      });

      if (error) {
        setErrorMsg(mapErrorToKorean(error));
        return;
      }

      if (data.session) {
        router.push("/");
        return;
      }

      setErrorMsg("로그인은 되었지만 세션 정보를 확인하지 못했습니다. 다시 시도해주세요.");
    } catch (err: any) {
      console.error("Login Error:", err);
      setErrorMsg(mapErrorToKorean(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 font-bold text-3xl mb-2 hover:opacity-80 transition-opacity"
          >
            <span>🐾</span>
            <span>PET HOTEL</span>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">보호자님, 환영합니다!</h2>
          <p className="mt-2 text-sm text-gray-600">아이들의 소식을 확인하시려면 로그인해주세요.</p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-bold text-gray-700">
                  비밀번호
                </label>
                <Link href="/Common/ForgotPassword" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                  비밀번호 찾기
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => onRememberChange(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">
              로그인 상태 유지
              <span className="ml-2 text-xs text-gray-400">
                {rememberMe ? "(LocalStorage: 브라우저 꺼도 유지)" : "(SessionStorage: 탭 닫으면 종료)"}
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-100 hover:shadow-xl hover:-translate-y-0.5"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          아직 계정이 없으신가요?{" "}
          <Link href="/Common/Signup" className="font-bold text-blue-600 hover:text-blue-700 ml-1">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}