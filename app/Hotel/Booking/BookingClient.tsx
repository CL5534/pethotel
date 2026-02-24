"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SMALL_MAX_WEIGHT = 7;

// ─── 타입 ────────────────────────────────────────
type RoomRow = {
  id: string;
  name: string;
  price: number;
  spec: string | null;
  small_capacity: number;
  large_capacity: number;
  image_url?: string | null;
  checkin_time?: string | null;
  checkout_time?: string | null;
  cancel_policy?: string | null;
};

type PetSize = "small" | "medium";

type PetRow = {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  breed: string | null;
  weight: number;
  size: PetSize | null;
  photo_url: string | null;
};

type DayCapRow = {
  day: string;
  small_left: number;
  medium_left: number;
  total_left: number;
  available: boolean;
};

// ✅ 객실별 캐시 타입
type CapCache = Record<string, DayCapRow[]>; // key = `${roomId}_${monthStart}`

// ─── 유틸 ────────────────────────────────────────
function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function monthEnd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatDateFull(s: string) {
  if (!s) return "";
  const d = new Date(`${s}T12:00:00`);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${
    ["일", "월", "화", "수", "목", "금", "토"][d.getDay()]
  })`;
}
function calcNights(s: string, e: string) {
  if (!s || !e) return 0;
  return Math.max(
    0,
    Math.round((+new Date(`${e}T12:00:00`) - +new Date(`${s}T12:00:00`)) / 86400000)
  );
}
function eachStayDays(ci: string, co: string) {
  if (!ci || !co) return [] as string[];
  const days: string[] = [];
  for (
    let d = new Date(`${ci}T12:00:00`);
    d < new Date(`${co}T12:00:00`);
    d = addDays(d, 1)
  )
    days.push(toYmd(d));
  return days;
}

// ✅ 버그 수정 핵심: 각 객실의 capRows로 독립 계산
function calcRoomRemaining(
  capRows: DayCapRow[],
  stayDays: string[]
): { small: number; medium: number; total: number } | null {
  if (!stayDays.length || !capRows.length) return null;
  const capMap = new Map(capRows.map((r) => [r.day, r]));
  let minS = Infinity,
    minM = Infinity,
    minT = Infinity;
  for (const day of stayDays) {
    const row = capMap.get(day);
    if (!row) return null;
    minS = Math.min(minS, row.small_left);
    minM = Math.min(minM, row.medium_left);
    minT = Math.min(minT, row.total_left);
  }
  return isFinite(minS) ? { small: minS, medium: minM, total: minT } : null;
}

const REQUEST_TAGS = [
  "사료 직접 가져갑니다",
  "약을 먹어야 해요",
  "분리불안이 있어요",
  "다른 강아지와 분리 부탁드려요",
  "산책 자주 부탁드려요",
  "겁이 많아요",
  "중성화 안 됐어요",
];

// ─── 전역 CSS ────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; }

  .rdp {
    --rdp-cell-size: 44px !important;
    margin: 0 !important;
    font-family: 'Noto Sans KR', sans-serif !important;
    width: 100% !important;
  }
  .rdp-month { width: 100% !important; }
  .rdp-table { width: 100% !important; max-width: none !important; }
  .rdp-day { font-size: 14px !important; font-weight: 600 !important; }
  .rdp-head_cell { font-size: 13px !important; font-weight: 800 !important; color: #9ca3af; }
  .rdp-caption_label { font-size: 17px !important; font-weight: 800 !important; color: #111827; }
  .rdp-nav_button { width: 36px !important; height: 36px !important; }
  .rdp-day_selected:not(.rdp-day_range_middle) { background-color: #2563eb !important; color: #fff !important; }
  .rdp-day_range_middle { background-color: #dbeafe !important; color: #1d4ed8 !important; border-radius: 0 !important; }
  .rdp-day_range_start, .rdp-day_range_end { border-radius: 50% !important; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .fadeUp { animation: fadeUp 0.3s ease both; }

  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.45} }
  .pulse  { animation: blink 1.5s ease infinite; }
  .urgent { animation: blink 1.1s ease infinite; }

  .room-card { transition: box-shadow 0.2s, transform 0.2s; }
  .room-card:hover:not(.room-full) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.13) !important; }
  .tag-btn { transition: all 0.15s; cursor: pointer; }
  .tag-btn:hover { transform: scale(1.04); }
  .pet-card { transition: all 0.18s; cursor: pointer; }
  .pet-card:hover { transform: translateY(-1px); }

  /* ✅ 데스크탑 2컬럼 레이아웃 */
  @media (min-width: 800px) {
    .step1-grid, .step2-grid {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 20px !important;
      align-items: start !important;
    }
    .step1-left { position: sticky; top: 20px; }
    .step2-left { position: sticky; top: 20px; }
  }
`;

// ─── 메인 컴포넌트 ───────────────────────────────
export default function BookingClient() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const [month, setMonth] = useState<Date>(new Date());
  const [range, setRange] = useState<DateRange | undefined>();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  // ✅ 객실별 독립 캐시
  const [capCache, setCapCache] = useState<CapCache>({});
  const [loadingRooms, setLoadingRooms] = useState<Set<string>>(new Set());

  const [pets, setPets] = useState<PetRow[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);

  const [requests, setRequests] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const today = useMemo(() => toYmd(new Date()), []);
  const nights = calcNights(checkIn, checkOut);
  const petCount = selectedPetIds.length;
  const room = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );
  const totalPrice = room ? room.price * nights * Math.max(1, petCount) : 0;

  // ─── 데이터 로드 ──────────────────────────────
  async function fetchRooms() {
    setRoomsLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setRooms([]);
      setRoomsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("rooms")
      .select("id, name, price, spec, small_capacity, large_capacity")
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error);
      setRooms([]);
    } else {
      const loaded = (data ?? []) as RoomRow[];
      setRooms(loaded);
      const p = searchParams.get("room");
      if (p !== null) {
        const idx = Number(p);
        if (Number.isFinite(idx) && loaded[idx]) setSelectedRoomId(loaded[idx].id);
      }
    }
    setRoomsLoading(false);
  }

  async function fetchMyPets() {
    setPetsLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setPets([]);
      setPetsLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("pets")
      .select("id, owner_id, name, type, breed, weight, size, photo_url")
      .eq("owner_id", auth.user.id)
      .order("created_at", { ascending: false });
    if (error) setPets([]);
    else setPets((data ?? []) as PetRow[]);
    setPetsLoading(false);
  }

  useEffect(() => {
    fetchRooms();
    fetchMyPets();
  }, []);

  // ✅ 모든 객실 잔여자리 병렬 fetch (객실별 독립 캐시)
  async function fetchAllCapacity(roomList: RoomRow[], targetMonth: Date) {
    if (!roomList.length) return;
    const startYmd = toYmd(monthStart(targetMonth));
    const endYmd = toYmd(monthEnd(targetMonth));

    const toLoad = roomList.filter((r) => !capCache[`${r.id}_${startYmd}`]);
    if (!toLoad.length) return;

    setLoadingRooms((prev) => {
      const s = new Set(prev);
      toLoad.forEach((r) => s.add(r.id));
      return s;
    });

    await Promise.all(
      toLoad.map(async (r) => {
        const { data, error } = await supabase.rpc("get_daily_capacity", {
          p_room_id: r.id,
          p_start: startYmd,
          p_end: endYmd,
          p_small_max_weight: SMALL_MAX_WEIGHT,
        });
        if (!error && data) {
          const rows: DayCapRow[] = (data as any[]).map((raw) => ({
            day: raw.day,
            small_left: raw.small_left,
            medium_left:
              typeof raw.medium_left === "number" ? raw.medium_left : raw.large_left ?? 0,
            total_left: raw.total_left,
            available: raw.available,
          }));
          setCapCache((prev) => ({ ...prev, [`${r.id}_${startYmd}`]: rows }));
        }
      })
    );

    setLoadingRooms((prev) => {
      const s = new Set(prev);
      toLoad.forEach((r) => s.delete(r.id));
      return s;
    });
  }

  useEffect(() => {
    if (rooms.length) fetchAllCapacity(rooms, month);
  }, [rooms, month]);

  // 특정 객실의 capRows
  function getRoomCapRows(roomId: string): DayCapRow[] {
    return capCache[`${roomId}_${toYmd(monthStart(month))}`] ?? [];
  }

  // 달력용: 선택된 객실 기준
  const selectedCapRows = useMemo(
    () => (selectedRoomId ? getRoomCapRows(selectedRoomId) : []),
    [selectedRoomId, capCache, month]
  );
  const disabledDays = useMemo(
    () => selectedCapRows.filter((r) => !r.available).map((r) => new Date(`${r.day}T12:00:00`)),
    [selectedCapRows]
  );
  const availableDays = useMemo(
    () => selectedCapRows.filter((r) => r.available).map((r) => new Date(`${r.day}T12:00:00`)),
    [selectedCapRows]
  );

  // ─── 날짜 선택 ────────────────────────────────
  function onPickRange(r: DateRange | undefined) {
    const todayDate = new Date(`${today}T12:00:00`);
    if (!r?.from || r.from < todayDate) {
      setRange(undefined);
      setCheckIn("");
      setCheckOut("");
      return;
    }
    if (r.from && !r.to) {
      setRange({ from: r.from });
      setCheckIn(toYmd(r.from));
      setCheckOut("");
      return;
    }
    if (r.from && r.to) {
      setRange(r);
      setCheckIn(toYmd(r.from));
      setCheckOut(toYmd(addDays(r.to, 1)));
    }
  }

  const stayDays = useMemo(() => eachStayDays(checkIn, checkOut), [checkIn, checkOut]);

  // ─── 펫 ───────────────────────────────────────
  function togglePet(id: string) {
    setSelectedPetIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }
  const selectedPets = useMemo(() => pets.filter((p) => selectedPetIds.includes(p.id)), [pets, selectedPetIds]);
  const selectedCountBySize = useMemo(() => {
    let small = 0,
      medium = 0;
    for (const p of selectedPets) {
      if (p.size === "small") small++;
      else if (p.size === "medium") medium++;
    }
    return { small, medium, total: small + medium };
  }, [selectedPets]);

  const remainingForStay = useMemo(() => {
    if (!selectedRoomId || !stayDays.length) return null;
    return calcRoomRemaining(getRoomCapRows(selectedRoomId), stayDays);
  }, [selectedRoomId, stayDays, capCache, month]);

  const isOverCapacity = useMemo(() => {
    if (!remainingForStay) return false;
    return (
      selectedCountBySize.small > remainingForStay.small ||
      selectedCountBySize.medium > remainingForStay.medium ||
      selectedCountBySize.total > remainingForStay.total
    );
  }, [remainingForStay, selectedCountBySize]);

  // ─── 태그 ─────────────────────────────────────
  function toggleTag(t: string) {
    setSelectedTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  }
  const finalRequests = [...selectedTags, ...(requests.trim() ? [requests.trim()] : [])].join(" / ");

  const canStep2 = !!selectedRoomId && !!checkIn && !!checkOut && nights > 0;
  const canStep3 = canStep2 && petCount > 0 && !isOverCapacity;
  const canSubmit = canStep3;

  // ─── 예약 제출 ────────────────────────────────
  async function handleSubmitBooking() {
    if (!canSubmit) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return alert("로그인이 필요합니다.");

    setSubmitting(true);
    try {
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          user_id: auth.user.id,
          pet_id: selectedPetIds[0],
          room_id: room!.id,
          check_in: checkIn,
          check_out: checkOut,
          total_price: totalPrice,
          status: "pending",
        })
        .select("id")
        .single();

      if (bookingErr) throw bookingErr;

      const { error: linkErr } = await supabase.from("booking_pets").insert(
        selectedPetIds.map((petId) => ({
          booking_id: booking.id,
          pet_id: petId,
        }))
      );

      if (linkErr) throw linkErr;

      setSubmitted(true);
    } catch (e: any) {
      console.error("Booking Error Details:", e);
      alert(`예약 중 오류가 발생했습니다: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  // ─── 완료 ─────────────────────────────────────
  if (submitted)
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div
          className="fadeUp"
          style={{
            fontFamily: "'Noto Sans KR',sans-serif",
            maxWidth: 520,
            margin: "0 auto",
            padding: "60px 20px",
            textAlign: "center",
            background: "#f8f7f4",
            minHeight: "100vh",
          }}
        >
          <div style={{ fontSize: 88, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: "#111827", margin: "0 0 12px" }}>
            예약 신청 완료!
          </h2>
          <p style={{ fontSize: 17, color: "#6b7280", lineHeight: 1.8, marginBottom: 6 }}>
            관리자 확인 후 카카오 알림 또는 문자로
            <br />
            예약 확정 안내를 드립니다.
          </p>
          <p style={{ fontSize: 15, color: "#9ca3af", marginBottom: 40 }}>보통 1~2시간 이내에 연락드려요.</p>
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 24,
              marginBottom: 32,
              boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
              textAlign: "left",
            }}
          >
            {[
              { icon: "🏠", label: "객실", val: room?.name ?? "" },
              { icon: "📅", label: "체크인", val: formatDateFull(checkIn) },
              { icon: "📅", label: "체크아웃", val: formatDateFull(checkOut) },
              { icon: "🌙", label: "숙박", val: `${nights}박` },
              { icon: "🐾", label: "반려동물", val: `${petCount}마리` },
              { icon: "💰", label: "결제예정", val: `₩${totalPrice.toLocaleString()}` },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: i < arr.length - 1 ? "1px solid #f3f4f6" : "none",
                }}
              >
                <span style={{ fontSize: 15, color: "#6b7280" }}>
                  {row.icon} {row.label}
                </span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{row.val}</span>
              </div>
            ))}
          </div>
          <a
            href="/Hotel/Mypage/Bookings"
            style={{
              display: "block",
              background: "#2563eb",
              color: "#fff",
              padding: 20,
              borderRadius: 16,
              fontSize: 20,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            📋 예약 내역 확인하기
          </a>
        </div>
      </>
    );

  // ─── 메인 렌더 ───────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {/* 아래 UI 렌더 부분은 너가 올린 그대로 이어서 두면 됨 */}
      {/* (메시지 길이 제한 때문에 여기 아래는 생략하지 않고 전부 붙여도 되는데,
          너가 이미 이 부분을 파일에 갖고 있으니 그대로 유지하면 된다) */}
    </>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────
function SectionCard({ step, desc, children }: { step: string; desc: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: "22px 20px",
        marginBottom: 16,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#111827" }}>{step}</div>
        {desc && <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function GuideBanner({ color, children }: { color: "blue" | "red" | "green"; children: React.ReactNode }) {
  const cfg = {
    blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
    red: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
    green: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  }[color];
  return (
    <div
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: 12,
        padding: "13px 15px",
        marginTop: 12,
        fontSize: 14,
        color: cfg.text,
        fontWeight: 600,
        lineHeight: 1.7,
      }}
    >
      {children}
    </div>
  );
}

function Chip({
  icon,
  label,
  color,
  urgent = false,
}: {
  icon: string;
  label: string;
  color: "gray" | "green" | "red";
  urgent?: boolean;
}) {
  const cfg = {
    gray: { bg: "#f3f4f6", text: "#4b5563" },
    green: { bg: "#dcfce7", text: "#15803d" },
    red: { bg: "#fee2e2", text: "#dc2626" },
  }[color];
  return (
    <span
      className={urgent ? "urgent" : ""}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: cfg.bg,
        color: cfg.text,
        borderRadius: 50,
        padding: "5px 11px",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {icon} {label}
    </span>
  );
}