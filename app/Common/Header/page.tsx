// app/Common/Header/page.tsx
import Link from 'next/link';

// ✅ 폴더명이 대문자이므로 path도 대문자로 시작하도록 수정했습니다.
const NAV_ROUTES = [
  { name: "객실 안내", path: "/Hotel/Rooms" },      // 2번 페이지
  { name: "실시간 예약", path: "/Hotel/Booking" },    // 3번 페이지
  { name: "마이펫 관리", path: "/Hotel/Mypage/Pets" }, // 4번 페이지
  { name: "예약 확인", path: "/Hotel/Mypage/Bookings" }, // 5번 페이지
  { name: "이용 후기", path: "/Hotel/Reviews" },     // 6번 페이지
];

// ✅ 관리자 경로도 대문자로 수정했습니다.
const ADMIN_ROUTES = [
  { name: "관리자 홈", path: "/Hotel/Admin/Dashboard" },        
  { name: "예약 승인", path: "/Hotel/Admin/Bookings" }, 
];

export default function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex justify-between items-center">
        
        {/* 로고: 메인 홈(/) */}
        <Link href="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl shrink-0">
          <span>🐾</span>
          <span>PET HOTEL</span>
        </Link>

        {/* 네비게이션 */}
        <nav className="hidden lg:flex items-center gap-8 text-[14px] font-medium text-gray-600">
          {NAV_ROUTES.map((route) => (
            <Link 
              key={route.path} 
              href={route.path} 
              className="hover:text-blue-600 transition-colors"
            >
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

        {/* 로그인 및 예약 버튼 */}
        <div className="shrink-0 flex items-center gap-3">
          <Link href="/Common/Login" className="text-sm font-medium text-gray-500 hover:text-gray-800">
            로그인
          </Link>
          <Link 
            href="/Hotel/Booking"
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            지금 예약 📅
          </Link>
        </div>
      </div>
    </header>
  );
}