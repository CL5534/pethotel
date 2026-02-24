"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 1) 타입/상수 ---
const SMALL_MAX_WEIGHT = 7;

type BookingStatusUi = "확정" | "대기" | "취소" | "입실중" | "퇴실완료";
type RoomStatus = "입실중" | "퇴실예정" | "공실" | "퇴실";

type RoomRow = {
  id: string;
  name: string;
  price: number | null;
  small_capacity: number | null;
  large_capacity: number | null;
  created_at: string | null;
};

type BookingRow = {
  id: string;
  user_id: string | null;
  room_id: string | null;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  status: string | null;
  created_at: string | null;
  checked_in_at?: string | null;
  checked_out_at?: string | null;
  rooms?: { id: string | null; name: string | null } | null;
  profiles?: { name: string | null; phone: string | null } | null;
};

type DayEvent = {
  id: string; // booking id
  uniqueId: string; // booking id + pet idx
  roomId: string; // ✅ room_id 기반
  petName: string;
  type: "checkin" | "checkout" | "stay";
  status: BookingStatusUi;
  owner: string;
  phone: string;
  breed: string;
  weight: string;
  checkIn: string;
  checkOut: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  time: string; // created_at 기반 "HH:mm"
};

type MonthBookingCell = {
  date: number;
  bookings: DayEvent[];
};

type BookingSummary = {
  bookingId: string;
  roomId: string; // ✅ room_id 기반
  roomName: string;
  owner: string;
  phone: string;
  status: BookingStatusUi;
  checkIn: string;
  checkOut: string;
  checkedInAt?: string | null;
  checkedOutAt?: string | null;
  pets: Array<{ petId: string; petName: string; breed: string; weight: string }>;
};

type RoomView = {
  roomId: string;
  roomName: string;
  roomType: string;

  smallCap: number;
  mediumCap: number;

  status: RoomStatus;

  smallBookings: BookingSummary[];
  mediumBookings: BookingSummary[];

  smallCount: number;
  mediumCount: number;
};

const STATUS_BADGE: Record<RoomStatus, { cls: string; label: string }> = {
  입실중: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "입실중" },
  퇴실예정: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "퇴실예정" },
  공실: { cls: "bg-green-50 text-green-700 border-green-200", label: "공실" },
  퇴실: { cls: "bg-gray-50 text-gray-700 border-gray-200", label: "퇴실" },
};

function ymd(d: Date) {
  return d.toISOString().split("T")[0];
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function mapDbStatusToUi(s: string | null): BookingStatusUi {
  const v = String(s ?? "").toLowerCase();
  if (v === "confirmed" || v === "paid") return "확정";
  if (v === "canceled" || v === "cancelled") return "취소";
  if (v === "checked_in") return "입실중";
  if (v === "checked_out") return "퇴실완료";
  return "대기";
}
function formatMMDD(dateStr: string) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}
function safeTimeFromCreatedAt(createdAt: string | null) {
  if (!createdAt) return "-";
  return createdAt.split("T")[1]?.slice(0, 5) || "-";
}
function normalize(s: any) {
  return String(s ?? "").trim().toLowerCase().replace(/\s+/g, "");
}
function toNumWeight(w: string) {
  const n = parseFloat(String(w ?? ""));
  return Number.isFinite(n) ? n : 0;
}

// ✅ 소형/중형 텍스트
function sizeTextByWeight(weight: string) {
  const w = toNumWeight(weight);
  return w <= SMALL_MAX_WEIGHT ? "소형" : "중형";
}

// ✅ spec 대신 "room.name"에서 룸 타입을 만들기
function getRoomType(room: RoomRow): string {
  const n = normalize(room.name);

  if (n.includes("디럭스") || n.includes("deluxe")) return "디럭스룸";
  if (n.includes("스탠다드") || n.includes("스탠") || n.includes("스텐다르") || n.includes("standard"))
    return "스탠다드룸";

  return "기타";
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button aria-label="close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="relative h-full w-full flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="text-lg font-extrabold text-gray-900">{title}</div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-bold hover:bg-gray-50"
            >
              닫기
            </button>
          </div>
          <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [todayStr, setTodayStr] = useState("");
  const [loading, setLoading] = useState(true);

  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [month, setMonth] = useState<Date>(new Date());
  const [monthBookings, setMonthBookings] = useState<MonthBookingCell[]>([]);

  const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  // --- 필터 상태 ---
  const [filterStatus, setFilterStatus] = useState<BookingStatusUi | "전체">("전체");
  const [filterType, setFilterType] = useState<"checkin" | "checkout" | "stay" | "전체">("전체");
  const [filterSize, setFilterSize] = useState<"small" | "medium" | "전체">("전체");

  useEffect(() => {
    setTodayStr(
      new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    );
  }, []);

  const tomorrowYmd = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth(), selectedDate);
    return ymd(addDays(d, 1));
  }, [month, selectedDate]);

  const selectedYmd = useMemo(() => {
    const d = new Date(month.getFullYear(), month.getMonth(), selectedDate);
    return ymd(d);
  }, [month, selectedDate]);

  // --- DB 로딩(읽기 전용) ---
  async function loadDashboard(targetMonth: Date) {
    setLoading(true);
    try {
      // 1) rooms
      const { data: rData, error: rErr } = await supabase
        .from("rooms")
        .select("id, name, price, small_capacity, large_capacity, created_at")
        .order("created_at", { ascending: true });

      if (rErr) console.error("rooms load error:", rErr);
      setRooms((rData || []) as RoomRow[]);

      // 2) bookings
      const start = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const end = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);

      const { data: bData, error: bErr } = await supabase
        .from("bookings")
        .select(
          `
          id, user_id, room_id, check_in, check_out, status, created_at,
          checked_in_at, checked_out_at,
          rooms ( id, name ),
          profiles:user_id ( name, phone )
        `
        )
        .lte("check_in", ymd(end))
        .gte("check_out", ymd(start));

      if (bErr) console.error("bookings load error:", bErr);

      const bookings: BookingRow[] = (bData || []) as any;

      // 3) booking_pets (pet_id로 중복 제거)
      const bookingIds = bookings.map((b) => b.id);
      const { data: pData, error: pErr } =
        bookingIds.length === 0
          ? ({ data: [] } as any)
          : await supabase
              .from("booking_pets")
              .select(`booking_id, pet_id, pets:pet_id ( name, breed, weight )`)
              .in("booking_id", bookingIds);

      if (pErr) console.error("booking_pets load error:", pErr);

      // bookingId -> Map(pet_id -> pet)
      const petMap = new Map<string, Map<string, any>>();
      (pData || []).forEach((row: any) => {
        const bookingId = row.booking_id as string;
        const petId = String(row.pet_id ?? "");
        const pet = row.pets;

        if (!petMap.has(bookingId)) petMap.set(bookingId, new Map());
        if (petId) petMap.get(bookingId)!.set(petId, pet);
      });

      // 4) month cells 구성
      const dim = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
      const cells: MonthBookingCell[] = [];

      for (let d = 1; d <= dim; d++) {
        const curYmd = ymd(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), d));

        const dayEvents: DayEvent[] = bookings
          .filter((b) => {
            if (mapDbStatusToUi(b.status) === "취소") return false;
            if (!b.room_id) return false;
            return b.check_in <= curYmd && b.check_out >= curYmd;
          })
          .flatMap((b) => {
            const roomId = b.room_id as string;
            const ownerName = b.profiles?.name ?? "";
            const ownerPhone = b.profiles?.phone ?? "";

            const type: DayEvent["type"] =
              b.check_in === curYmd ? "checkin" : b.check_out === curYmd ? "checkout" : "stay";

            const petMapById = petMap.get(b.id);
            const petsArr =
              petMapById && petMapById.size > 0
                ? Array.from(petMapById.entries()).map(([petId, petObj]) => ({ petId, petObj }))
                : [{ petId: "unknown", petObj: { name: "펫", breed: "", weight: "" } }];

            return petsArr.map((p, idx) => {
              const pet = p.petObj;

              return {
                id: b.id,
                uniqueId: `${b.id}-${p.petId}-${idx}`,
                roomId,
                petName: pet.name ?? "펫",
                type,
                status: mapDbStatusToUi(b.status),
                owner: ownerName,
                phone: ownerPhone,
                breed: pet.breed ?? "",
                weight: String(pet.weight ?? ""),
                checkIn: b.check_in,
                checkOut: b.check_out,
                checkedInAt: b.checked_in_at ?? null,
                checkedOutAt: b.checked_out_at ?? null,
                time: safeTimeFromCreatedAt(b.created_at),
              };
            });
          });

        cells.push({ date: d, bookings: dayEvents });
      }

      setMonthBookings(cells);
    } finally {
      setLoading(false);
    }
  }

  // --- 상태 변경 (승인/취소) ---
  const updateStatus = async (bookingId: string, newStatus: "confirmed" | "cancelled" | "checked_in" | "checked_out") => {
    let actionName = "";
    if (newStatus === "confirmed") actionName = "승인";
    if (newStatus === "cancelled") actionName = "취소";
    if (newStatus === "checked_in") actionName = "체크인";
    if (newStatus === "checked_out") actionName = "체크아웃";

    if (!confirm(`정말 예약을 ${actionName}하시겠습니까?`)) return;

    try {
      const updates: any = { status: newStatus };
      // 체크인/체크아웃 시간 기록
      if (newStatus === "checked_in") updates.checked_in_at = new Date().toISOString();
      if (newStatus === "checked_out") updates.checked_out_at = new Date().toISOString();

      const { error } = await supabase.from("bookings").update(updates).eq("id", bookingId);
      if (error) throw error;

      await loadDashboard(month);
      if (newStatus === "cancelled") setSelectedBookingId(null); // 취소 시 선택 해제 유지
    } catch (e: any) {
      console.error(e);
      alert(`오류: ${e.message}`);
    }
  };

  useEffect(() => {
    loadDashboard(month);
    const dim = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    setSelectedDate((prev) => Math.min(prev, dim));
  }, [month]);

  const selectedDayEvents = useMemo(() => {
    return monthBookings.find((c) => c.date === selectedDate)?.bookings || [];
  }, [monthBookings, selectedDate]);

  // --- 룸 구조 구성 ---
  const roomViewsByType = useMemo(() => {
    const bookingsById = new Map<string, BookingSummary>();

    for (const e of selectedDayEvents) {
      if (!bookingsById.has(e.id)) {
        const roomName = rooms.find((r) => r.id === e.roomId)?.name ?? "";

        bookingsById.set(e.id, {
          bookingId: e.id,
          roomId: e.roomId,
          roomName,
          owner: e.owner,
          phone: e.phone,
          status: e.status,
          checkIn: e.checkIn,
          checkOut: e.checkOut,
          // 시간 정보 매핑
          checkedInAt: e.checkedInAt ?? null,
          checkedOutAt: e.checkedOutAt ?? null,
          pets: [],
        });
      }

      const summary = bookingsById.get(e.id)!;
      const key = `${normalize(e.petName)}|${normalize(e.breed)}|${normalize(e.weight)}`;
      const already = summary.pets.some(
        (p) => `${normalize(p.petName)}|${normalize(p.breed)}|${normalize(p.weight)}` === key
      );

      if (!already) {
        summary.pets.push({
          petId: key,
          petName: e.petName,
          breed: e.breed,
          weight: e.weight,
        });
      }
    }

    const roomViews: RoomView[] = rooms.map((room) => {
      const roomType = getRoomType(room);
      const relatedBookings = Array.from(bookingsById.values()).filter((b) => b.roomId === room.id);

      const smallMap = new Map<string, BookingSummary>();
      const mediumMap = new Map<string, BookingSummary>();

      const roomLiveEvents = selectedDayEvents.filter((e) => e.roomId === room.id && e.type !== "checkout");

      let smallCount = 0;
      let mediumCount = 0;
      for (const e of roomLiveEvents) {
        const w = toNumWeight(e.weight);
        if (w <= SMALL_MAX_WEIGHT) smallCount++;
        else mediumCount++;
      }

      for (const b of relatedBookings) {
        const smallPets = b.pets.filter((p) => toNumWeight(p.weight) <= SMALL_MAX_WEIGHT);
        const mediumPets = b.pets.filter((p) => toNumWeight(p.weight) > SMALL_MAX_WEIGHT);

        if (smallPets.length > 0) smallMap.set(b.bookingId, { ...b, pets: smallPets });
        if (mediumPets.length > 0) mediumMap.set(b.bookingId, { ...b, pets: mediumPets });
      }

      const roomEvents = selectedDayEvents.filter((e) => e.roomId === room.id);
      const target = roomEvents.find((e) => e.status === "확정" || e.status === "입실중") || roomEvents[0] || null;

      let status: RoomStatus = "공실";
      if (target) {
        if (target.type === "checkout") status = "퇴실";
        else status = target.checkOut === tomorrowYmd ? "퇴실예정" : "입실중";
      }

      return {
        roomId: room.id,
        roomName: room.name,
        roomType,
        smallCap: room.small_capacity ?? 0,
        mediumCap: room.large_capacity ?? 0,
        status,
        smallBookings: Array.from(smallMap.values()),
        mediumBookings: Array.from(mediumMap.values()),
        smallCount,
        mediumCount,
      };
    });

    const map = new Map<string, RoomView[]>();
    for (const rv of roomViews) {
      if (!map.has(rv.roomType)) map.set(rv.roomType, []);
      map.get(rv.roomType)!.push(rv);
    }

    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => a.roomName.localeCompare(b.roomName, "ko"));
      map.set(k, arr);
    }

    return map;
  }, [rooms, selectedDayEvents, tomorrowYmd]);

  const filteredRoomViewsByType = useMemo(() => {
    const q = normalize(searchText);

    const out = new Map<string, RoomView[]>();
    for (const [type, arr] of roomViewsByType.entries()) {
      const filteredArr = arr.map((rv) => {
        // 1. 룸 내부 예약 필터링
        const filterFn = (b: BookingSummary) => {
          // 상태 필터
          if (filterStatus !== "전체" && b.status !== filterStatus) return false;

          // 이벤트 타입 필터
          if (filterType !== "전체") {
            let t = "stay";
            if (b.checkIn === selectedYmd) t = "checkin";
            else if (b.checkOut === selectedYmd) t = "checkout";
            
            if (t !== filterType) return false;
          }

          // 검색어 필터 (룸 이름이 매칭되면 통과, 아니면 예약 정보에서 검색)
          if (q) {
            const roomMatch = normalize(`${rv.roomName} ${rv.roomType}`).includes(q);
            if (!roomMatch) {
              const pets = b.pets.map((p) => `${p.petName} ${p.breed} ${p.weight}`).join(" ");
              const hay = `${b.owner} ${b.phone} ${pets}`;
              if (!normalize(hay).includes(q)) return false;
            }
          }

          return true;
        };

        let newSmall = rv.smallBookings.filter(filterFn);
        let newMedium = rv.mediumBookings.filter(filterFn);

        // 사이즈 필터
        if (filterSize === "small") newMedium = [];
        if (filterSize === "medium") newSmall = [];

        // 필터 결과가 없고, 검색어도 매칭 안되면 숨김
        if (newSmall.length === 0 && newMedium.length === 0) {
           return null;
        }

        return { ...rv, smallBookings: newSmall, mediumBookings: newMedium };
      }).filter((x): x is RoomView => x !== null);

      if (filteredArr.length > 0) out.set(type, filteredArr);
    }
    return out;
  }, [roomViewsByType, searchText, filterStatus, filterType, filterSize, selectedYmd]);

  const selectedBooking = useMemo(() => {
    if (!selectedBookingId) return null;

    for (const arr of filteredRoomViewsByType.values()) {
      for (const rv of arr) {
        const b1 = rv.smallBookings.find((b) => b.bookingId === selectedBookingId);
        if (b1) return { roomView: rv, booking: b1, size: "스몰" as const };
        const b2 = rv.mediumBookings.find((b) => b.bookingId === selectedBookingId);
        if (b2) return { roomView: rv, booking: b2, size: "중형" as const };
      }
    }
    return null;
  }, [selectedBookingId, filteredRoomViewsByType]);

  // ✅ 수용 초과 여부 계산 (승인/체크인 차단용)
  const isOverCapacity = useMemo(() => {
    if (!selectedBooking) return false;
    const { size, roomView } = selectedBooking;
    if (size === "스몰") {
      return roomView.smallCap > 0 && roomView.smallCount > roomView.smallCap;
    }
    return roomView.mediumCap > 0 && roomView.mediumCount > roomView.mediumCap;
  }, [selectedBooking]);

  // --- 요약 통계 (선택된 날짜 기준) ---
  const summaryStats = useMemo(() => {
    let checkins = 0;
    let checkouts = 0;
    let stays = 0;
    let pendings = 0;

    for (const e of selectedDayEvents) {
      if (e.type === "checkin") checkins++;
      if (e.type === "checkout") checkouts++;
      if (e.type === "stay") stays++;
      if (e.status === "대기") pendings++;
    }

    // 오늘 밤 투숙 = 입실 + 투숙 (퇴실 제외)
    const activeGuests = checkins + stays;

    // 전체 정원 (단순 합산)
    const totalCap = rooms.reduce((acc, r) => acc + (r.small_capacity || 0) + (r.large_capacity || 0), 0);
    const occupancyRate = totalCap > 0 ? Math.round((activeGuests / totalCap) * 100) : 0;

    return { checkins, checkouts, activeGuests, pendings, occupancyRate, totalCap };
  }, [selectedDayEvents, rooms]);

  // --- 캘린더 계산 ---
  const monthDim = useMemo(() => new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(), [month]);
  const monthFirstDay = useMemo(() => new Date(month.getFullYear(), month.getMonth(), 1).getDay(), [month]);

  const today = new Date();
  const todayIsSameMonth = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();
  const todayDate = today.getDate();

  // --- 날짜 퀵 버튼 ---
  const setToday = () => {
    const now = new Date();
    setMonth(now);
    setSelectedDate(now.getDate());
  };
  const setTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setMonth(d);
    setSelectedDate(d.getDate());
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* ── 상단 헤더 ── */}
      <div className="bg-white border-b px-6 py-4 shrink-0 z-40">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-red-600">관리자</div>
            <div className="text-2xl font-extrabold text-gray-900 mt-1">애견 호텔 대시보드</div>
            <div className="text-base text-gray-600 mt-1">{todayStr}</div>
            <div className="text-sm text-gray-500 mt-1">
              현재 날짜:{" "}
              <span className="font-bold">
                {month.getMonth() + 1}월 {selectedDate}일
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${loading ? "bg-gray-300" : "bg-green-500"}`} />
            <span className="text-sm text-gray-600">{loading ? "불러오는 중" : "연결됨"}</span>
          </div>
        </div>
      </div>

      {/* ── 요약 카드 (오늘 할 일) ── */}
      <div className="px-6 py-5 shrink-0">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm font-bold mb-1">오늘 입실</div>
            <div className="text-2xl font-black text-blue-600">{summaryStats.checkins}건</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm font-bold mb-1">오늘 퇴실</div>
            <div className="text-2xl font-black text-gray-700">{summaryStats.checkouts}건</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm font-bold mb-1">현재 투숙</div>
            <div className="text-2xl font-black text-gray-900">{summaryStats.activeGuests}마리</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm font-bold mb-1">승인 대기</div>
            <div className={`text-2xl font-black ${summaryStats.pendings > 0 ? "text-amber-500" : "text-gray-400"}`}>
              {summaryStats.pendings}건
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm font-bold mb-1">총 수용률</div>
            <div className="flex items-end gap-2">
              <div className={`text-2xl font-black ${summaryStats.occupancyRate >= 80 ? "text-red-500" : "text-gray-900"}`}>
                {summaryStats.occupancyRate}%
              </div>
              <div className="text-sm text-gray-400 font-medium mb-1">
                ({summaryStats.activeGuests}/{summaryStats.totalCap})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2패널 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 flex-1 min-h-0 border-t border-gray-200">
        {/* 좌: 룸 현황 */}
        <div className="bg-white border-r p-5 overflow-y-auto">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xl font-extrabold text-gray-900">룸 현황</div>
              <div className="text-sm text-gray-600 mt-1">스탠다드룸/디럭스룸 → 룸 → 스몰/중형 → 보호자 클릭</div>
            </div>
          </div>

          {/* 검색 & 필터 */}
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {/* 상태 필터 */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold bg-white outline-none focus:border-blue-500"
              >
                <option value="전체">상태: 전체</option>
                <option value="대기">대기</option>
                <option value="확정">확정</option>
                <option value="입실중">입실중</option>
                <option value="퇴실완료">퇴실완료</option>
                <option value="취소">취소</option>
              </select>

              {/* 이벤트 타입 필터 */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold bg-white outline-none focus:border-blue-500"
              >
                <option value="전체">이벤트: 전체</option>
                <option value="checkin">입실만</option>
                <option value="checkout">퇴실만</option>
                <option value="stay">투숙만</option>
              </select>

              {/* 사이즈 필터 */}
              <select
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold bg-white outline-none focus:border-blue-500"
              >
                <option value="전체">크기: 전체</option>
                <option value="small">스몰만</option>
                <option value="medium">중형만</option>
              </select>
            </div>

            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="검색: 룸/보호자/강아지/전화"
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* 그룹 렌더 */}
          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="text-gray-500">불러오는 중...</div>
            ) : filteredRoomViewsByType.size === 0 ? (
              <div className="text-gray-500">표시할 데이터가 없습니다.</div>
            ) : (
              Array.from(filteredRoomViewsByType.entries()).map(([type, roomsInType]) => (
                <div key={type} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="text-lg font-extrabold text-gray-900">{type}</div>
                    <div className="text-sm text-gray-600">룸 {roomsInType.length}개</div>
                  </div>

                  <div className="divide-y">
                    {roomsInType.map((rv) => (
                      <div key={rv.roomId} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm text-gray-600 mt-1">
                              수용: 스몰 {rv.smallCount}/{rv.smallCap} · 중형 {rv.mediumCount}/{rv.mediumCap}
                            </div>

                            {/* ✅ 초과 경고 */}
                            {(() => {
                              const smallOver = rv.smallCap > 0 && rv.smallCount > rv.smallCap;
                              const mediumOver = rv.mediumCap > 0 && rv.mediumCount > rv.mediumCap;

                              if (!smallOver && !mediumOver) return null;

                              return (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {smallOver && (
                                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
                                      스몰 초과
                                    </span>
                                  )}
                                  {mediumOver && (
                                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200">
                                      중형 초과
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-bold ${STATUS_BADGE[rv.status].cls}`}
                          >
                            {STATUS_BADGE[rv.status].label}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* 스몰 */}
                          <div className="bg-white border border-gray-200 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-extrabold text-gray-900">스몰</div>
                              <div className="text-sm text-gray-600">
                                {rv.smallCount}/{rv.smallCap}
                              </div>
                            </div>

                            <div className="mt-2 space-y-2">
                              {rv.smallBookings.length === 0 ? (
                                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                  비어있음
                                </div>
                              ) : (
                                rv.smallBookings.map((b) => (
                                  <button
                                    key={b.bookingId}
                                    onClick={() => setSelectedBookingId(b.bookingId)}
                                    className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-sm font-bold text-gray-900">{b.owner || "이름없음"}</div>
                                      <div
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                          b.status === "확정"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : b.status === "입실중"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : b.status === "퇴실완료"
                                            ? "bg-gray-100 text-gray-500 border-gray-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                        }`}
                                      >
                                        {b.status}
                                      </div>
                                    </div>

                                    <div className="text-sm text-gray-700 mt-1">{b.pets.map((p) => p.petName).join(", ")}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {formatMMDD(b.checkIn)}~{formatMMDD(b.checkOut)} · {b.phone || "-"}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>

                          {/* 중형 */}
                          <div className="bg-white border border-gray-200 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-extrabold text-gray-900">중형</div>
                              <div className="text-sm text-gray-600">
                                {rv.mediumCount}/{rv.mediumCap}
                              </div>
                            </div>

                            <div className="mt-2 space-y-2">
                              {rv.mediumBookings.length === 0 ? (
                                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                  비어있음
                                </div>
                              ) : (
                                rv.mediumBookings.map((b) => (
                                  <button
                                    key={b.bookingId}
                                    onClick={() => setSelectedBookingId(b.bookingId)}
                                    className="w-full text-left border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-sm font-bold text-gray-900">{b.owner || "이름없음"}</div>
                                      <div
                                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                          b.status === "확정"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : b.status === "입실중"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : b.status === "퇴실완료"
                                            ? "bg-gray-100 text-gray-500 border-gray-200"
                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                        }`}
                                      >
                                        {b.status}
                                      </div>
                                    </div>

                                    <div className="text-sm text-gray-700 mt-1">{b.pets.map((p) => p.petName).join(", ")}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {formatMMDD(b.checkIn)}~{formatMMDD(b.checkOut)} · {b.phone || "-"}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 우: 달력 */}
        <div className="bg-white p-5 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold text-gray-900">{month.getMonth() + 1}월 달력</div>
              <div className="text-sm text-gray-600 mt-1">날짜를 누르면 룸 현황도 같이 바뀝니다.</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className="px-4 py-2 rounded-xl border border-gray-200 text-base font-bold hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className="px-4 py-2 rounded-xl border border-gray-200 text-base font-bold hover:bg-gray-50"
              >
                다음
              </button>
            </div>
          </div>

          {/* 오늘/내일 퀵 버튼 */}
          <div className="flex gap-2 mt-3">
            <button onClick={setToday} className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100">오늘 보기</button>
            <button onClick={setTomorrow} className="flex-1 bg-indigo-50 text-indigo-600 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100">내일 보기</button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mt-4">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="text-sm font-bold text-gray-500">
                {d}
              </div>
            ))}

            {Array.from({ length: monthFirstDay }).map((_, i) => (
              <div key={i} />
            ))}

            {Array.from({ length: monthDim }).map((_, i) => {
              const d = i + 1;
              const cell = monthBookings.find((c) => c.date === d);
              const isSelected = selectedDate === d;

              const checkinCount = cell?.bookings.filter((b) => b.type === "checkin").length || 0;
              const checkoutCount = cell?.bookings.filter((b) => b.type === "checkout").length || 0;

              const isToday = todayIsSameMonth && d === todayDate;

              return (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`rounded-2xl border px-2 py-3 text-base font-extrabold ${
                    isSelected ? "bg-blue-600 text-white border-blue-600" : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    {isToday && !isSelected && (
                      <span className="absolute -top-2 -right-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                        오늘
                      </span>
                    )}
                    {d}
                  </div>
                  <div className={`mt-1 text-xs font-bold ${isSelected ? "text-white/90" : "text-gray-600"}`}>
                    입 {checkinCount} · 퇴 {checkoutCount}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ✅ 여기(달력 아래 이벤트 표시)만 요구사항대로 변경 */}
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="text-lg font-extrabold text-gray-900">{selectedDate}일 전체 이벤트</div>
            <div className="text-sm text-gray-600 mt-1">이름/전화/예약시간/동물이름/소형·중형 표시</div>

            <div className="mt-3 space-y-2">
              {loading ? (
                <div className="text-gray-500">불러오는 중...</div>
              ) : selectedDayEvents.length === 0 ? (
                <div className="text-gray-500">이 날짜에는 이벤트가 없습니다.</div>
              ) : (
                selectedDayEvents.map((b) => {
                  const sizeText = sizeTextByWeight(b.weight);

                  return (
                    <div
                      key={b.uniqueId}
                      className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between gap-3"
                    >
                      {/* 왼쪽 정보 */}
                      <div className="min-w-0">
                        {/* 1줄: 동물이름 + 소형/중형 */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-base font-extrabold text-gray-900 truncate">{b.petName}</div>

                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
                            {sizeText}
                          </span>

                          {b.status === "대기" ? (
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                              승인 필요
                            </span>
                          ) : b.status === "입실중" ? (
                            <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">
                              입실중
                            </span>
                          ) : null}
                        </div>

                        {/* 2줄: 이름 · 전화 */}
                        <div className="text-sm text-gray-700 mt-1">
                          {b.owner || "-"} · {b.phone || "-"}
                        </div>

                        {/* 3줄: 예약시간 + 기간 */}
                        <div className="text-xs text-gray-500 mt-1">
                          예약시간: {b.time || "-"} · {formatMMDD(b.checkIn)}~{formatMMDD(b.checkOut)}
                        </div>
                      </div>

                      {/* 오른쪽: 이벤트 타입 */}
                      <span
                        className={`h-fit px-3 py-1 rounded-full text-sm font-bold border whitespace-nowrap ${
                          b.type === "checkin"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : b.type === "checkout"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }`}
                      >
                        {b.type === "checkin" ? "입실" : b.type === "checkout" ? "퇴실" : "투숙"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 상세 모달 ── */}
      <Modal open={!!selectedBookingId && !!selectedBooking} title="상세 정보" onClose={() => setSelectedBookingId(null)}>
        {!selectedBooking ? (
          <div className="text-gray-500">상세 정보를 찾을 수 없습니다.</div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl font-extrabold text-gray-900">{selectedBooking.booking.owner || "이름없음"}</div>
                <div className="text-base text-gray-700 mt-1">
                  룸: <span className="font-bold">{selectedBooking.roomView.roomName}</span> · 칸:{" "}
                  <span className="font-bold">{selectedBooking.size}</span>
                </div>
              </div>

              <div
                className={`text-sm font-extrabold px-3 py-1 rounded-full border ${
                  selectedBooking.booking.status === "확정"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : selectedBooking.booking.status === "입실중"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {selectedBooking.booking.status}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="text-sm text-gray-600 font-bold">연락처</div>
                <div className="text-lg font-extrabold text-gray-900 mt-1">{selectedBooking.booking.phone || "-"}</div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="text-sm text-gray-600 font-bold">기간</div>
                <div className="text-lg font-extrabold text-gray-900 mt-1">
                  {formatMMDD(selectedBooking.booking.checkIn)} ~ {formatMMDD(selectedBooking.booking.checkOut)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {selectedBooking.booking.checkedInAt && `입실: ${safeTimeFromCreatedAt(selectedBooking.booking.checkedInAt)}`}
                  {selectedBooking.booking.checkedInAt && selectedBooking.booking.checkedOutAt && " · "}
                  {selectedBooking.booking.checkedOutAt && `퇴실: ${safeTimeFromCreatedAt(selectedBooking.booking.checkedOutAt)}`}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-sm text-gray-600 font-bold mb-2">강아지 목록</div>
                <div className="space-y-2">
                  {selectedBooking.booking.pets.map((p, idx) => (
                    <div
                      key={`${p.petId}-${idx}`}
                      className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-base font-extrabold text-gray-900">{p.petName}</div>
                      </div>
                      <div className="text-sm font-bold text-gray-700">{p.weight ? `${p.weight}kg` : "-"}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-3">* 스몰/중형 분류 기준: {SMALL_MAX_WEIGHT}kg 이하 = 스몰</div>
              </div>

              {/* ✅ 수용 초과 경고 */}
              {isOverCapacity && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-bold text-red-700">
                  현재 {selectedBooking.size} 수용 인원이 초과되어 있어 승인/체크인이 불가능합니다. (오버부킹 방지)
                </div>
              )}

              <div className="flex gap-3 mt-4">
                {selectedBooking.booking.status === "대기" && (
                  <button
                    onClick={() => updateStatus(selectedBooking.booking.bookingId, "confirmed")}
                    disabled={isOverCapacity}
                    className={`flex-1 rounded-xl py-3 text-base font-extrabold transition-colors shadow-sm ${isOverCapacity ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                  >
                    승인하기
                  </button>
                )}
                {selectedBooking.booking.status === "확정" && (
                  <button
                    onClick={() => updateStatus(selectedBooking.booking.bookingId, "checked_in")}
                    disabled={isOverCapacity}
                    className={`flex-1 rounded-xl py-3 text-base font-extrabold transition-colors shadow-sm ${isOverCapacity ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
                  >
                    체크인 처리
                  </button>
                )}
                {selectedBooking.booking.status === "입실중" && (
                  <button
                    onClick={() => updateStatus(selectedBooking.booking.bookingId, "checked_out")}
                    className="flex-1 bg-gray-800 text-white rounded-xl py-3 text-base font-extrabold hover:bg-gray-900 transition-colors shadow-sm"
                  >
                    체크아웃 처리
                  </button>
                )}
                <button
                  onClick={() => updateStatus(selectedBooking.booking.bookingId, "cancelled")}
                  className="flex-1 bg-red-50 text-red-600 border border-red-100 rounded-xl py-3 text-base font-extrabold hover:bg-red-100 transition-colors"
                >
                  예약 취소
                </button>
              </div>

              <button
                onClick={() => setSelectedBookingId(null)}
                className="w-full bg-gray-900 text-white rounded-xl py-3 text-base font-extrabold mt-3"
              >
                닫기
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}