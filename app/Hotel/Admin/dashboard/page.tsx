"use client";
import { useState, useEffect } from "react";

type RoomStatus = "입실중" | "퇴실예정" | "공실" | "청소중";
type BookingStatus = "확정" | "대기" | "취소";

const ROOMS = [
  { id: 1, name: "스탠다드 A", type: "스탠다드", status: "입실중" as RoomStatus, petName: "초코", breed: "말티즈", owner: "김지영", checkIn: "02/20", checkOut: "02/23", notes: "낯선 사람에게 짖음", emoji: "🐩" },
  { id: 2, name: "스탠다드 B", type: "스탠다드", status: "퇴실예정" as RoomStatus, petName: "두부", breed: "닥스훈트", owner: "정혜연", checkIn: "02/19", checkOut: "02/21", notes: "", emoji: "🐾" },
  { id: 3, name: "디럭스 A",   type: "디럭스",   status: "공실" as RoomStatus,   petName: "", breed: "", owner: "", checkIn: "", checkOut: "", notes: "", emoji: "" },
  { id: 4, name: "디럭스 B",   type: "디럭스",   status: "청소중" as RoomStatus, petName: "", breed: "", owner: "", checkIn: "", checkOut: "", notes: "", emoji: "" },
  { id: 5, name: "스위트",     type: "프리미엄", status: "입실중" as RoomStatus, petName: "뭉치", breed: "골든 리트리버", owner: "이현우", checkIn: "02/18", checkOut: "02/25", notes: "", emoji: "🦮" },
];

const TODAY_CHECKIN = [
  { id: 1, petName: "루비", breed: "비숑프리제", weight: "4.5kg", owner: "박수민", phone: "010-5555-1234", room: "스탠다드 A", time: "10:00", notes: "닭고기 알레르기", emoji: "🐩" },
  { id: 2, petName: "코코", breed: "시츄",       weight: "6.1kg", owner: "한소희", phone: "010-9999-0000", room: "디럭스 B",   time: "14:00", notes: "",             emoji: "🐕" },
  { id: 3, petName: "보리", breed: "포메라니안", weight: "2.8kg", owner: "최민준", phone: "010-7777-3333", room: "스탠다드 B", time: "16:30", notes: "분리불안 있음",  emoji: "🐾" },
];

const MONTH_BOOKINGS: { date: number; bookings: { petName: string; room: string; type: "checkin" | "checkout" | "stay"; status: BookingStatus }[] }[] = [
  { date: 18, bookings: [{ petName: "뭉치", room: "스위트", type: "checkin", status: "확정" }] },
  { date: 19, bookings: [{ petName: "두부", room: "스탠다드B", type: "checkin", status: "확정" }] },
  { date: 20, bookings: [{ petName: "초코", room: "스탠다드A", type: "checkin", status: "확정" }] },
  { date: 21, bookings: [{ petName: "루비", room: "스탠다드A", type: "checkin", status: "확정" }, { petName: "두부", room: "스탠다드B", type: "checkout", status: "확정" }] },
  { date: 22, bookings: [{ petName: "해피", room: "디럭스A", type: "checkin", status: "대기" }] },
  { date: 23, bookings: [{ petName: "초코", room: "스탠다드A", type: "checkout", status: "확정" }, { petName: "몽이", room: "스탠다드B", type: "checkin", status: "대기" }] },
  { date: 24, bookings: [] },
  { date: 25, bookings: [{ petName: "뭉치", room: "스위트", type: "checkout", status: "확정" }, { petName: "밤비", room: "디럭스B", type: "checkin", status: "확정" }] },
  { date: 26, bookings: [{ petName: "토리", room: "스탠다드A", type: "checkin", status: "대기" }] },
  { date: 27, bookings: [] },
  { date: 28, bookings: [{ petName: "밤비", room: "디럭스B", type: "checkout", status: "확정" }] },
];

const ROOM_STATUS_STYLE: Record<RoomStatus, { bg: string; text: string; dot: string; label: string }> = {
  입실중:   { bg: "bg-blue-50 border-blue-300",  text: "text-blue-700",  dot: "bg-blue-500",  label: "입실중"   },
  퇴실예정: { bg: "bg-amber-50 border-amber-300", text: "text-amber-700", dot: "bg-amber-400", label: "퇴실예정" },
  공실:     { bg: "bg-green-50 border-green-300", text: "text-green-700", dot: "bg-green-400", label: "공실"     },
  청소중:   { bg: "bg-gray-50 border-gray-300",   text: "text-gray-500",  dot: "bg-gray-400",  label: "청소중"   },
};

export default function AdminDashboard() {
  // ✅ Hydration 에러 수정: 날짜를 useEffect로 클라이언트에서만 렌더링
  const [todayStr, setTodayStr] = useState("");
  useEffect(() => {
    setTodayStr(
      new Date().toLocaleDateString("ko-KR", {
        year: "numeric", month: "long", day: "numeric", weekday: "long",
      })
    );
  }, []);

  const [checkinDone, setCheckinDone] = useState<number[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(21);

  const toggleCheckin = (id: number) =>
    setCheckinDone((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const selectedRoomData = ROOMS.find((r) => r.id === selectedRoom);
  const selectedDateBookings = MONTH_BOOKINGS.find((d) => d.date === selectedDate);

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ── 상단 헤더 ── */}
      <div className="bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="bg-red-100 text-red-600 text-sm font-bold px-3 py-1.5 rounded-full">관리자</span>
          <div>
            <h1 className="text-xl font-bold text-gray-900">🐾 애견 호텔 관리 대시보드</h1>
            {/* ✅ 클라이언트 전용 렌더링 → Hydration 에러 해결 */}
            {todayStr && <p className="text-sm text-gray-500 mt-0.5">{todayStr}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-500 font-medium">실시간 연결됨</span>
        </div>
      </div>

      {/* ── 상단 통계 바 ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-3 overflow-x-auto">
        {[
          { label: "전체 룸",    value: ROOMS.length,                                       color: "text-gray-800",   bg: "bg-gray-100"   },
          { label: "입실 중",    value: ROOMS.filter(r => r.status === "입실중").length,     color: "text-blue-700",   bg: "bg-blue-100"   },
          { label: "공실",       value: ROOMS.filter(r => r.status === "공실").length,       color: "text-green-700",  bg: "bg-green-100"  },
          { label: "퇴실 예정",  value: ROOMS.filter(r => r.status === "퇴실예정").length,   color: "text-amber-700",  bg: "bg-amber-100"  },
          { label: "오늘 입실",  value: TODAY_CHECKIN.length,                               color: "text-indigo-700", bg: "bg-indigo-100" },
          { label: "체크인 완료",value: checkinDone.length,                                 color: "text-teal-700",   bg: "bg-teal-100"   },
        ].map((s) => (
          <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-xl shrink-0 ${s.bg}`}>
            <span className="text-sm font-medium text-gray-500">{s.label}</span>
            <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* ── 3패널 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[calc(100vh-130px)]">

        {/* ══ 왼쪽: 룸 현황 ══ */}
        <div className="bg-white border-r-2 border-gray-200 p-5 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
            🏠 룸 현황
            <span className="ml-auto text-sm font-normal text-gray-400">{ROOMS.length}개 룸</span>
          </h2>

          <div className="space-y-4">
            {ROOMS.map((room) => {
              const s = ROOM_STATUS_STYLE[room.status];
              const isSelected = selectedRoom === room.id;
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(isSelected ? null : room.id)}
                  className={`border-2 rounded-2xl p-4 cursor-pointer transition-all
                    ${s.bg} ${isSelected ? "ring-2 ring-blue-400 ring-offset-2 shadow-md" : "hover:shadow-md"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-gray-900 text-base">{room.name}</span>
                      <span className="ml-2 text-sm text-gray-400 bg-white px-2 py-0.5 rounded-full border">{room.type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-3 h-3 rounded-full ${s.dot}`}></span>
                      <span className={`text-sm font-bold ${s.text}`}>{s.label}</span>
                    </div>
                  </div>

                  {(room.status === "입실중" || room.status === "퇴실예정") ? (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{room.emoji}</span>
                        <div>
                          <p className="text-base font-bold text-gray-900">{room.petName}</p>
                          <p className="text-sm text-gray-500">{room.breed}</p>
                          <p className="text-sm text-gray-500">보호자: <span className="font-semibold">{room.owner}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border">
                        <span className="text-sm text-gray-500">입실 <span className="font-bold text-gray-800">{room.checkIn}</span></span>
                        <span className="text-sm text-amber-600 font-bold">퇴실 {room.checkOut}</span>
                      </div>
                      {room.notes && (
                        <p className="mt-2 text-sm text-amber-700 bg-amber-100 px-3 py-2 rounded-xl font-medium">⚠️ {room.notes}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-base text-gray-500 font-medium">
                      {room.status === "공실" ? "✅ 예약 가능한 방입니다" : "🧹 청소가 진행 중입니다"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {selectedRoomData && (
            <div className="mt-5 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-3">
                <p className="text-base font-bold text-blue-800">📋 {selectedRoomData.name} 상세</p>
                <button onClick={() => setSelectedRoom(null)} className="text-blue-400 hover:text-blue-700 text-lg font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-blue-100">✕</button>
              </div>
              {selectedRoomData.petName ? (
                <div className="space-y-1.5 text-sm text-blue-700">
                  <p><span className="font-bold">반려동물:</span> {selectedRoomData.petName} ({selectedRoomData.breed})</p>
                  <p><span className="font-bold">보호자:</span> {selectedRoomData.owner}</p>
                  <p><span className="font-bold">입실:</span> {selectedRoomData.checkIn} → <span className="font-bold text-amber-600">{selectedRoomData.checkOut} 퇴실</span></p>
                  {selectedRoomData.notes && (
                    <p className="text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">⚠️ {selectedRoomData.notes}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-blue-600">현재 투숙 중인 반려동물이 없습니다.</p>
              )}
            </div>
          )}
        </div>

        {/* ══ 중앙: 오늘 입실 현황 ══ */}
        <div className="bg-gray-50 p-5 border-r-2 border-gray-200 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">🐾 오늘 입실 현황</h2>
          <p className="text-sm text-gray-500 mb-5">체크인이 완료되면 카드를 눌러 체크하세요.</p>

          {/* 진행률 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">체크인 진행률</span>
              <span className="text-base font-bold text-blue-600">{checkinDone.length} / {TODAY_CHECKIN.length} 완료</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${(checkinDone.length / TODAY_CHECKIN.length) * 100}%` }}
              />
            </div>
          </div>

          {/* 입실 카드 */}
          <div className="space-y-4 mb-8">
            {TODAY_CHECKIN.map((item) => {
              const isDone = checkinDone.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleCheckin(item.id)}
                  className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all
                    ${isDone ? "border-green-300 bg-green-50 opacity-70" : "border-gray-200 hover:border-blue-400 hover:shadow-md"}`}
                >
                  <div className="flex items-start gap-4">
                    {/* 체크 버튼 */}
                    <div className={`mt-1 w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                      ${isDone ? "bg-green-500 border-green-500 text-white" : "border-gray-300 bg-white"}`}>
                      {isDone && <span className="text-base font-bold">✓</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{item.emoji}</span>
                          <div>
                            <p className={`text-lg font-bold text-gray-900 ${isDone ? "line-through text-gray-400" : ""}`}>{item.petName}</p>
                            <p className="text-sm text-gray-500">{item.breed} · {item.weight}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold text-blue-600">{item.time}</p>
                          <span className="text-sm bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{item.room}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-gray-700">{item.owner} 보호자님</p>
                          <p className="text-sm text-gray-500">{item.phone}</p>
                        </div>
                        {item.notes && (
                          <span className="text-sm text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl font-medium shrink-0">
                            ⚠️ {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 오늘 퇴실 */}
          <div>
            <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-400 rounded-full"></span> 오늘 퇴실 예정
            </h3>
            <div className="space-y-3">
              {ROOMS.filter(r => r.status === "퇴실예정").map((room) => (
                <div key={room.id} className="bg-white border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{room.emoji}</span>
                    <div>
                      <p className="text-base font-bold text-gray-900">{room.petName}</p>
                      <p className="text-sm text-gray-500">{room.owner} 보호자님 · {room.name}</p>
                    </div>
                  </div>
                  <span className="text-base font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                    {room.checkOut} 퇴실
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ 오른쪽: 월간 캘린더 ══ */}
        <div className="bg-white p-5 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">📅 2월 예약 현황</h2>

          {/* 캘린더 */}
          <div className="mb-5 bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <div className="grid grid-cols-7 mb-2">
              {["일","월","화","수","목","금","토"].map((d) => (
                <div key={d} className="text-center text-sm text-gray-500 py-1 font-bold">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 6 }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: 28 }).map((_, i) => {
                const day = i + 1;
                const entry = MONTH_BOOKINGS.find(b => b.date === day && b.bookings.length > 0);
                const isToday = day === 21;
                const isSelected = selectedDate === day;
                const hasCheckin  = entry?.bookings.some(b => b.type === "checkin");
                const hasCheckout = entry?.bookings.some(b => b.type === "checkout");
                const hasPending  = entry?.bookings.some(b => b.status === "대기");

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`relative aspect-square rounded-xl text-sm font-bold flex flex-col items-center justify-center transition-all
                      ${isSelected ? "bg-blue-600 text-white shadow-md scale-105"
                        : isToday  ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400"
                        : entry    ? "bg-white hover:bg-blue-50 text-gray-800 border border-gray-200"
                        :            "text-gray-400 hover:bg-gray-100"}`}
                  >
                    {day}
                    {entry && !isSelected && (
                      <div className="flex gap-0.5 mt-0.5">
                        {hasCheckin  && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
                        {hasCheckout && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>}
                        {hasPending  && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 범례 */}
          <div className="flex gap-4 mb-5 flex-wrap">
            {[["bg-blue-500","입실"],["bg-amber-400","퇴실"],["bg-yellow-400","승인대기"]].map(([color,label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 ${color} rounded-full`}></span>
                <span className="text-sm text-gray-600 font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* 선택 날짜 상세 */}
          {selectedDate && (
            <div className="mb-6">
              <h3 className="text-base font-bold text-gray-700 mb-3">📋 2월 {selectedDate}일 예약 내용</h3>
              {selectedDateBookings && selectedDateBookings.bookings.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateBookings.bookings.map((b, i) => (
                    <div key={i} className={`rounded-2xl p-4 border-2
                      ${b.type === "checkin" ? "bg-blue-50 border-blue-200"
                        : b.type === "checkout" ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-200"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-bold text-gray-900">{b.petName}</span>
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full
                          ${b.status === "확정" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{b.room}</span>
                        <span className={`text-sm font-bold ${b.type === "checkin" ? "text-blue-600" : "text-amber-600"}`}>
                          {b.type === "checkin" ? "▶ 입실" : "◀ 퇴실"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-base text-gray-500 font-medium">이 날짜에 예약이 없습니다</p>
                </div>
              )}
            </div>
          )}

          {/* 이달 요약 */}
          <div className="pt-4 border-t-2 border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 mb-3">이달 전체 요약</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-200">
                <p className="text-3xl font-bold text-blue-600">
                  {MONTH_BOOKINGS.reduce((a, d) => a + d.bookings.filter(b => b.type === "checkin").length, 0)}
                </p>
                <p className="text-sm text-blue-600 font-medium mt-1">총 입실 건수</p>
              </div>
              <div className="bg-yellow-50 rounded-2xl p-4 text-center border border-yellow-200">
                <p className="text-3xl font-bold text-yellow-600">
                  {MONTH_BOOKINGS.reduce((a, d) => a + d.bookings.filter(b => b.status === "대기").length, 0)}
                </p>
                <p className="text-sm text-yellow-600 font-medium mt-1">승인 대기</p>
              </div>
            </div>
            <a
              href="/Hotel/Admin/Bookings"
              className="w-full block text-center bg-gray-900 text-white py-4 rounded-2xl text-base font-bold hover:bg-gray-800 transition-colors"
            >
              📋 예약 승인 관리하러 가기
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}