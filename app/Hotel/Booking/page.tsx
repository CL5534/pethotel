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
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function addDays(d: Date, n: number) { const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function monthStart(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function monthEnd(d: Date)   { return new Date(d.getFullYear(), d.getMonth()+1, 0); }

function formatDateFull(s: string) {
  if (!s) return "";
  const d = new Date(`${s}T12:00:00`);
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${["일","월","화","수","목","금","토"][d.getDay()]})`;
}
function calcNights(s: string, e: string) {
  if (!s||!e) return 0;
  return Math.max(0, Math.round((+new Date(`${e}T12:00:00`) - +new Date(`${s}T12:00:00`)) / 86400000));
}
function eachStayDays(ci: string, co: string) {
  if (!ci||!co) return [] as string[];
  const days: string[]=[];
  for (let d=new Date(`${ci}T12:00:00`); d<new Date(`${co}T12:00:00`); d=addDays(d,1)) days.push(toYmd(d));
  return days;
}

// ✅ 버그 수정 핵심: 각 객실의 capRows로 독립 계산
function calcRoomRemaining(
  capRows: DayCapRow[],
  stayDays: string[]
): { small: number; medium: number; total: number } | null {
  if (!stayDays.length || !capRows.length) return null;
  const capMap = new Map(capRows.map((r) => [r.day, r]));
  let minS=Infinity, minM=Infinity, minT=Infinity;
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
  "사료 직접 가져갑니다","약을 먹어야 해요","분리불안이 있어요",
  "다른 강아지와 분리 부탁드려요","산책 자주 부탁드려요","겁이 많아요","중성화 안 됐어요",
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
export default function BookingPage() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState<string|null>(null);

  const [month, setMonth] = useState<Date>(new Date());
  const [range, setRange] = useState<DateRange|undefined>();
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
  const room = useMemo(() => rooms.find((r) => r.id === selectedRoomId) ?? null, [rooms, selectedRoomId]);
  const totalPrice = room ? room.price * nights * Math.max(1, petCount) : 0;

  // ─── 데이터 로드 ──────────────────────────────
  async function fetchRooms() {
    setRoomsLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setRooms([]); setRoomsLoading(false); return; }
    const { data, error } = await supabase
      .from("rooms")
      .select("id, name, price, spec, small_capacity, large_capacity")
      .order("created_at", { ascending: true });
    if (error) { console.error(error); setRooms([]); }
    else {
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
    if (!auth.user) { setPets([]); setPetsLoading(false); return; }
    const { data, error } = await supabase
      .from("pets")
      .select("id, owner_id, name, type, breed, weight, size, photo_url")
      .eq("owner_id", auth.user.id)
      .order("created_at", { ascending: false });
    if (error) setPets([]);
    else setPets((data ?? []) as PetRow[]);
    setPetsLoading(false);
  }

  useEffect(() => { fetchRooms(); fetchMyPets(); }, []);

  // ✅ 모든 객실 잔여자리 병렬 fetch (객실별 독립 캐시)
  async function fetchAllCapacity(roomList: RoomRow[], targetMonth: Date) {
    if (!roomList.length) return;
    const startYmd = toYmd(monthStart(targetMonth));
    const endYmd   = toYmd(monthEnd(targetMonth));

    const toLoad = roomList.filter((r) => !capCache[`${r.id}_${startYmd}`]);
    if (!toLoad.length) return;

    setLoadingRooms((prev) => { const s=new Set(prev); toLoad.forEach((r)=>s.add(r.id)); return s; });

    await Promise.all(toLoad.map(async (r) => {
      const { data, error } = await supabase.rpc("get_daily_capacity", {
        p_room_id: r.id, p_start: startYmd, p_end: endYmd,
        p_small_max_weight: SMALL_MAX_WEIGHT,
      });
      if (!error && data) {
        const rows: DayCapRow[] = (data as any[]).map((raw) => ({
          day:         raw.day,
          small_left:  raw.small_left,
          medium_left: typeof raw.medium_left==="number" ? raw.medium_left : (raw.large_left??0),
          total_left:  raw.total_left,
          available:   raw.available,
        }));
        setCapCache((prev) => ({ ...prev, [`${r.id}_${startYmd}`]: rows }));
      }
    }));

    setLoadingRooms((prev) => { const s=new Set(prev); toLoad.forEach((r)=>s.delete(r.id)); return s; });
  }

  useEffect(() => {
    if (rooms.length) fetchAllCapacity(rooms, month);
  }, [rooms, month]);

  // 특정 객실의 capRows
  function getRoomCapRows(roomId: string): DayCapRow[] {
    return capCache[`${roomId}_${toYmd(monthStart(month))}`] ?? [];
  }

  // 달력용: 선택된 객실 기준
  const selectedCapRows = useMemo(() => selectedRoomId ? getRoomCapRows(selectedRoomId) : [], [selectedRoomId, capCache, month]);
  const disabledDays = useMemo(() => selectedCapRows.filter((r)=>!r.available).map((r)=>new Date(`${r.day}T12:00:00`)), [selectedCapRows]);
  const availableDays = useMemo(() => selectedCapRows.filter((r)=>r.available).map((r)=>new Date(`${r.day}T12:00:00`)), [selectedCapRows]);

  // ─── 날짜 선택 ────────────────────────────────
  function onPickRange(r: DateRange|undefined) {
    const todayDate = new Date(`${today}T12:00:00`);
    if (!r?.from || r.from < todayDate) { setRange(undefined); setCheckIn(""); setCheckOut(""); return; }
    if (r.from && !r.to) { setRange({from:r.from}); setCheckIn(toYmd(r.from)); setCheckOut(""); return; }
    if (r.from && r.to)  { setRange(r); setCheckIn(toYmd(r.from)); setCheckOut(toYmd(addDays(r.to,1))); }
  }

  const stayDays = useMemo(() => eachStayDays(checkIn, checkOut), [checkIn, checkOut]);

  // ─── 펫 ───────────────────────────────────────
  function togglePet(id: string) { setSelectedPetIds((p)=>p.includes(id)?p.filter((x)=>x!==id):[...p,id]); }
  const selectedPets = useMemo(() => pets.filter((p)=>selectedPetIds.includes(p.id)), [pets,selectedPetIds]);
  const selectedCountBySize = useMemo(() => {
    let small=0, medium=0;
    for (const p of selectedPets) { if(p.size==="small") small++; else if(p.size==="medium") medium++; }
    return { small, medium, total: small+medium };
  }, [selectedPets]);

  const remainingForStay = useMemo(() => {
    if (!selectedRoomId || !stayDays.length) return null;
    return calcRoomRemaining(getRoomCapRows(selectedRoomId), stayDays);
  }, [selectedRoomId, stayDays, capCache, month]);

  const isOverCapacity = useMemo(() => {
    if (!remainingForStay) return false;
    return selectedCountBySize.small>remainingForStay.small || selectedCountBySize.medium>remainingForStay.medium || selectedCountBySize.total>remainingForStay.total;
  }, [remainingForStay, selectedCountBySize]);

  // ─── 태그 ─────────────────────────────────────
  function toggleTag(t: string) { setSelectedTags((p)=>p.includes(t)?p.filter((x)=>x!==t):[...p,t]); }
  const finalRequests = [...selectedTags, ...(requests.trim()?[requests.trim()]:[])].join(" / ");

  const canStep2  = !!selectedRoomId && !!checkIn && !!checkOut && nights>0;
  const canStep3  = canStep2 && petCount>0 && !isOverCapacity;
  const canSubmit = canStep3;

  // ─── 예약 제출 ────────────────────────────────
// 🚀 예약 제출 (에러 해결 버전)
// 🚀 예약 제출 (에러 해결 버전)
  async function handleSubmitBooking() {
    if (!canSubmit) return;
    
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return alert("로그인이 필요합니다.");

    setSubmitting(true);
    try {
      // 1. bookings 테이블 삽입
      // ✅ requests 컬럼 제거 (DB에 없음)
      // ✅ status를 "pending"으로 수정 (DB 제약 조건 일치)
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

      // 2. 여러 마리일 경우 중간 테이블(booking_pets)에 기록
      const { error: linkErr } = await supabase
        .from("booking_pets")
        .insert(selectedPetIds.map((petId) => ({
          booking_id: booking.id, 
          pet_id: petId
        })));

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
  if (submitted) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="fadeUp" style={{ fontFamily:"'Noto Sans KR',sans-serif", maxWidth:520, margin:"0 auto", padding:"60px 20px", textAlign:"center", background:"#f8f7f4", minHeight:"100vh" }}>
        <div style={{ fontSize:88, marginBottom:20 }}>🎉</div>
        <h2 style={{ fontSize:30, fontWeight:900, color:"#111827", margin:"0 0 12px" }}>예약 신청 완료!</h2>
        <p style={{ fontSize:17, color:"#6b7280", lineHeight:1.8, marginBottom:6 }}>관리자 확인 후 카카오 알림 또는 문자로<br/>예약 확정 안내를 드립니다.</p>
        <p style={{ fontSize:15, color:"#9ca3af", marginBottom:40 }}>보통 1~2시간 이내에 연락드려요.</p>
        <div style={{ background:"#fff", borderRadius:20, padding:24, marginBottom:32, boxShadow:"0 2px 16px rgba(0,0,0,0.08)", textAlign:"left" }}>
          {[{icon:"🏠",label:"객실",val:room?.name??""},{icon:"📅",label:"체크인",val:formatDateFull(checkIn)},{icon:"📅",label:"체크아웃",val:formatDateFull(checkOut)},{icon:"🌙",label:"숙박",val:`${nights}박`},{icon:"🐾",label:"반려동물",val:`${petCount}마리`},{icon:"💰",label:"결제예정",val:`₩${totalPrice.toLocaleString()}`}].map((row,i,arr)=>(
            <div key={row.label} style={{display:"flex",justifyContent:"space-between",padding:"12px 0",borderBottom:i<arr.length-1?"1px solid #f3f4f6":"none"}}>
              <span style={{fontSize:15,color:"#6b7280"}}>{row.icon} {row.label}</span>
              <span style={{fontSize:16,fontWeight:700,color:"#111827"}}>{row.val}</span>
            </div>
          ))}
        </div>
        <a href="/Hotel/Mypage/Bookings" style={{display:"block",background:"#2563eb",color:"#fff",padding:20,borderRadius:16,fontSize:20,fontWeight:800,textDecoration:"none"}}>📋 예약 내역 확인하기</a>
      </div>
    </>
  );

  // ─── 메인 렌더 ───────────────────────────────
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ fontFamily:"'Noto Sans KR',sans-serif", maxWidth:1100, margin:"0 auto", padding:"24px 20px 80px", background:"#f8f7f4", minHeight:"100vh" }}>

        {/* 헤더 */}
        <div className="fadeUp" style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:34, marginBottom:4 }}>🐾</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:"#111827", margin:0 }}>펫 호텔 예약</h1>
          <p style={{ fontSize:14, color:"#9ca3af", marginTop:4 }}>간편하게 2단계로 예약하세요</p>
        </div>

        {/* 단계 바 */}
        <div className="fadeUp" style={{ display:"flex", gap:8, maxWidth:600, margin:"0 auto 24px" }}>
          {[{n:1,label:"날짜·객실 선택"},{n:2,label:"반려동물·요청사항"},{n:3,label:"최종 확인"}].map(({n,label})=>{
            const active=step===n, done=step>n;
            return (
              <div key={n} style={{ flex:1, padding:"11px 8px", textAlign:"center", borderRadius:12, background:done?"#dbeafe":active?"#2563eb":"#e9e9e9", color:done?"#1d4ed8":active?"#fff":"#9ca3af", fontSize:14, fontWeight:800, transition:"all 0.3s" }}>
                {done?`✓ ${label}`:`${n}. ${label}`}
              </div>
            );
          })}
        </div>

        {/* ══ STEP 1 ══ */}
        {step === 1 && (
          <div className="fadeUp step1-grid" style={{ display:"flex", flexDirection:"column", gap:16 }}>

            {/* 왼쪽: 달력 */}
            <div className="step1-left">
              <SectionCard step="① 날짜를 선택하세요" desc="체크인 날짜를 누르고, 이어서 체크아웃 날짜를 눌러주세요.">
                <div style={{ display:"flex", gap:14, marginBottom:12, flexWrap:"wrap" }}>
                  {[{color:"rgba(37,99,235,0.18)",label:"예약 가능"},{color:"rgba(107,114,128,0.22)",label:"마감"}].map((l)=>(
                    <span key={l.label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:13, color:"#6b7280" }}>
                      <span style={{ width:13, height:13, borderRadius:3, background:l.color, display:"inline-block" }}/>{l.label}
                    </span>
                  ))}
                  {loadingRooms.size>0 && <span className="pulse" style={{fontSize:13,color:"#9ca3af"}}>자리 확인 중…</span>}
                </div>

                <div style={{ width:"100%" }}>
                  <DayPicker
                    mode="range" month={month} onMonthChange={setMonth}
                    selected={range} onSelect={onPickRange}
                    disabled={[{before:new Date(`${today}T00:00:00`)}, ...(selectedRoomId?disabledDays:[])]}
                    modifiers={{ available:availableDays, full:disabledDays }}
                    modifiersStyles={{
                      available:{backgroundColor:"rgba(37,99,235,0.14)",borderRadius:8},
                      full:{backgroundColor:"rgba(107,114,128,0.18)",borderRadius:8,color:"rgba(107,114,128,0.7)"},
                    }}
                  />
                </div>

                {!checkIn && <GuideBanner color="blue">📌 달력에서 체크인 날짜를 눌러주세요.</GuideBanner>}
                {checkIn && !checkOut && (
                  <GuideBanner color="blue">✅ 체크인: <b>{formatDateFull(checkIn)}</b><br/>이제 체크아웃 날짜를 눌러주세요.</GuideBanner>
                )}
                {checkIn && checkOut && (
                  <div style={{ background:"#f0fdf4", border:"2px solid #bbf7d0", borderRadius:12, padding:"14px 16px", marginTop:12 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:"#15803d", marginBottom:10 }}>✅ 선택된 날짜</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, textAlign:"center" }}>
                      {[{label:"체크인",val:formatDateFull(checkIn)},{label:"체크아웃",val:formatDateFull(checkOut)},{label:"숙박",val:`${nights}박`}].map((item)=>(
                        <div key={item.label} style={{ background:"#fff", borderRadius:10, padding:"10px 4px" }}>
                          <div style={{ fontSize:11, color:"#6b7280", marginBottom:3 }}>{item.label}</div>
                          <div style={{ fontSize:13, fontWeight:800, color:"#111827", wordBreak:"keep-all" }}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!selectedRoomId && (
                  <div style={{ marginTop:12, fontSize:13, color:"#9ca3af", textAlign:"center" }}>
                    👉 오른쪽에서 객실을 선택하면 달력에 잔여자리가 표시됩니다.
                  </div>
                )}
              </SectionCard>
            </div>

            {/* 오른쪽: 객실 목록 */}
            <div className="step1-right">
              <SectionCard
                step="② 객실을 선택하세요"
                desc={checkIn&&checkOut ? "이 기간 예약 가능한 자리 수를 확인하세요." : "날짜를 먼저 선택하면 실시간 잔여 자리를 볼 수 있어요."}
              >
                {roomsLoading && <div className="pulse" style={{color:"#9ca3af",fontSize:15,padding:"20px 0",textAlign:"center"}}>객실 불러오는 중…</div>}
                {!roomsLoading && rooms.length===0 && <div style={{color:"#9ca3af",fontSize:15,padding:"20px 0",textAlign:"center"}}>등록된 객실이 없습니다.</div>}

                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {rooms.map((r) => {
                    const isSelected = selectedRoomId===r.id;
                    const isLoadingThis = loadingRooms.has(r.id);
                    // ✅ 각 객실 독립 계산
                    const roomCapRows   = getRoomCapRows(r.id);
                    const stayRemaining = calcRoomRemaining(roomCapRows, stayDays);
                    const isFull = !!(checkIn && checkOut && stayRemaining!==null && stayRemaining.total<=0);

                    return (
                      <div key={r.id} className={`room-card${isFull?" room-full":""}`}
                        onClick={()=>{ if(!isFull) setSelectedRoomId(r.id); }}
                        style={{ background:isFull?"#f9fafb":isSelected?"#eff6ff":"#fff", borderRadius:16, border:`2.5px solid ${isSelected?"#2563eb":isFull?"#e5e7eb":"#e9e9e9"}`, overflow:"hidden", cursor:isFull?"not-allowed":"pointer", opacity:isFull?0.55:1, boxShadow:isSelected?"0 4px 20px rgba(37,99,235,0.18)":"0 2px 8px rgba(0,0,0,0.06)" }}
                      >
                        {r.image_url && (
                          <div style={{ position:"relative", height:140, overflow:"hidden" }}>
                            <img src={r.image_url} alt={r.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                            {isSelected && <div style={{ position:"absolute", top:10, right:10, background:"#2563eb", color:"#fff", borderRadius:20, padding:"4px 12px", fontSize:13, fontWeight:700 }}>✓ 선택됨</div>}
                            {isFull && <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#fff" }}>이 기간 마감</div>}
                          </div>
                        )}

                        <div style={{ padding:"14px 16px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                            <div>
                              <div style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{r.name}</div>
                              {r.spec && <div style={{ fontSize:13, color:"#6b7280", marginTop:2 }}>{r.spec}</div>}
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0, marginLeft:10 }}>
                              <div style={{ fontSize:20, fontWeight:900, color:"#2563eb" }}>₩{r.price.toLocaleString()}</div>
                              <div style={{ fontSize:11, color:"#9ca3af" }}>1박/1마리</div>
                            </div>
                          </div>

                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:4 }}>
                            <Chip icon="🐶" label={`소형 최대 ${r.small_capacity}`} color="gray"/>
                            <Chip icon="🐕" label={`중형 최대 ${r.large_capacity}`} color="gray"/>
                          </div>

                          {checkIn && checkOut && (
                            isLoadingThis ? (
                              <div className="pulse" style={{ fontSize:13, color:"#9ca3af", marginTop:4 }}>자리 확인 중…</div>
                            ) : stayRemaining && !isFull ? (
                              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
                                <Chip icon="🐶" label={`소형 ${stayRemaining.small}자리 남음`} color={stayRemaining.small<=2?"red":"green"} urgent={stayRemaining.small<=1}/>
                                <Chip icon="🐕" label={`중형 ${stayRemaining.medium}자리 남음`} color={stayRemaining.medium<=2?"red":"green"} urgent={stayRemaining.medium<=1}/>
                              </div>
                            ) : roomCapRows.length===0 ? (
                              <div style={{ fontSize:13, color:"#9ca3af", marginTop:4 }}>자리 정보 없음</div>
                            ) : null
                          )}

                          {(r.checkin_time||r.checkout_time) && (
                            <div style={{ marginTop:10, paddingTop:10, borderTop:"1px solid #f3f4f6", display:"flex", gap:14, flexWrap:"wrap" }}>
                              {r.checkin_time  && <span style={{fontSize:13,color:"#6b7280"}}>🔑 체크인 <b>{r.checkin_time}</b></span>}
                              {r.checkout_time && <span style={{fontSize:13,color:"#6b7280"}}>🚪 체크아웃 <b>{r.checkout_time}</b></span>}
                            </div>
                          )}
                          {r.cancel_policy && (
                            <div style={{ marginTop:8, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, padding:"7px 10px", fontSize:12, color:"#92400e" }}>⚠️ {r.cancel_policy}</div>
                          )}
                          {!isSelected && !isFull && (
                            <div style={{ marginTop:12, textAlign:"center", color:"#2563eb", fontSize:14, fontWeight:700 }}>→ 이 객실 선택하기</div>
                          )}
                          {isSelected && (
                            <div style={{ marginTop:12, textAlign:"center", background:"#2563eb", color:"#fff", borderRadius:10, padding:8, fontSize:14, fontWeight:700 }}>✓ 선택된 객실</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* 다음 버튼 (step1) */}
        {step===1 && (
          <div style={{ maxWidth:480, margin:"16px auto 0" }}>
            <button onClick={()=>setStep(2)} disabled={!canStep2} style={{ width:"100%", padding:"20px 0", background:canStep2?"#2563eb":"#d1d5db", color:canStep2?"#fff":"#9ca3af", border:"none", borderRadius:16, fontSize:20, fontWeight:800, cursor:canStep2?"pointer":"not-allowed", transition:"background 0.2s" }}>
              다음 단계 →
            </button>
            {!canStep2 && (
              <p style={{ textAlign:"center", fontSize:14, color:"#9ca3af", marginTop:8 }}>
                {(!checkIn||!checkOut)?"날짜를 선택해주세요":!selectedRoomId?"객실을 선택해주세요":""}
              </p>
            )}
          </div>
        )}

        {/* ══ STEP 2 — 펫 + 요청사항 2컬럼 ══ */}
        {step===2 && (
          <div className="fadeUp">

            {/* 상단 요약 배너 */}
            <div style={{ background:"#2563eb", borderRadius:18, padding:"16px 20px", marginBottom:20, color:"#fff", maxWidth:1100, margin:"0 auto 20px" }}>
              <div style={{ fontSize:12, opacity:0.75, marginBottom:5 }}>선택한 예약 정보</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:800 }}>{room?.name}</div>
                  <div style={{ fontSize:14, opacity:0.85, marginTop:2 }}>{formatDateFull(checkIn)} → {formatDateFull(checkOut)} · {nights}박</div>
                </div>
                <button onClick={()=>setStep(1)} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", borderRadius:10, padding:"8px 14px", fontSize:14, fontWeight:700, cursor:"pointer" }}>수정</button>
              </div>
            </div>

            {/* 2컬럼 그리드 */}
            <div className="step2-grid" style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* 왼쪽: 펫 선택 */}
              <div className="step2-left">
                <SectionCard step="① 함께할 반려동물을 선택하세요" desc="함께 묵을 강아지를 눌러주세요. 여러 마리도 선택 가능해요.">
                  {remainingForStay && (
                    <div style={{ background:"#f0fdf4", border:"1.5px solid #bbf7d0", borderRadius:12, padding:"12px 16px", marginBottom:16, fontSize:14, color:"#15803d", fontWeight:600 }}>
                      이 기간 남은 자리: 소형 {remainingForStay.small}마리 / 중형 {remainingForStay.medium}마리
                    </div>
                  )}
                  {petsLoading && <div className="pulse" style={{color:"#9ca3af",fontSize:15,padding:"16px 0",textAlign:"center"}}>불러오는 중…</div>}
                  {!petsLoading && pets.length===0 && (
                    <div style={{ textAlign:"center", padding:"20px 0" }}>
                      <div style={{ fontSize:15, color:"#9ca3af", marginBottom:12 }}>등록된 반려동물이 없어요.</div>
                      <a href="/Hotel/Mypage/Pets" style={{ display:"inline-block", background:"#2563eb", color:"#fff", padding:"12px 24px", borderRadius:12, fontSize:15, fontWeight:700, textDecoration:"none" }}>+ 반려동물 등록하기</a>
                    </div>
                  )}
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {pets.map((p) => {
                      const selected = selectedPetIds.includes(p.id);
                      const sizeLabel = p.size==="small"?"소형 🐶":p.size==="medium"?"중형 🐕":"미설정";
                      return (
                        <div key={p.id} className="pet-card" onClick={()=>togglePet(p.id)} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 18px", borderRadius:16, border:`2.5px solid ${selected?"#2563eb":"#e5e7eb"}`, background:selected?"#eff6ff":"#fafafa" }}>
                          <div style={{ width:56, height:56, borderRadius:"50%", background:"#dbeafe", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>
                            {p.photo_url ? <img src={p.photo_url} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : "🐾"}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:18, fontWeight:800, color:"#111827" }}>{p.name}</div>
                            <div style={{ fontSize:14, color:"#6b7280", marginTop:2 }}>{p.breed??"품종 미입력"} · {p.weight}kg · {sizeLabel}</div>
                          </div>
                          <div style={{ width:30, height:30, borderRadius:"50%", border:`2.5px solid ${selected?"#2563eb":"#d1d5db"}`, background:selected?"#2563eb":"#fff", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:15, fontWeight:800, flexShrink:0, transition:"all 0.2s" }}>
                            {selected?"✓":""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {pets.length>0 && <a href="/Hotel/Mypage/Pets" style={{ display:"block", marginTop:14, color:"#2563eb", fontSize:15, fontWeight:600, textDecoration:"none" }}>+ 다른 반려동물 등록하기</a>}
                  {isOverCapacity && <GuideBanner color="red">❌ 선택한 반려동물이 이 기간의 남은 자리를 초과했어요.<br/>소형·중형 남은 자리를 확인해주세요.</GuideBanner>}
                </SectionCard>
              </div>

              {/* 오른쪽: 요청사항 */}
              <div>
                <SectionCard step="② 요청사항을 알려주세요" desc="해당하는 항목을 눌러주세요. (선택)">
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
                    {REQUEST_TAGS.map((tag) => {
                      const on = selectedTags.includes(tag);
                      return (
                        <button key={tag} className="tag-btn" onClick={()=>toggleTag(tag)} style={{ padding:"10px 16px", borderRadius:50, border:`2px solid ${on?"#2563eb":"#e5e7eb"}`, background:on?"#2563eb":"#fff", color:on?"#fff":"#374151", fontSize:14, fontWeight:600 }}>
                          {on?"✓ ":""}{tag}
                        </button>
                      );
                    })}
                  </div>
                  <textarea value={requests} onChange={(e)=>setRequests(e.target.value)} placeholder="그 외 추가로 전달할 내용을 적어주세요." style={{ width:"100%", padding:"14px 16px", border:"1.5px solid #e5e7eb", borderRadius:12, fontSize:16, color:"#111827", minHeight:120, resize:"none", outline:"none", boxSizing:"border-box", lineHeight:1.6, fontFamily:"'Noto Sans KR',sans-serif" }}/>
                </SectionCard>

                {/* 선택 요약 미리보기 (오른쪽 하단) */}
                {petCount > 0 && (
                  <div style={{ background:"#fff", borderRadius:16, padding:"18px 20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize:15, fontWeight:800, color:"#111827", marginBottom:12 }}>📋 현재 선택 요약</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:14 }}>
                        <span style={{ color:"#6b7280" }}>반려동물</span>
                        <span style={{ fontWeight:700, color:"#111827" }}>{petCount}마리 (소형 {selectedCountBySize.small} / 중형 {selectedCountBySize.medium})</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:14 }}>
                        <span style={{ color:"#6b7280" }}>예상 금액</span>
                        <span style={{ fontWeight:800, color:"#2563eb" }}>₩{totalPrice.toLocaleString()}</span>
                      </div>
                      {selectedTags.length>0 && (
                        <div style={{ marginTop:4 }}>
                          <div style={{ fontSize:13, color:"#6b7280", marginBottom:6 }}>선택한 요청사항</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {selectedTags.map((t)=>(
                              <span key={t} style={{ background:"#dbeafe", color:"#1d4ed8", borderRadius:50, padding:"3px 10px", fontSize:12, fontWeight:600 }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div style={{ display:"flex", gap:12, marginTop:20, maxWidth:480, margin:"20px auto 0" }}>
              <button onClick={()=>setStep(1)} style={{ flex:1, padding:"18px 0", background:"#fff", color:"#4b5563", border:"2px solid #e5e7eb", borderRadius:16, fontSize:17, fontWeight:700, cursor:"pointer" }}>← 이전</button>
              <button onClick={()=>setStep(3)} disabled={!canStep3} style={{ flex:2, padding:"18px 0", background:canStep3?"#2563eb":"#d1d5db", color:canStep3?"#fff":"#9ca3af", border:"none", borderRadius:16, fontSize:19, fontWeight:800, cursor:canStep3?"pointer":"not-allowed", transition:"background 0.2s" }}>
                다음 단계 →
              </button>
            </div>
            {!canStep3 && (
              <p style={{ textAlign:"center", fontSize:14, color:"#9ca3af", marginTop:8 }}>
                {petCount===0?"반려동물을 1마리 이상 선택해주세요.":isOverCapacity?"선택한 반려동물 수가 남은 자리를 초과했어요.":""}
              </p>
            )}
          </div>
        )}

        {/* ══ STEP 3 — 최종 확인 ══ */}
        {step===3 && (
          <div className="fadeUp" style={{ maxWidth:640, margin:"0 auto" }}>

            {/* 상단 요약 배너 */}
            <div style={{ background:"#2563eb", borderRadius:18, padding:"16px 20px", marginBottom:20, color:"#fff" }}>
              <div style={{ fontSize:12, opacity:0.75, marginBottom:5 }}>선택한 예약 정보</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ fontSize:17, fontWeight:800 }}>{room?.name} · {petCount}마리</div>
                  <div style={{ fontSize:14, opacity:0.85, marginTop:2 }}>{formatDateFull(checkIn)} → {formatDateFull(checkOut)} · {nights}박</div>
                </div>
                <button onClick={()=>setStep(2)} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", borderRadius:10, padding:"8px 14px", fontSize:14, fontWeight:700, cursor:"pointer" }}>수정</button>
              </div>
            </div>

            {/* 최종 확인 카드 */}
            <SectionCard step="✅ 최종 예약 내용 확인" desc="아래 내용이 맞으면 예약 신청 버튼을 눌러주세요.">
              {[
                {icon:"🏠",label:"객실",       val:room?.name??""},
                {icon:"📅",label:"체크인",     val:formatDateFull(checkIn)},
                {icon:"📅",label:"체크아웃",   val:formatDateFull(checkOut)},
                {icon:"🌙",label:"숙박",       val:`${nights}박`},
                {icon:"🐾",label:"반려동물",   val:petCount>0?`${petCount}마리 (소형 ${selectedCountBySize.small} / 중형 ${selectedCountBySize.medium})`:"선택 안됨"},
                ...(finalRequests?[{icon:"💬",label:"요청사항",val:finalRequests}]:[]),
              ].map((row,i,arr)=>(
                <div key={row.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"14px 0", borderBottom:i<arr.length-1?"1px solid #f3f4f6":"none", gap:12 }}>
                  <span style={{ fontSize:15, color:"#6b7280", flexShrink:0 }}>{row.icon} {row.label}</span>
                  <span style={{ fontSize:15, fontWeight:700, color:"#111827", textAlign:"right", wordBreak:"keep-all" }}>{row.val}</span>
                </div>
              ))}

              {/* 금액 강조 */}
              <div style={{ marginTop:16, background:"#eff6ff", borderRadius:14, padding:"20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:15, color:"#3b82f6", fontWeight:700 }}>💰 총 결제 예정 금액</div>
                  <div style={{ fontSize:13, color:"#93c5fd", marginTop:4 }}>₩{room?.price.toLocaleString()} × {nights}박 × {Math.max(1,petCount)}마리</div>
                </div>
                <div style={{ fontSize:30, fontWeight:900, color:"#2563eb" }}>₩{totalPrice.toLocaleString()}</div>
              </div>

              {room?.cancel_policy && (
                <div style={{ marginTop:12, background:"#fffbeb", border:"1px solid #fde68a", borderRadius:12, padding:"12px 16px", fontSize:14, color:"#92400e" }}>
                  ⚠️ 취소 정책: {room.cancel_policy}
                </div>
              )}

              <div style={{ marginTop:16, background:"#f8fafc", borderRadius:12, padding:"14px 16px", fontSize:13, color:"#6b7280", lineHeight:1.7 }}>
                📌 예약 신청 후 관리자 확인이 완료되면 알림을 드립니다.<br/>
                보통 1~2시간 이내 연락드려요.
              </div>
            </SectionCard>

            {/* 하단 버튼 */}
            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <button onClick={()=>setStep(2)} style={{ flex:1, padding:"18px 0", background:"#fff", color:"#4b5563", border:"2px solid #e5e7eb", borderRadius:16, fontSize:17, fontWeight:700, cursor:"pointer" }}>← 이전</button>
              <button onClick={handleSubmitBooking} disabled={!canSubmit||submitting} style={{ flex:2, padding:"20px 0", background:(!canSubmit||submitting)?"#93c5fd":"#2563eb", color:"#fff", border:"none", borderRadius:16, fontSize:20, fontWeight:800, cursor:(!canSubmit||submitting)?"not-allowed":"pointer", transition:"background 0.2s" }}>
                {submitting?"⏳ 처리 중...":"🐾 예약 신청하기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────
function SectionCard({ step, desc, children }: { step:string; desc:string; children:React.ReactNode }) {
  return (
    <div style={{ background:"#fff", borderRadius:20, padding:"22px 20px", marginBottom:16, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:17, fontWeight:800, color:"#111827" }}>{step}</div>
        {desc && <div style={{ fontSize:13, color:"#6b7280", marginTop:4 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function GuideBanner({ color, children }: { color:"blue"|"red"|"green"; children:React.ReactNode }) {
  const cfg = { blue:{bg:"#eff6ff",border:"#bfdbfe",text:"#1d4ed8"}, red:{bg:"#fef2f2",border:"#fecaca",text:"#dc2626"}, green:{bg:"#f0fdf4",border:"#bbf7d0",text:"#15803d"} }[color];
  return (
    <div style={{ background:cfg.bg, border:`1.5px solid ${cfg.border}`, borderRadius:12, padding:"13px 15px", marginTop:12, fontSize:14, color:cfg.text, fontWeight:600, lineHeight:1.7 }}>
      {children}
    </div>
  );
}

function Chip({ icon, label, color, urgent=false }: { icon:string; label:string; color:"gray"|"green"|"red"; urgent?:boolean }) {
  const cfg = { gray:{bg:"#f3f4f6",text:"#4b5563"}, green:{bg:"#dcfce7",text:"#15803d"}, red:{bg:"#fee2e2",text:"#dc2626"} }[color];
  return (
    <span className={urgent?"urgent":""} style={{ display:"inline-flex", alignItems:"center", gap:4, background:cfg.bg, color:cfg.text, borderRadius:50, padding:"5px 11px", fontSize:13, fontWeight:600 }}>
      {icon} {label}
    </span>
  );
}