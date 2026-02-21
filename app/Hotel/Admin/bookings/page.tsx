"use client";
import { useState } from "react";

type Status = "대기" | "확정" | "거절";

type Booking = {
  id: string;
  petName: string;
  breed: string;
  weight: string;
  ownerName: string;
  ownerPhone: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amount: number;
  status: Status;
  notes: string;
  createdAt: string;
};

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "BK-2025-010",
    petName: "초코",
    breed: "말티즈",
    weight: "3.2kg",
    ownerName: "김지영",
    ownerPhone: "010-1234-5678",
    roomName: "스탠다드 룸",
    checkIn: "2025-02-25",
    checkOut: "2025-02-28",
    nights: 3,
    amount: 90000,
    status: "대기",
    notes: "낯선 사람에게 짖어요. 사료 로얄캐닌.",
    createdAt: "2025-02-21 09:15",
  },
  {
    id: "BK-2025-011",
    petName: "뭉치",
    breed: "골든 리트리버",
    weight: "28kg",
    ownerName: "이현우",
    ownerPhone: "010-9876-5432",
    roomName: "프리미엄 스위트",
    checkIn: "2025-03-01",
    checkOut: "2025-03-05",
    nights: 4,
    amount: 320000,
    status: "대기",
    notes: "특이사항 없음",
    createdAt: "2025-02-21 11:30",
  },
  {
    id: "BK-2025-009",
    petName: "루비",
    breed: "비숑프리제",
    weight: "4.5kg",
    ownerName: "박수민",
    ownerPhone: "010-5555-1234",
    roomName: "스탠다드 룸",
    checkIn: "2025-02-22",
    checkOut: "2025-02-24",
    nights: 2,
    amount: 60000,
    status: "확정",
    notes: "닭고기 알레르기 있어요.",
    createdAt: "2025-02-19 16:45",
  },
  {
    id: "BK-2025-008",
    petName: "두부",
    breed: "포메라니안",
    weight: "2.8kg",
    ownerName: "최민준",
    ownerPhone: "010-7777-9999",
    roomName: "스탠다드 룸",
    checkIn: "2025-02-20",
    checkOut: "2025-02-21",
    nights: 1,
    amount: 30000,
    status: "거절",
    notes: "",
    createdAt: "2025-02-18 08:00",
  },
];

const STATUS_STYLE: Record<Status, string> = {
  확정: "bg-green-100 text-green-700",
  대기: "bg-yellow-100 text-yellow-700",
  거절: "bg-red-100 text-red-600",
};

const STATUS_ICON: Record<Status, string> = {
  확정: "✅",
  대기: "⏳",
  거절: "❌",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [filter, setFilter] = useState<"전체" | Status>("전체");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: "확정" | "거절" } | null>(null);
  const [notified, setNotified] = useState<string[]>([]);

  const handleAction = (id: string, action: "확정" | "거절") => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: action } : b)));
    // 확정 시 "알림 전송" 시뮬레이션
    if (action === "확정") {
      setNotified((prev) => [...prev, id]);
      setTimeout(() => setNotified((prev) => prev.filter((n) => n !== id)), 3000);
    }
    setConfirmModal(null);
  };

  const filtered = filter === "전체" ? bookings : bookings.filter((b) => b.status === filter);

  const counts = {
    전체: bookings.length,
    대기: bookings.filter((b) => b.status === "대기").length,
    확정: bookings.filter((b) => b.status === "확정").length,
    거절: bookings.filter((b) => b.status === "거절").length,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">ADMIN</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">예약 승인 관리</h2>
        <p className="text-gray-500 text-sm mt-1">대기 중인 예약을 승인하거나 거절하세요.</p>
      </div>

      {/* 알림 토스트 */}
      {notified.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg text-sm font-bold animate-bounce">
          ✅ 보호자에게 예약 확정 알림을 전송했습니다!
        </div>
      )}

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{counts.대기}</p>
          <p className="text-xs text-yellow-700 mt-0.5 font-medium">승인 대기</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{counts.확정}</p>
          <p className="text-xs text-green-700 mt-0.5 font-medium">확정</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{counts.거절}</p>
          <p className="text-xs text-red-600 mt-0.5 font-medium">거절</p>
        </div>
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2 mb-5">
        {(["전체", "대기", "확정", "거절"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors
              ${filter === tab ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            {tab}
            {counts[tab] > 0 && <span className="ml-1 opacity-60">({counts[tab]})</span>}
          </button>
        ))}
      </div>

      {/* 예약 리스트 */}
      <div className="space-y-4">
        {filtered.map((booking) => (
          <div key={booking.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm
            ${booking.status === "대기" ? "border-yellow-200" : "border-gray-200"}`}>
            
            {/* 메인 카드 */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl shrink-0">🐾</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{booking.petName}</span>
                      <span className="text-xs text-gray-400">{booking.breed} · {booking.weight}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[booking.status]}`}>
                        {STATUS_ICON[booking.status]} {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {booking.ownerName} · {booking.roomName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {booking.checkIn} ~ {booking.checkOut} · {booking.nights}박
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900 text-sm">₩{booking.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{expandedId === booking.id ? "▲" : "▼"}</p>
                </div>
              </div>
            </div>

            {/* 상세 & 승인 버튼 */}
            {expandedId === booking.id && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">보호자</p>
                    <p className="font-medium text-gray-800">{booking.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">연락처</p>
                    <p className="font-medium text-gray-800">{booking.ownerPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">예약 번호</p>
                    <p className="font-mono text-xs text-gray-700">{booking.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">신청 시각</p>
                    <p className="text-xs text-gray-700">{booking.createdAt}</p>
                  </div>
                </div>
                {booking.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <p className="text-xs text-amber-700">💬 요청사항: {booking.notes}</p>
                  </div>
                )}

                {/* 승인/거절 버튼 — 대기 상태일 때만 */}
                {booking.status === "대기" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setConfirmModal({ id: booking.id, action: "거절" })}
                      className="flex-1 border border-red-200 text-red-500 py-3 rounded-xl font-bold hover:bg-red-50 transition-colors text-sm"
                    >
                      ❌ 거절하기
                    </button>
                    <button
                      onClick={() => setConfirmModal({ id: booking.id, action: "확정" })}
                      className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors text-sm"
                    >
                      ✅ 예약 확정하기
                    </button>
                  </div>
                )}
                {booking.status === "확정" && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center">
                    <p className="text-sm text-green-700 font-medium">✅ 확정 완료 — 보호자에게 알림이 전송되었습니다</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 확인 모달 */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-3xl text-center mb-3">
              {confirmModal.action === "확정" ? "✅" : "❌"}
            </div>
            <h3 className="font-bold text-gray-900 text-center text-lg mb-2">
              예약을 {confirmModal.action}하시겠어요?
            </h3>
            {confirmModal.action === "확정" && (
              <p className="text-sm text-gray-400 text-center mb-4">
                확정 즉시 보호자에게 알림 문자가 전송됩니다.
              </p>
            )}
            {confirmModal.action === "거절" && (
              <p className="text-sm text-gray-400 text-center mb-4">
                거절 사유를 보호자에게 별도로 안내해주세요.
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-gray-200 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => handleAction(confirmModal.id, confirmModal.action)}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors
                  ${confirmModal.action === "확정" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}
              >
                {confirmModal.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}