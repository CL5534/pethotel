export const dynamic = "force-dynamic";

"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 테스트 값(원하면 지워도 됨)
  const [name, setName] = useState("임꺽정");
  const [email, setEmail] = useState("cof5534@gmail.com");
  const [phone, setPhone] = useState("010-1234-5678");
  const [address1, setAddress1] = useState("병점");
  const [address2, setAddress2] = useState("107동");
  const [pw, setPw] = useState("@1qaz2wsx3e");
  const [pw2, setPw2] = useState("@1qaz2wsx3e");

  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function normalizeEmail(v: string) {
    return v.trim().toLowerCase();
  }

  // 전화번호: "문자 막기"가 목적. (010/자리수 고정 X)
  // 저장은 입력값을 최대한 유지하되, 양쪽 공백 제거만.
  function normalizePhone(v: string) {
    return v.trim();
  }

  // 비밀번호 정책(원하면 여기만 수정하면 됨)
  function validatePassword(password: string) {
    if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    if (/\s/.test(password)) return "비밀번호에는 공백을 사용할 수 없습니다.";

    // 아래 3줄이 “영문/숫자/특수문자” 강제 규칙
    // 원하지 않으면 지우면 됨.
    if (!/[A-Za-z]/.test(password)) return "비밀번호에는 영문이 최소 1자 이상 포함되어야 합니다.";
    if (!/[0-9]/.test(password)) return "비밀번호에는 숫자가 최소 1자 이상 포함되어야 합니다.";
    if (!/[`~!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|]/.test(password))
      return "비밀번호에는 특수문자가 최소 1자 이상 포함되어야 합니다.";

    return "";
  }

  function validate() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedAddress1 = address1.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) return "이름을 입력해주세요.";
    if (!trimmedEmail) return "이메일을 입력해주세요.";
    if (!isValidEmail(trimmedEmail)) return "이메일 형식이 올바르지 않습니다.";

    if (!pw) return "비밀번호를 입력해주세요.";
    const pwMsg = validatePassword(pw);
    if (pwMsg) return pwMsg;

    if (pw !== pw2) return "비밀번호가 일치하지 않습니다.";

    if (!trimmedPhone) return "휴대폰 번호를 입력해주세요.";

    // ✅ 문자(w 같은거) 막기: 숫자/하이픈/공백만 허용
    if (!/^[0-9\-\s]+$/.test(trimmedPhone)) {
      return "휴대폰 번호에는 숫자, 하이픈(-), 공백만 입력할 수 있습니다.";
    }

    // 너무 짧은 건 막기(옛날 번호 고려해서 넉넉하게)
    const phoneDigits = trimmedPhone.replace(/\D/g, "");
    if (phoneDigits.length < 8) return "휴대폰 번호를 정확히 입력해주세요.";

    if (!trimmedAddress1) return "기본 주소를 입력해주세요.";
    return "";
  }

  // ✅ 에러 처리 통합(딱 1개)
  function mapErrorToKorean(err: any) {
    const raw = (err?.message ?? "").toString();
    const m = raw.toLowerCase();
    const code = err?.code;

    // 1) DB UNIQUE(또는 유사 문구) - auth 트리거에서 실패해도 이런 문구가 섞여 나올 수 있음
    if (
      code === "23505" ||
      m.includes("duplicate key value") ||
      m.includes("violates unique constraint")
    ) {
      // 어떤 컬럼인지 최대한 구분
      if (m.includes("profiles_email_unique") || m.includes("email")) {
        return "이미 사용 중인 이메일입니다.";
      }
      if (m.includes("profiles_phone_unique") || m.includes("phone")) {
        return "이미 등록된 휴대폰 번호입니다.";
      }
      return "이미 등록된 정보가 있습니다.";
    }

    // 2) Auth 계열
    if (m.includes("already registered") || m.includes("already exists") || m.includes("user already registered")) {
      return "이미 가입된 이메일입니다. 로그인 페이지에서 로그인해주세요.";
    }
    if (m.includes("invalid email") || (m.includes("email") && m.includes("invalid"))) {
      return "이메일 형식이 올바르지 않습니다.";
    }
    if (m.includes("password") && (m.includes("weak") || m.includes("length"))) {
      return "비밀번호가 너무 약합니다. 비밀번호 조건을 다시 확인해주세요.";
    }
    if (m.includes("rate limit") || m.includes("too many requests")) {
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    }

    // 3) 권한/RLS
    if (m.includes("permission") || m.includes("not allowed") || m.includes("rls")) {
      return "권한 설정 문제로 처리가 불가능합니다. 관리자에게 문의해주세요.";
    }

    // 4) 네트워크
    if (m.includes("network") || m.includes("failed to fetch") || m.includes("fetch")) {
      return "네트워크 연결이 불안정합니다. 인터넷 상태를 확인해주세요.";
    }

    return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  // (선택) 가입 전에 미리 중복 확인: RLS 때문에 막혀있을 수 있음.
  // 막혀도 DB UNIQUE가 최종 방어라서 “없어도 됨”.
  async function precheckDuplicate(normalizedEmail: string, normalizedPhone: string) {
    // 이메일
    const { data: emailRow, error: emailErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!emailErr && emailRow) return "이미 가입된 이메일입니다. 로그인 페이지에서 로그인해주세요.";

    // 전화번호
    const { data: phoneRow, error: phoneErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (!phoneErr && phoneRow) return "이미 등록된 휴대폰 번호입니다. 다른 번호를 사용해주세요.";

    // RLS로 에러 나는 경우는 그냥 통과(최종은 UNIQUE가 막음)
    return "";
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

    const normalizedEmail = normalizeEmail(email);
    const normalizedName = name.trim();
    const normalizedPhone = normalizePhone(phone);
    const normalizedAddress1 = address1.trim();
    const normalizedAddress2 = address2.trim();

    try {
      // ✅ (선택) 사전 중복 체크
      const dupMsg = await precheckDuplicate(normalizedEmail, normalizedPhone);
      if (dupMsg) {
        setErrorMsg(dupMsg);
        return;
      }

      // ✅ 핵심: 이제 프론트에서 profiles.insert() 하지 않음
      // DB 트리거가 자동으로 profiles를 생성한다.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: pw,
        options: {
          data: {
            name: normalizedName,
            phone: normalizedPhone,
            address1: normalizedAddress1,
            address2: normalizedAddress2,
            role: "USER",
          },
        },
      });

      if (authError) {
        setErrorMsg(mapErrorToKorean(authError));
        return;
      }

      const user = authData.user;
      if (!user) {
        setErrorMsg("회원가입은 완료되었지만 사용자 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      // 성공 처리
      if (!authData.session) {
        setSuccessMsg("가입이 완료되었습니다. 이메일 인증 메일을 확인해주세요. 인증 후 로그인할 수 있습니다.");
      } else {
        setSuccessMsg("가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
        router.push("/Common/Login");
        return;
      }
    } catch (err: any) {
      console.error("Signup Error:", err);
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
          <h2 className="mt-4 text-2xl font-bold text-gray-900">회원가입</h2>
          <p className="mt-2 text-sm text-gray-600">반려동물을 위한 최고의 선택, 펫호텔과 함께하세요.</p>
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
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
                이름
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                placeholder="홍길동"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                placeholder="영문/숫자/특수문자 포함 8자 이상"
              />
            </div>

            <div>
              <label htmlFor="password-confirm" className="block text-sm font-bold text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                id="password-confirm"
                type="password"
                required
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                placeholder="비밀번호를 한번 더 입력해주세요"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1">
                휴대폰 번호
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  // 입력 단계에서 문자 제거: 숫자/하이픈/공백만 허용
                  const cleaned = e.target.value.replace(/[^0-9\-\s]/g, "");
                  setPhone(cleaned);
                }}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                placeholder="예: 010-1234-5678"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">주소</label>
              <div className="space-y-2">
                <input
                  id="address1"
                  type="text"
                  required
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="기본 주소"
                />
                <input
                  id="address2"
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-200 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
                  placeholder="상세 주소 (동/호수)"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "가입 처리 중..." : "가입하기"}
          </button>
        </form>
      </div>
    </div>
  );
}