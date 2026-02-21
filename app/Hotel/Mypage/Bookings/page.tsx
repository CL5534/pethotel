"use client";
import { useState } from "react";

type BookingStatus = "대기" | "확정" | "취소";

type Booking = {
  id: string;
  petName: string;
  breed: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amount: number;
  status: BookingStatus;
  createdAt: string;
};

const BOOKINGS: Booking[] = [
  {
    id: "BK-2025-001",
    petName: "초코",
    breed: "말티즈",
    roomName: "스탠다드 룸",
    checkIn: "2025-02-20",
    checkOut: "2025-02-23",
    nights: 3,
    amount: 90000,
    status: "확정",
    createdAt: "2025-02-15",
  },
  {
    id: "BK-2025-002",
    petName: "뭉치",
    breed: "비숑프리제",
    roomName: "디럭스 룸",
    checkIn: "2025-03-05",
    checkOut: "2025-03-07",
    nights: 2,
    amount: 100000,
    status: "대기",
    createdAt: "2025-02-18",
  },
  {
    id: "BK-2024-015",
    petName: "초코",
    breed: "말티즈",
    roomName: "스탠다드 룸",
    checkIn: "2024-12-24",
    checkOut: "2024-12-26",
    nights: 2,
    amount: 60000,
    status: "취소",
    createdAt: "2024-12-18",
  },
  {
    id: "BK-2024-012",
    petName: "초코",
    breed: "말티즈",
    roomName: "프리미엄 스위트",
    checkIn: "2024-11-10",
    checkOut: "2024-11-14",
    nights: 4,
    amount: 320000,
    status: "확정",
    createdAt: "2024-11-05",
  },
];

const STATUS_STYLE: Record<BookingStatus, string> = {
  확정: "bg-green-100 text-green-700",
  대기: "bg-yellow-100 text-yellow-700",
  취소: "bg-gray-100 text-gray-500",
};

const STATUS_ICON: Record<BookingStatus, string> = {
  확정: "✅",
  대기: "⏳",
  취소: "❌",
};

export default function MyBookings() {
  const [filter, setFilter] = useState<"전체" | BookingStatus>("전체");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "전체" ? BOOKINGS : BOOKINGS.filter((b) => b.status === filter);

  const counts = {
    전체: BOOKINGS.length,
    확정: BOOKINGS.filter((b) => b.status === "확정").length,
    대기: BOOKINGS.filter((b) => b.status === "대기").length,
    취소: BOOKINGS.filter((b) => b.status === "취소").length,
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="mb-8">
        <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          📋 예약 내역
        </span>
        <h2 className="text-3xl font-bold text-gray-900">내 예약 확인</h2>
        <p className="text-gray-500 mt-2">예약 상태를 실시간으로 확인하세요.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{counts.확정}</p>
          <p className="text-xs text-green-700 mt-1 font-medium">확정된 예약</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{counts.대기}</p>
          <p className="text-xs text-yellow-700 mt-1 font-medium">승인 대기 중</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{counts.취소}</p>
          <p className="text-xs text-gray-500 mt-1 font-medium">취소된 예약</p>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-6">
        {(["전체", "확정", "대기", "취소"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors
              ${filter === tab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {tab} {counts[tab] > 0 && <span className="ml-1 opacity-70">({counts[tab]})</span>}
          </button>
        ))}
      </div>

      {/* 예약 리스트 */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">🐾</div>
            <p className="font-medium">해당하는 예약 내역이 없습니다.</p>
          </div>
        )}

        {filtered.map((booking) => (
          <div
            key={booking.id}
            className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all
              ${booking.status === "취소" ? "opacity-60" : ""}`}
          >
            {/* 카드 메인 */}
            <div
              className="p-5 cursor-pointer"
              onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-2xl shrink-0">
                    🐾
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{booking.petName}</span>
                      <span className="text-xs text-gray-400">{booking.breed}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[booking.status]}`}>
                        {STATUS_ICON[booking.status]} {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{booking.roomName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {booking.checkIn} ~ {booking.checkOut} · {booking.nights}박
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">₩{booking.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{expandedId === booking.id ? "▲" : "▼"} 상세보기</p>
                </div>
              </div>
            </div>

            {/* 상세 확장 */}
            {expandedId === booking.id && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">예약 번호</span>
                  <span className="font-mono text-gray-700 font-medium">{booking.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">예약 신청일</span>
                  <span className="text-gray-700">{booking.createdAt}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">체크인</span>
                  <span className="text-gray-700">{booking.checkIn}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">체크아웃</span>
                  <span className="text-gray-700">{booking.checkOut}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-700">결제 금액</span>
                  <span className="text-blue-600">₩{booking.amount.toLocaleString()}</span>
                </div>
                {booking.status === "대기" && (
                  <button className="w-full mt-2 border border-red-200 text-red-500 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors">
                    예약 취소하기
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 새 예약 유도 */}
      <div className="mt-10 text-center">
        <a href="/Hotel/Booking" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100">
          + 새 예약 신청하기
        </a>
      </div>
    </div>
  );
}