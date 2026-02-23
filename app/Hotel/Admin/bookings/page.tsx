"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { ko } from "date-fns/locale";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Status = "대기" | "확정" | "거절";

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-10 py-5 rounded-2xl shadow-2xl font-black text-xl flex items-center gap-3 animate-bounce ${type === "success" ? "bg-blue-600 text-white" : "bg-red-600 text-white"}`}>
      {type === "success" ? "✅" : "⚠️"} {message}
    </div>
  );
}

function mapDbToUiStatus(dbStatus: string): Status {
  const s = String(dbStatus ?? "").toLowerCase();
  if (s === "confirmed") return "확정";
  if (s === "canceled" || s === "cancelled") return "거절";
  return "대기";
}

export default function AdminBookings() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // ✅ 브라우저 저장소에서 기존 설정 불러오기
  const [approveMode, setApproveMode] = useState<"manual" | "auto">(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('approveMode') as "manual" | "auto") || "manual";
    }
    return "manual";
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: bookingRows, error } = await supabase
        .from("bookings")
        .select(`*, rooms(name), profiles(name, email), pets!bookings_pet_id_fkey(name)`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (bookingRows) {
        setBookings(bookingRows.map(b => ({
          ...b,
          uiStatus: mapDbToUiStatus(b.status),
          roomName: b.rooms?.name || "객실 미지정",
          userName: b.profiles?.name || "성함 없음",
          petDisplayName: b.pets?.name || b.pet_name || "강아지"
        })));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  // ✅ 상태 업데이트 함수
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", id);
    if (error) {
      showToast("처리에 실패했습니다.", "error");
    } else {
      fetchBookings();
    }
  };

  // ✅ 자동 승인 모드 토글 및 저장
  const toggleApproveMode = () => {
    const nextMode = approveMode === "manual" ? "auto" : "manual";
    setApproveMode(nextMode);
    localStorage.setItem('approveMode', nextMode);
    showToast(`자동 승인 모드가 ${nextMode === 'auto' ? '활성화' : '비활성화'} 되었습니다.`, "success");
  };

  useEffect(() => {
    setMounted(true);
    fetchBookings();

    const channel = supabase.channel("admin_refresher")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, async (payload) => {
        // 🚀 자동 승인 핵심 로직: 새로운 데이터(INSERT)가 들어왔을 때
        if (payload.eventType === "INSERT" && approveMode === "auto") {
          const newBooking = payload.new;
          if (newBooking.status === "pending" || !newBooking.status) {
            await supabase.from("bookings").update({ status: "confirmed" }).eq("id", newBooking.id);
            showToast("새 예약이 자동 승인되었습니다.", "success");
          }
        }
        fetchBookings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchBookings, approveMode]); // approveMode가 바뀔 때 리스너가 최신 모드값을 알 수 있게 함

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((b) => {
      if (b.uiStatus === "거절") return false; 
      const start = parseISO(b.check_in);
      const end = parseISO(b.check_out);
      return isWithinInterval(startOfDay(day), { start: startOfDay(start), end: startOfDay(end) });
    });
  };

  const selectedDayBookings = useMemo(() => {
    const targetYmd = format(selectedDate, "yyyy-MM-dd");
    return bookings.filter(b => {
        const start = b.check_in;
        const end = b.check_out;
        return targetYmd >= start && targetYmd <= end;
    }).sort((a, b) => (a.uiStatus === "대기" ? -1 : 1));
  }, [bookings, selectedDate]);

  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto p-6 min-h-screen bg-gray-100 flex flex-col gap-6 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">🗓️ 예약 관리 시스템</h1>
        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-200">
          <span className="text-lg font-bold px-4 text-gray-600">자동 승인 모드</span>
          <button 
            onClick={toggleApproveMode}
            className={`px-10 py-3 rounded-xl text-xl font-black transition-all shadow-md active:scale-95 ${approveMode === "auto" ? "bg-green-600 text-white" : "bg-gray-400 text-white"}`}
          >
            {approveMode === "auto" ? "켜짐" : "꺼짐"}
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* 캘린더 패널 */}
        <div className="xl:w-[450px] flex flex-col">
          <div className="bg-white rounded-[40px] shadow-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-3xl p-2 hover:bg-gray-100 rounded-full transition-all">◀</button>
              <h2 className="text-2xl font-black">{format(currentMonth, "yyyy년 M월")}</h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-3xl p-2 hover:bg-gray-100 rounded-full transition-all">▶</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
                <div key={d} className={`text-center py-2 text-sm font-black ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-400"}`}>{d}</div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayBookings = getBookingsForDay(day);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const pendingCount = dayBookings.filter(b => b.uiStatus === "대기").length;
                return (
                  <div key={idx} onClick={() => setSelectedDate(day)}
                    className={`h-20 border rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all relative
                      ${!isCurrentMonth ? "opacity-20" : "opacity-100"}
                      ${isSelected ? "bg-blue-600 text-white shadow-lg scale-105 z-10 border-blue-600" : "bg-white text-gray-800 hover:bg-gray-50 border-gray-100"}
                    `}
                  >
                    <span className="text-lg font-bold">{format(day, "d")}</span>
                    {pendingCount > 0 && <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />}
                    {dayBookings.length > 0 && pendingCount === 0 && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 상세 리스트 패널 */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-[40px] shadow-xl border-t-8 border-blue-600">
            <div className="flex justify-between items-center mb-8 border-b pb-6 text-gray-900">
              <h3 className="text-4xl font-black">{format(selectedDate, "M월 d일 (EEEE)", { locale: ko })}</h3>
              <div className="text-2xl font-bold text-blue-600 bg-blue-50 px-6 py-2 rounded-full">총 {selectedDayBookings.length}건</div>
            </div>
            <div className="space-y-6">
              {selectedDayBookings.length === 0 ? (
                <div className="py-40 text-center text-3xl font-bold text-gray-300 bg-gray-50 rounded-[40px] border-4 border-dashed border-gray-200">예약 내역이 없습니다.</div>
              ) : (
                selectedDayBookings.map((booking) => (
                  <div key={booking.id} className={`p-8 rounded-[40px] border-4 transition-all ${booking.uiStatus === "대기" ? "border-orange-400 bg-orange-50/30" : booking.uiStatus === "확정" ? "border-green-400 bg-white shadow-md" : "border-gray-100 bg-gray-50 opacity-80"}`}>
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                      <div className="flex gap-8 items-center">
                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-6xl shadow-inner border border-gray-100">
                          {booking.petDisplayName.includes("묘") ? "🐱" : "🐶"}
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-2">
                            <h4 className="text-4xl font-black text-gray-900">{booking.petDisplayName}</h4>
                            <span className="text-2xl font-bold text-blue-600 bg-blue-50 px-4 py-1 rounded-xl border border-blue-100">{booking.userName} 고객님</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-500 tracking-tight">🏢 {booking.roomName} | 📅 {booking.check_in} ~ {booking.check_out}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {booking.uiStatus === "대기" ? (
                          <>
                            <button onClick={() => updateStatus(booking.id, 'confirmed')} className="px-12 py-6 bg-blue-600 text-white text-2xl font-black rounded-[30px] hover:bg-blue-700 shadow-xl transition-all active:scale-95">승인하기</button>
                            <button onClick={() => { if(confirm("정말 거절하시겠습니까?")) updateStatus(booking.id, 'cancelled') }} className="px-8 py-6 bg-white border-4 border-gray-200 text-gray-400 text-2xl font-black rounded-[30px] hover:bg-gray-100 transition-all active:scale-95">거절</button>
                          </>
                        ) : booking.uiStatus === "확정" ? (
                          <div className="flex flex-col items-end gap-2">
                            <div className="px-10 py-5 rounded-[30px] text-2xl font-black bg-green-100 text-green-700 border-4 border-green-200 shadow-sm">✅ 승인완료</div>
                            <button onClick={() => { if(confirm("입실 취소하시겠습니까?")) updateStatus(booking.id, 'cancelled') }} className="text-lg font-bold text-red-400 hover:text-red-600 underline px-4 transition-colors">입실 취소하기</button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-2">
                            <div className="px-10 py-5 rounded-[30px] text-2xl font-black bg-gray-100 text-gray-500 border-4 border-gray-200">❌ 거절됨</div>
                            <button onClick={() => { if(confirm("다시 대기로 되돌리시겠습니까?")) updateStatus(booking.id, 'pending') }} className="text-lg font-bold text-blue-400 hover:text-blue-600 underline px-4 transition-colors">대기로 복구</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}