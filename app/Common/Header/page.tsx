"use client";
// app/Common/Header/page.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "../Session/useSession";

const NAV_ROUTES = [
  { name: "객실 안내", path: "/Hotel/Rooms" },
  { name: "실시간 예약", path: "/Hotel/Booking" },
  { name: "예약 확인", path: "/Hotel/Mypage/Bookings" },
  { name: "마이펫 관리", path: "/Hotel/Mypage/Pets" },
  { name: "이용 후기", path: "/Hotel/Reviews" },
];

const ADMIN_ROUTES = [
  { name: "관리자 홈", path: "/Hotel/Admin/Dashboard" },
  { name: "예약 승인", path: "/Hotel/Admin/Bookings" },
];

export default function Header() {
  const router = useRouter();
  const { user, loading, signOut } = useSession();

  const displayName = (() => {
    const metaName = (user?.user_metadata as any)?.name;
    if (typeof metaName === "string" && metaName.trim() !== "") return metaName.trim();
    const email = user?.email ?? "";
    if (email.includes("@")) return email.split("@")[0];
    return "회원";
  })();

  async function handleLogout() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="w-full max-w-[1400px] mx-auto px-8 h-16 flex justify-between items-center">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl shrink-0">
          <span>🐾</span>
          <span>PET HOTEL</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-gray-600">
          {NAV_ROUTES.map((route) => (
            <Link key={route.path} href={route.path} className="hover:text-blue-600 transition-colors">
              {route.name}
            </Link>
          ))}
          <div className="w-[1px] h-4 bg-gray-200 mx-2" />
          {ADMIN_ROUTES.map((route) => (
            <Link
              key={route.path}
              href={route.path}
              className="text-gray-400 hover:text-red-500 transition-colors text-[13px]"
            >
              {route.name}
            </Link>
          ))}
        </nav>

        {/* 우측 영역 */}
        <div className="shrink-0 flex items-center gap-3">
          {!loading && !user && (
            <>
              <Link href="/Common/Login" className="text-sm font-medium text-gray-500 hover:text-gray-800">
                로그인
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/Common/Signup" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                회원가입
              </Link>
            </>
          )}
          {!loading && user && (
            <>
              <span className="text-sm font-bold text-gray-700" title={user.email ?? ""}>
                {displayName}님
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
              >
                로그아웃
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}