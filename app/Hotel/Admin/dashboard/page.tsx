"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 1. 타입 정의 ---
const SMALL_MAX_WEIGHT = 7;
type RoomStatus = "입실중" | "퇴실예정" | "공실" | "청소중";
type BookingStatusUi = "확정" | "대기" | "취소";

type RoomRow = {
  id: string;
  name: string;
  price: number | null;
  spec: string | null;
  small_capacity: number | null;
  large_capacity: number | null;
  created_at: string | null;
};

type BookingRow = {
  id: string;
  user_id: string | null;
  room_id: string | null;
  check_in: string;
  check_out: string;
  status: string | null;
  created_at: string | null;
  profiles?: { name: string | null; phone: string | null } | null;
  rooms?: { name: string | null } | null;
};

type RoomCard = {
  id: string;
  name: string;
  type: string;
  status: RoomStatus;
  petName: string;
  breed: string;
  owner: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  notes: string;
  emoji: string;
  smallCap: number;
  mediumCap: number;
  currentSmall: number;
  currentMedium: number;
};

type MonthBookingCell = {
  date: number;
  bookings: {
    id: string;
    petName: string;
    room: string;
    type: "checkin" | "checkout" | "stay";
    status: BookingStatusUi;
    owner: string;
    phone: string;
    breed: string;
    weight: string;
    checkIn: string;
    checkOut: string;
    time: string;
  }[];
};

const ROOM_STATUS_STYLE: Record<RoomStatus, { bg: string; text: string; dot: string; label: string }> = {
  입실중: { bg: "bg-blue-50 border-blue-300", text: "text-blue-700", dot: "bg-blue-500", label: "입실중" },
  퇴실예정: { bg: "bg-amber-50 border-amber-300", text: "text-amber-700", dot: "bg-amber-400", label: "퇴실예정" },
  공실: { bg: "bg-green-50 border-green-300", text: "text-green-700", dot: "bg-green-400", label: "공실" },
  청소중: { bg: "bg-gray-50 border-gray-300", text: "text-gray-500", dot: "bg-gray-400", label: "청소중" },
};

// --- 2. 유틸리티 함수 ---
function ymd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function monthStart(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function monthEnd(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function daysInMonth(d: Date) { return monthEnd(d).getDate(); }

function mapDbStatusToUi(s: string | null): BookingStatusUi {
  const v = String(s ?? "").toLowerCase();
  if (v === "confirmed" || v === "paid") return "확정";
  if (v === "canceled" || v === "cancelled") return "취소";
  return "대기";
}

function formatMMDD(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length < 3) return dateStr;
  return `${parts[1]}/${parts[2]}`;
}

function safeTimeFromCreatedAt(createdAt: string | null) {
  if (!createdAt) return "-";
  const t = createdAt.split("T")[1] ?? "";
  return t.slice(0, 5) || "-";
}

function pickEmojiByBreed(breed: string) {
  const b = breed || "";
  if (b.includes("리트리버") || b.includes("골든")) return "🦮";
  if (b.includes("말티즈") || b.includes("비숑")) return "🐩";
  if (b.includes("포메")) return "🦊";
  if (b.includes("고양이") || b.includes("묘")) return "🐱";
  return "🐾";
}

// --- 3. 메인 컴포넌트 ---
export default function AdminDashboard() {
  const [todayStr, setTodayStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [month, setMonth] = useState<Date>(new Date());
  const [monthBookings, setMonthBookings] = useState<MonthBookingCell[]>([]);
  
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());
  const [checkinDone, setCheckinDone] = useState<string[]>([]);

  useEffect(() => {
    setTodayStr(new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" }));
  }, []);

  const tomorrowYmd = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth(), selectedDate);
    return ymd(addDays(d, 1));
  }, [month, selectedDate]);

  // A) 룸 카드 계산
  const roomCards = useMemo(() => {
    return rooms.map((room) => {
      const dayCell = monthBookings.find((c) => c.date === selectedDate);
      const roomBookings = dayCell?.bookings.filter(b => b.room === room.name) || [];
      
      let currentSmall = 0;
      let currentMedium = 0;

      roomBookings.forEach(b => {
        if (b.type === 'checkout') return; 
        const wStr = b.weight.replace("kg", "").trim();
        const weight = parseFloat(wStr) || 0;
        if (weight <= SMALL_MAX_WEIGHT) currentSmall++;
        else currentMedium++;
      });

      const confirmed = roomBookings.filter(b => b.status === "확정");
      const pending = roomBookings.filter(b => b.status === "대기");

      const targetBooking = confirmed[0] || pending[0] || null;

      let status: RoomStatus = "공실";
      if (targetBooking) {
        if (targetBooking.type === "checkout") {
          status = "청소중";
        } else {
          const isLeavingTomorrow = targetBooking.checkOut === tomorrowYmd;
          status = isLeavingTomorrow ? "퇴실예정" : "입실중";
        }
      }

      return {
        id: room.id,
        name: room.name,
        type: room.spec ?? "객실",
        status,
        petName: targetBooking?.petName || "",
        breed: targetBooking?.breed || "",
        owner: targetBooking?.owner || "",
        phone: targetBooking?.phone || "",
        checkIn: targetBooking ? formatMMDD(targetBooking.checkIn) : "",
        checkOut: targetBooking ? formatMMDD(targetBooking.checkOut) : "",
        notes: targetBooking?.status === "대기" ? "승인 필요" : "",
        emoji: targetBooking ? pickEmojiByBreed(targetBooking.breed) : "",
        smallCap: room.small_capacity ?? 0,
        mediumCap: room.large_capacity ?? 0,
        currentSmall,
        currentMedium,
      };
    });
  }, [rooms, monthBookings, selectedDate, tomorrowYmd]);

  const roomGroups = useMemo(() => {
    const groups: Record<string, typeof roomCards> = {};
    roomCards.forEach(r => {
      const t = r.type || "기타";
      if (!groups[t]) groups[t] = [];
      groups[t].push(r);
    });
    return groups;
  }, [roomCards]);

  const todayCheckins = useMemo(() => {
    const dayCell = monthBookings.find((c) => c.date === selectedDate);
    return (dayCell?.bookings.filter(b => b.type === "checkin") || []).map(b => ({
      id: b.id,
      petName: b.petName,
      breed: b.breed,
      weight: b.weight,
      owner: b.owner,
      phone: b.phone,
      room: b.room,
      time: b.time,
      notes: b.status === "대기" ? "승인 대기" : "",
      emoji: pickEmojiByBreed(b.breed)
    }));
  }, [monthBookings, selectedDate]);

  const stats = useMemo(() => ({
    totalRooms: roomCards.length,
    occupied: roomCards.filter(r => r.status === "입실중").length,
    empty: roomCards.filter(r => r.status === "공실").length,
    leaving: roomCards.filter(r => r.status === "퇴실예정").length,
    todayCheckin: todayCheckins.length,
    checkinDone: checkinDone.length,
  }), [roomCards, todayCheckins, checkinDone]);

  // --- 데이터 페칭 (핵심 수정 부분) ---
  async function loadDashboard(targetMonth: Date) {
    setLoading(true);
    try {
      // 1. 모든 룸 로드
      const { data: rData } = await supabase.from("rooms").select("*").order("created_at", { ascending: true });
      setRooms((rData ?? []) as RoomRow[]);

      const start = ymd(monthStart(targetMonth));
      const end = ymd(monthEnd(targetMonth));

      // 2. 모든 사용자의 예약 로드 (관리자용 쿼리)
      const { data: bData, error: bError } = await supabase
        .from("bookings")
        .select(`
          id, user_id, room_id, check_in, check_out, status, created_at,
          rooms ( name ),
          profiles:user_id ( name, phone )
        `)
        .lte("check_in", end)
        .gte("check_out", start);

      if (bError) throw bError;

      const bookings = (bData ?? []) as unknown as BookingRow[];
      if (bookings.length === 0) {
        setMonthBookings([]);
        setLoading(false);
        return;
      }

      const bookingIds = bookings.map(b => b.id);

      // 3. 펫 정보 로드
      const { data: pData } = await supabase
        .from("booking_pets")
        .select(`
          booking_id, 
          pets:pet_id ( name, breed, weight )
        `)
        .in("booking_id", bookingIds);
      
      const petMap = new Map();
      (pData ?? []).forEach((row: any) => {
        if(!petMap.has(row.booking_id)) petMap.set(row.booking_id, []);
        if (row.pets) petMap.get(row.booking_id).push(row.pets);
      });

      // 4. 날짜별 셀 데이터 생성
      const dim = daysInMonth(targetMonth);
      const cells: MonthBookingCell[] = [];
      for (let d = 1; d <= dim; d++) {
        const curYmd = ymd(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), d));
        
        const dayEvents = bookings.filter(b => 
          b.check_in <= curYmd && 
          b.check_out >= curYmd && 
          mapDbStatusToUi(b.status) !== "취소"
        ).flatMap(b => {
          const pets = petMap.get(b.id) || [];
          const displayPets = pets.length > 0 ? pets : [{ name: "펫", breed: "", weight: "" }];

          return displayPets.map((pet: any) => ({
            id: b.id,
            petName: pet.name || "펫",
            room: b.rooms?.name ?? "객실",
            type: (b.check_in === curYmd ? "checkin" : b.check_out === curYmd ? "checkout" : "stay") as any,
            status: mapDbStatusToUi(b.status),
            owner: b.profiles?.name ?? "정보없음",
            phone: b.profiles?.phone ?? "-",
            breed: pet.breed ?? "",
            weight: pet.weight ? `${pet.weight}kg` : "",
            checkIn: b.check_in,
            checkOut: b.check_out,
            time: safeTimeFromCreatedAt(b.created_at)
          }));
        });
        cells.push({ date: d, bookings: dayEvents });
      }
      setMonthBookings(cells);
    } catch (e) { 
      console.error("로드 오류:", e); 
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { loadDashboard(month); }, [month]);

  const toggleCheckin = (id: string) => setCheckinDone(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* ── 헤더 ── */}
      <div className="bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="bg-red-500 text-white text-sm font-black px-4 py-1.5 rounded-full shadow-sm">ADMIN</span>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">🐾 {month.getMonth()+1}월 {selectedDate}일 호텔 대시보드</h1>
            <p className="text-xs font-bold text-gray-400">{todayStr}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border">
          <span className={`w-3 h-3 rounded-full ${loading ? "bg-gray-300" : "bg-green-500 animate-pulse"}`}></span>
          <span className="text-xs text-gray-600 font-black">{loading ? "데이터 갱신 중..." : "실시간 서버 연결됨"}</span>
        </div>
      </div>

      {/* ── 통계 바 ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex gap-4 overflow-x-auto no-scrollbar">
        {[
          { label: "전체 객실", value: stats.totalRooms, color: "text-gray-900", bg: "bg-gray-100" },
          { label: "현재 입실", value: stats.occupied, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
          { label: "잔여 공실", value: stats.empty, color: "text-green-600", bg: "bg-green-50 border-green-100" },
          { label: "퇴실 예정", value: stats.leaving, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          { label: "오늘 체크인", value: stats.todayCheckin, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100" },
        ].map((s) => (
          <div key={s.label} className={`flex flex-col gap-1 px-6 py-3 rounded-2xl shrink-0 border-2 min-w-[140px] ${s.bg}`}>
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
            <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[calc(100vh-180px)]">
        
        {/* 1. 룸 현황 패널 */}
        <div className="bg-white border-r-2 border-gray-200 p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">🏠 객실 배정 현황</h2>
            <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black rounded-lg uppercase tracking-tighter">Real-time</span>
          </div>

          <div className="space-y-5">
            {Object.entries(roomGroups).map(([type, groupRooms]) => {
              const isExpanded = expandedType === type;
              const currentSmallTotal = groupRooms.reduce((sum, r) => sum + r.currentSmall, 0);
              const currentMediumTotal = groupRooms.reduce((sum, r) => sum + r.currentMedium, 0);
              const totalSmallCap = groupRooms.reduce((sum, r) => sum + r.smallCap, 0);
              const totalMediumCap = groupRooms.reduce((sum, r) => sum + r.mediumCap, 0);

              return (
                <div key={type} className="bg-white border-2 border-gray-200 rounded-[32px] overflow-hidden transition-all shadow-sm">
                  <div 
                    onClick={() => setExpandedType(isExpanded ? null : type)}
                    className={`p-5 cursor-pointer flex justify-between items-center transition-all ${isExpanded ? "bg-gray-50 border-b-2" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-100">{isExpanded ? "📂" : "📁"}</div>
                      <div>
                        <h3 className="font-black text-gray-900 text-lg">{type}</h3>
                        <p className="text-xs font-bold text-gray-400">{groupRooms.length} Rooms Available</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-black text-gray-400">SMALL</span>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black ${currentSmallTotal > 0 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                          {currentSmallTotal}/{totalSmallCap}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-black text-gray-400">MEDIUM</span>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black ${currentMediumTotal > 0 ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"}`}>
                          {currentMediumTotal}/{totalMediumCap}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-gray-50/50 space-y-4">
                      {groupRooms.map((room) => {
                        const s = ROOM_STATUS_STYLE[room.status];
                        const isSelected = selectedRoom === room.id;
                        return (
                          <div key={room.id} onClick={(e) => { e.stopPropagation(); setSelectedRoom(isSelected ? null : room.id); }} className={`bg-white border-2 rounded-3xl p-5 cursor-pointer transition-all ${isSelected ? "border-blue-500 shadow-xl scale-[1.02]" : "border-gray-100 hover:border-gray-300 shadow-sm"}`}>
                            <div className="flex justify-between items-center mb-4">
                              <span className="font-black text-gray-900 text-xl">{room.name}</span>
                              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border shadow-sm">
                                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`}></span>
                                <span className={`text-[11px] font-black ${s.text}`}>{s.label}</span>
                              </div>
                            </div>

                            {room.petName ? (
                              <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <span className="text-5xl drop-shadow-sm">{room.emoji}</span>
                                <div className="flex-1">
                                  <p className="text-lg font-black text-gray-900">{room.petName}</p>
                                  <p className="text-xs font-bold text-gray-500">{room.breed} · {room.owner} 보호자님</p>
                                  <div className="mt-2 flex gap-2">
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">IN: {room.checkIn}</span>
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md">OUT: {room.checkOut}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="py-6 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                                <p className="text-xs font-black text-gray-300 italic">VACANT ROOM</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 입실 현황 패널 */}
        <div className="bg-gray-50 p-6 border-r-2 border-gray-200 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <h2 className="text-xl font-black text-gray-900 mb-1">🛫 체크인 리스트</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Today's Check-ins</p>
          </div>
          
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex justify-between items-end mb-3">
                <span className="text-xs font-black text-gray-500">진행률</span>
                <span className="text-2xl font-black text-blue-600">{checkinDone.length}<span className="text-sm text-gray-300 ml-1">/ {todayCheckins.length}</span></span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-lg" style={{ width: `${(checkinDone.length/Math.max(1,todayCheckins.length))*100}%` }}></div>
            </div>
          </div>

          <div className="space-y-4">
            {todayCheckins.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[40px] border-4 border-dashed border-gray-200">
                    <p className="text-5xl mb-4 grayscale opacity-50">🦴</p>
                    <p className="text-sm font-black text-gray-400">오늘 입실 일정이 없습니다.</p>
                </div>
            ) : todayCheckins.map((item, idx) => {
              const isDone = checkinDone.includes(item.id);
              return (
                <div key={`${item.id}-${idx}`} onClick={() => toggleCheckin(item.id)} className={`group bg-white p-5 rounded-[32px] border-2 cursor-pointer transition-all ${isDone ? "border-green-200 opacity-60 grayscale-[0.5]" : "hover:border-blue-400 hover:shadow-xl hover:-translate-y-1"}`}>
                  <div className="flex gap-5 items-center">
                    <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? "bg-green-500 border-green-500 text-white" : "bg-gray-50 border-gray-200 text-gray-300"}`}>
                        {isDone ? <span className="text-xl font-black">✓</span> : <span className="text-xs font-black">{idx + 1}</span>}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className={`text-lg font-black tracking-tight ${isDone ? "line-through text-gray-400" : "text-gray-900"}`}>{item.petName} <span className="text-xs text-gray-400 ml-1">({item.breed})</span></p>
                                <p className="text-xs font-bold text-gray-400">{item.owner} · {item.phone}</p>
                            </div>
                            <span className="text-blue-600 font-black bg-blue-50 px-3 py-1 rounded-xl text-[10px] border border-blue-100 shadow-sm uppercase">{item.room}</span>
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. 캘린더 패널 */}
        <div className="bg-white p-6 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">📅 Monthly Schedule</h2>
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl">
              <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-all font-black text-gray-600">◀</button>
              <button onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-xl transition-all font-black text-gray-600">▶</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-10">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(d => <div key={d} className="text-center text-[9px] text-gray-300 font-black mb-2 tracking-widest">{d}</div>)}
            {Array.from({ length: new Date(month.getFullYear(), month.getMonth(), 1).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth(month) }).map((_, i) => {
              const d = i + 1;
              const cell = monthBookings.find(c => c.date === d);
              const hasCheckin = cell?.bookings.some(b => b.type === "checkin");
              const hasCheckout = cell?.bookings.some(b => b.type === "checkout");
              const isSelected = selectedDate === d;
              return (
                <button key={d} onClick={() => setSelectedDate(d)} className={`aspect-square rounded-2xl text-[13px] font-black flex flex-col items-center justify-center transition-all relative ${isSelected ? "bg-gray-900 text-white shadow-2xl scale-110 z-10" : "hover:bg-gray-50 text-gray-800 border border-gray-50"}`}>
                  {d}
                  <div className="flex gap-1 mt-1">
                    {hasCheckin && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm"></span>}
                    {hasCheckout && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shadow-sm"></span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="space-y-4 border-t-2 border-gray-100 pt-8">
            <h3 className="font-black text-gray-900 text-sm mb-4">📋 {selectedDate}일 타임라인</h3>
            {monthBookings.find(c => c.date === selectedDate)?.bookings.map((b, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border-2 border-white shadow-sm text-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-100">{pickEmojiByBreed(b.breed)}</div>
                    <div>
                        <p className="font-black text-gray-900">{b.petName} <span className="text-[10px] text-gray-400 font-bold ml-1">@{b.room}</span></p>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{b.owner} Guardian</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full font-black text-[10px] shadow-sm ${b.type === 'checkin' ? 'bg-blue-600 text-white' : b.type === 'checkout' ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {b.type === 'checkin' ? '입실' : b.type === 'checkout' ? '퇴실' : '숙박'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}