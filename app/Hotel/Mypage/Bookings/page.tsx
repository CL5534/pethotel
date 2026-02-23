"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import { ko } from "date-fns/locale";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type BookingStatus = "대기" | "확정" | "취소";

function mapStatus(dbStatus: string): BookingStatus {
  if (dbStatus === "confirmed" || dbStatus === "확정") return "확정";
  if (dbStatus === "cancelled" || dbStatus === "cancelled" || dbStatus === "취소") return "취소";
  return "대기";
}

function calcNights(start: string, end: string) {
  if (!start || !end) return 0;
  const s = new Date(`${start}T12:00:00`).getTime();
  const e = new Date(`${end}T12:00:00`).getTime();
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

type BookingCard = {
  id: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amount: number;
  status: BookingStatus;
  createdAt: string;
  petsLabel: string;
  firstPetName: string;
  breedLabel: string;
};

// ====== 토스트 컴포넌트 (fix 8: alert → 토스트) ======
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3.5 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2
        ${type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
      style={{ animation: "slideDown 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      {type === "success" ? "✅" : "❌"} {message}
    </div>
  );
}

// ====== 모달 ======
function BookingDetailModal({
  booking,
  allBookings,
  onClose,
  onCancel,
  onNavigate,
}: {
  booking: BookingCard;
  allBookings: BookingCard[];
  onClose: () => void;
  onCancel: (id: string) => void;
  onNavigate: (booking: BookingCard) => void;
}) {
  const statusConfig: Record<BookingStatus, { light: string; icon: string; label: string }> = {
    확정: { light: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "✅", label: "확정" },
    대기: { light: "bg-amber-50 text-amber-700 border-amber-200", icon: "⏳", label: "대기중" },
    취소: { light: "bg-gray-50 text-gray-500 border-gray-200", icon: "❌", label: "취소됨" },
  };
  const sc = statusConfig[booking.status];

  // fix 3: 이전/다음 예약 네비게이션
  const activeBookings = allBookings.filter((b) => b.status !== "취소");
  const currentIdx = activeBookings.findIndex((b) => b.id === booking.id);
  const prevBooking = currentIdx > 0 ? activeBookings[currentIdx - 1] : null;
  const nextBooking = currentIdx < activeBookings.length - 1 ? activeBookings[currentIdx + 1] : null;

  // fix 5: 지난 예약 여부
  const isPast = isBefore(parseISO(booking.checkOut), startOfDay(new Date()));

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        style={{ animation: "fadeIn 0.2s ease" }}
        onClick={onClose}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ animation: "fadeIn 0.2s ease" }}
      >
        <div
          className="w-full max-w-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden"
          style={{ animation: "scaleIn 0.25s cubic-bezier(0.32, 0.72, 0, 1)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="px-10 pt-8 pb-6 border-b border-gray-100 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl">
                🐾
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-black text-gray-900 text-2xl">{booking.firstPetName}</span>
                  {booking.breedLabel && <span className="text-sm text-gray-400">{booking.breedLabel}</span>}
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${sc.light}`}>
                    {sc.icon} {sc.label}
                  </span>
                  {/* fix 5: 지난 예약 뱃지 */}
                  {isPast && (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                      지난 예약
                    </span>
                  )}
                </div>
                <p className="text-base text-gray-500 mt-1">{booking.roomName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* fix 3: 이전/다음 버튼 */}
              <button
                onClick={() => prevBooking && onNavigate(prevBooking)}
                disabled={!prevBooking}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                title="이전 예약"
              >
                ‹
              </button>
              <span className="text-xs text-gray-400 font-medium">
                {currentIdx + 1} / {activeBookings.length}
              </span>
              <button
                onClick={() => nextBooking && onNavigate(nextBooking)}
                disabled={!nextBooking}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                title="다음 예약"
              >
                ›
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 font-bold text-base ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 날짜 배너 */}
          <div className={`mx-10 mt-8 rounded-2xl p-8 flex items-center justify-between ${isPast ? "bg-gray-50" : "bg-blue-50"}`}>
            <div className="text-center">
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isPast ? "text-gray-400" : "text-blue-400"}`}>CHECK-IN</p>
              <p className={`text-3xl font-black ${isPast ? "text-gray-500" : "text-blue-700"}`}>{booking.checkIn}</p>
              <p className={`text-sm mt-1 ${isPast ? "text-gray-400" : "text-blue-400"}`}>입실</p>
            </div>
            <div className="flex flex-col items-center gap-3 px-8">
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(booking.nights, 7) }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${isPast ? "bg-gray-300" : "bg-blue-300"}`} />
                ))}
              </div>
              <span className={`text-lg font-black ${isPast ? "text-gray-400" : "text-blue-500"}`}>{booking.nights}박</span>
            </div>
            <div className="text-center">
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isPast ? "text-gray-400" : "text-blue-400"}`}>CHECK-OUT</p>
              <p className={`text-3xl font-black ${isPast ? "text-gray-500" : "text-blue-700"}`}>{booking.checkOut}</p>
              <p className={`text-sm mt-1 ${isPast ? "text-gray-400" : "text-blue-400"}`}>퇴실</p>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="mx-10 mt-8 grid grid-cols-2 gap-x-16 gap-y-5">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-400 font-medium">함께하는 아이들</span>
              <span className="text-gray-800 font-semibold">{booking.petsLabel}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-400 font-medium">객실</span>
              <span className="text-gray-800 font-semibold">{booking.roomName}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-400 font-medium">예약 신청일</span>
              <span className="text-gray-800">{booking.createdAt}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-400 font-medium">예약 ID</span>
              <span className="font-mono text-gray-400 text-sm">{booking.id}</span>
            </div>
            <div className="col-span-2 flex justify-between items-center py-4 mt-2 border-t-2 border-gray-100">
              <span className="text-gray-800 font-bold text-lg">결제 금액</span>
              <span className="text-3xl font-black text-blue-600">
                ₩{booking.amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="px-10 mt-4 mb-10 flex gap-4 justify-end">
            {/* fix 4: 확정 예약도 취소 가능, 지난 예약은 취소 불가 */}
            {(booking.status === "대기" || booking.status === "확정") && !isPast && (
              <button
                onClick={() => onCancel(booking.id)}
                className="px-8 py-3.5 rounded-2xl border-2 border-red-200 text-red-500 font-bold hover:bg-red-50 transition-colors"
              >
                예약 취소
              </button>
            )}
            <button
              onClick={onClose}
              className="px-12 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              확인
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
        @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-16px) } to { opacity: 1; transform: translateX(-50%) translateY(0) } }
      `}</style>
    </>
  );
}

// ====== 메인 페이지 ======
export default function CalendarAndMyBookingsOnePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [modalBooking, setModalBooking] = useState<BookingCard | null>(null);
  // fix 8: 토스트
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  async function fetchMyBookings() {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setBookings([]); setLoading(false); return; }

    const { data: bookingRows, error: bErr } = await supabase
      .from("bookings")
      .select("id, check_in, check_out, total_price, status, created_at, room_id, rooms(name)")
      .eq("user_id", auth.user.id)
      .order("check_in", { ascending: true }); // 날짜순 정렬

    if (bErr) {
      showToast("예약 내역 조회 실패", "error");
      setBookings([]);
      setLoading(false);
      return;
    }

    const base = (bookingRows ?? []).map((b: any) => ({
      id: String(b.id),
      checkIn: String(b.check_in ?? ""),
      checkOut: String(b.check_out ?? ""),
      nights: calcNights(String(b.check_in ?? ""), String(b.check_out ?? "")),
      amount: Number(b.total_price ?? 0),
      status: mapStatus(String(b.status ?? "pending")),
      createdAt: String(b.created_at ?? ""),
      roomName: (b.rooms?.name as string) ?? "객실",
    }));

    const bookingIds = base.map((x) => x.id);
    if (bookingIds.length === 0) { setBookings([]); setLoading(false); return; }

    const { data: linkRows, error: lErr } = await supabase
      .from("booking_pets")
      .select("booking_id, pet_id, pets!booking_pets_pet_id_fkey(name, breed)")
      .in("booking_id", bookingIds);

    const petMap = new Map<string, { name: string; breed: string | null }[]>();
    if (!lErr) {
      (linkRows ?? []).forEach((row: any) => {
        const bid = String(row.booking_id);
        const pet = row.pets;
        if (!petMap.has(bid)) petMap.set(bid, []);
        petMap.get(bid)!.push({ name: String(pet?.name ?? "펫"), breed: (pet?.breed ?? null) as string | null });
      });
    }

    const result: BookingCard[] = base.map((b) => {
      const pets = petMap.get(b.id) ?? [];
      const names = pets.map((p) => p.name);
      const breeds = pets.map((p) => p.breed).filter(Boolean) as string[];
      return {
        id: b.id,
        roomName: b.roomName,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: b.nights,
        amount: b.amount,
        status: b.status,
        createdAt: (b.createdAt.split("T")[0] ?? b.createdAt) as string,
        petsLabel: names.length === 0 ? "펫 정보 없음" : names.length === 1 ? names[0] : `${names[0]}, ${names[1]}${names.length > 2 ? ` 외 ${names.length - 2}` : ""}`,
        firstPetName: names[0] ?? "🐾",
        breedLabel: breeds.length === 0 ? "" : breeds.length === 1 ? breeds[0] : `${breeds[0]} 외 ${breeds.length - 1}`,
      };
    });

    setBookings(result);
    setLoading(false);
  }

  useEffect(() => { fetchMyBookings(); }, []);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days: Date[] = [];
    let day = startDate;
    while (day <= endDate) { days.push(day); day = addDays(day, 1); }
    return days;
  }, [currentMonth]);

  // fix 1: 체크인 날짜만 배지 표시 (중복 제거)
  // fix 2: 같은 날 여러 예약 모두 반환
  const getBookingsForDay = (day: Date): BookingCard[] => {
    const dayStr = format(day, "yyyy-MM-dd");
    return bookings.filter((b) => {
      if (b.status === "취소") return false;
      return b.checkIn === dayStr; // 체크인 날에만 표시
    });
  };

  // 달력에 해당 월에 예약이 있는지 확인 (fix 6: 빈 달 안내용)
  const hasBookingInMonth = useMemo(() => {
    return bookings.some((b) => {
      if (b.status === "취소") return false;
      const checkInMonth = b.checkIn.slice(0, 7);
      const checkOutMonth = b.checkOut.slice(0, 7);
      const currentMonthStr = format(currentMonth, "yyyy-MM");
      return checkInMonth <= currentMonthStr && checkOutMonth >= currentMonthStr;
    });
  }, [bookings, currentMonth]);

  // fix 7: 로컬 state 업데이트 (전체 재조회 X)
  async function cancelBooking(bookingId: string) {
    const ok = confirm("예약을 취소하시겠습니까?");
    if (!ok) return;

    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    if (error) {
      showToast("취소에 실패했어요. 다시 시도해주세요.", "error");
      return;
    }

    // fix 7: state만 업데이트
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "취소" as BookingStatus } : b))
    );
    // 모달에 반영
    setModalBooking((prev) => (prev?.id === bookingId ? { ...prev, status: "취소" as BookingStatus } : prev));
    showToast("예약이 취소되었어요.", "success");
  }

  // fix 5: 이번 달 기준 다가오는 예약으로 자동 이동
  function goToNextBookingMonth() {
    const upcoming = bookings
      .filter((b) => b.status !== "취소" && isAfter(parseISO(b.checkIn), new Date()))
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    if (upcoming.length > 0) {
      setCurrentMonth(parseISO(upcoming[0].checkIn));
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10 min-h-screen bg-white">

      {/* 토스트 (fix 8) */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* 모달 */}
      {modalBooking && (
        <BookingDetailModal
          booking={modalBooking}
          allBookings={bookings}
          onClose={() => setModalBooking(null)}
          onCancel={cancelBooking}
          onNavigate={(b) => setModalBooking(b)}
        />
      )}

      {/* 달력 헤더 */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">
            {format(currentMonth, "yyyy년 M월", { locale: ko })}
          </h2>
          <p className="text-gray-400 mt-1.5 text-sm font-medium">
            🐾 예약된 날짜를 누르면 상세 정보를 볼 수 있어요
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* fix 5: 다가오는 예약으로 이동 버튼 */}
          <button
            onClick={goToNextBookingMonth}
            className="px-4 py-2.5 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm hover:bg-blue-100 transition-colors"
          >
            📅 다가오는 예약
          </button>
          <div className="flex gap-1.5 bg-gray-100 p-1.5 rounded-2xl">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="px-4 py-2.5 hover:bg-white rounded-xl transition-all font-bold text-sm text-gray-600">‹ 이전</button>
            <button onClick={() => setCurrentMonth(new Date())} className="px-4 py-2.5 hover:bg-white rounded-xl transition-all font-bold text-sm text-blue-600">오늘</button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="px-4 py-2.5 hover:bg-white rounded-xl transition-all font-bold text-sm text-gray-600">다음 ›</button>
          </div>
        </div>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 mb-1">
        {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
          <div key={d} className={`py-3 text-center text-xs font-black tracking-widest ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-300"}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      {loading ? (
        <div className="flex items-center justify-center h-96 text-gray-300">
          <div className="text-center">
            <div className="text-5xl mb-4 animate-pulse">🐾</div>
            <p className="font-medium">불러오는 중...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-3xl overflow-hidden shadow-xl">
            {calendarDays.map((day, idx) => {
              // fix 1 & 2: 체크인 날만, 여러 예약 모두 표시
              const dayBookings = getBookingsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              // fix 5: 지난 날짜 흐리게
              const isPastDay = isBefore(day, startOfDay(new Date())) && !isToday;

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2.5 bg-white flex flex-col gap-1 transition-colors
                    ${!isCurrentMonth ? "opacity-25 bg-gray-50" : isPastDay ? "opacity-60" : ""}
                    ${dayBookings.length > 0 ? "cursor-pointer hover:bg-blue-50/30" : "hover:bg-gray-50/50"}`}
                >
                  <span className={`text-sm font-bold self-start ${
                    isToday
                      ? "w-7 h-7 bg-blue-600 text-white flex items-center justify-center rounded-full text-xs"
                      : idx % 7 === 0 ? "text-red-400"
                      : idx % 7 === 6 ? "text-blue-400"
                      : "text-gray-500"
                  }`}>
                    {format(day, "d")}
                  </span>

                  {/* fix 2: 여러 예약 모두 렌더링 */}
                  <div className="flex flex-col gap-1 mt-auto">
                    {dayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        onClick={() => setModalBooking(booking)}
                        className={`rounded-xl px-2 py-1.5 flex flex-col gap-0.5 ${
                          booking.status === "확정" ? "bg-blue-600 text-white" : "bg-amber-400 text-white"
                        }`}
                      >
                        <span className="text-[10px] font-black truncate leading-tight">{booking.roomName}</span>
                        <span className="text-[9px] font-semibold opacity-80">📍 {booking.firstPetName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* fix 6: 빈 달 안내 */}
          {!hasBookingInMonth && (
            <div className="mt-6 text-center py-8 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-3xl mb-2">🗓️</p>
              <p className="text-gray-400 font-medium text-sm">이 달에는 예약이 없어요</p>
              <button
                onClick={goToNextBookingMonth}
                className="mt-3 text-blue-500 font-bold text-sm hover:underline"
              >
                다가오는 예약 보러가기 →
              </button>
            </div>
          )}
        </>
      )}

      {/* 범례 + 새 예약 버튼 */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <div className="w-3 h-3 bg-blue-600 rounded-sm" /> 확정된 예약
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <div className="w-3 h-3 bg-amber-400 rounded-sm" /> 대기 중인 예약
          </div>
        </div>
        <a
          href="/Hotel/Booking"
          className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 text-sm"
        >
          + 새 예약 신청하기
        </a>
      </div>
    </div>
  );
}