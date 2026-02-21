// app/Common/Header/page.tsx
import Link from 'next/link';

// 기획하신 8개 페이지 경로와 이름을 매칭했습니다.
const NAV_ROUTES = [
  { name: "객실 안내", path: "/hotel/rooms" },      // 2번 페이지
  { name: "실시간 예약", path: "/hotel/booking" },    // 3번 페이지
  { name: "마이펫 관리", path: "/hotel/mypage/pets" }, // 4번 페이지
  { name: "예약 확인", path: "/hotel/mypage/bookings" }, // 5번 페이지
  { name: "이용 후기", path: "/hotel/review" },     // 6번 페이지
];

// 관리자용 메뉴는 따로 분리해서 관리하면 좋습니다.
const ADMIN_ROUTES = [
  { name: "관리자 홈", path: "/hotel/admin" },        // 7번 페이지
  { name: "예약 승인", path: "/hotel/admin/bookings" }, // 8번 페이지
];

export default function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex justify-between items-center">
        
        {/* 로고: 1번 메인 홈으로 연결 */}
        <Link href="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl shrink-0">
          <span>🐾</span>
          <span>PET HOTEL</span>
        </Link>

        {/* 네비게이션: 기획하신 사용자용 5개 메뉴 */}
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
          
          {/* 구분선 (사용자와 관리자 메뉴 구분용) */}
          <div className="w-[1px] h-4 bg-gray-200 mx-2" />

          {/* 관리자 메뉴 (기획 7, 8번) */}
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

        {/* 로그인 버튼 (UX 포인트: 예약하기 유도) */}
        <div className="shrink-0 flex items-center gap-3">
          <button className="text-sm font-medium text-gray-500 hover:text-gray-800">
            로그인
          </button>
          <Link 
            href="/hotel/booking"
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
          >
            지금 예약 📅
          </Link>
        </div>

      </div>
    </header>
  );
}