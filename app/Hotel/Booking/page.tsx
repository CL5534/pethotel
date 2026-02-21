"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BOOKED_DATES = ["2025-02-10", "2025-02-11", "2025-02-15", "2025-02-20", "2025-02-21"];

type RoomRow = {
  id: string;        // ✅ uuid (rooms.id)
  name: string;
  price: number;
  spec: string | null;
};

type PetRow = {
  id: string;
  owner_id: string;
  name: string;
  type: string;
  breed: string | null;
  weight: number;
  photo_url: string | null;
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// 날짜 계산이 하루씩 어긋나는 문제 방지용(타임존)
function calcNights(start: string, end: string) {
  if (!start || !end) return 0;
  const s = new Date(`${start}T12:00:00`).getTime();
  const e = new Date(`${end}T12:00:00`).getTime();
  const diff = e - s;
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export default function BookingPage() {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1);

  // ✅ rooms를 DB에서 가져옴
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // ✅ 객실 선택은 index(uiId)로 관리 (URL ?room=0 / ?room=1)
  const [selectedRoomUiId, setSelectedRoomUiId] = useState<number | null>(null);

  // ✅ DB에서 가져온 내 펫 목록
  const [pets, setPets] = useState<PetRow[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);

  // ✅ 여러 마리 선택 (id 배열)
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [requests, setRequests] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const nights = calcNights(checkIn, checkOut);
  const petCount = selectedPetIds.length;

  const canNext1 = selectedRoomUiId !== null;
  const canNext2 = petCount > 0 && checkIn && checkOut && nights > 0;

  const petCountLabel = petCount > 0 ? `${petCount}견` : "";

  const room = useMemo(() => {
    if (selectedRoomUiId === null) return null;
    return rooms[selectedRoomUiId] ?? null;
  }, [rooms, selectedRoomUiId]);

  // ✅ 2마리면 2배 (1마리면 1배)
  const totalPrice = room ? room.price * nights * Math.max(1, petCount) : 0;

  // ✅ URL ?room=0 / ?room=1 받아서 자동 선택
  useEffect(() => {
    const roomParam = searchParams.get("room");
    if (roomParam === null) return;
    const uiId = Number(roomParam);
    if (!Number.isFinite(uiId)) return;
    setSelectedRoomUiId(uiId);
  }, [searchParams]);

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
      .select("id, name, price, spec")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      alert("객실 목록 조회 실패");
      setRooms([]);
    } else {
      setRooms((data ?? []) as RoomRow[]);
    }

    setRoomsLoading(false);
  }

  async function fetchMyPets() {
    setPetsLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setPets([]);
      setSelectedPetIds([]);
      setPetsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("pets")
      .select("id, owner_id, name, type, breed, weight, photo_url")
      .eq("owner_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("내 펫 목록 조회 실패");
      setPets([]);
      setSelectedPetIds([]);
    } else {
      setPets((data ?? []) as PetRow[]);
    }

    setPetsLoading(false);
  }

  useEffect(() => {
    fetchRooms();
    fetchMyPets();
  }, []);

  function togglePet(petId: string) {
    setSelectedPetIds((prev) => {
      if (prev.includes(petId)) return prev.filter((id) => id !== petId);
      return [...prev, petId];
    });
  }

  // ✅ 예약 저장: bookings 1건 + booking_pets 여러 건
  async function handleSubmitBooking() {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!room) {
      alert("객실을 선택하세요.");
      return;
    }

    if (selectedPetIds.length === 0) {
      alert("반려동물을 1마리 이상 선택하세요.");
      return;
    }

    if (!checkIn || !checkOut || nights <= 0) {
      alert("날짜를 올바르게 선택하세요.");
      return;
    }

    try {
      // (디버그) 실제로 어떤 값이 들어가는지 확인
      console.log("booking insert payload:", {
        user_id: user.id,
        pet_id: selectedPetIds[0],
        room_id: room.id, // ✅ rooms.id uuid 그대로
        check_in: checkIn,
        check_out: checkOut,
        total_price: totalPrice,
        status: "pending",
      });

      // 1) bookings insert
      const { data: insertedBooking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          pet_id: selectedPetIds[0], // 대표 펫
          room_id: room.id,          // ✅ uuid
          check_in: checkIn,
          check_out: checkOut,
          total_price: totalPrice,
          status: "pending",
          // requests 컬럼이 DB에 없으면 넣지 마세요.
          // requests: requests || null,
        })
        .select("id")
        .single();

      if (bookingErr) throw bookingErr;

      // 2) booking_pets insert (선택된 펫 전부 저장)
      const rows = selectedPetIds.map((petId) => ({
        booking_id: insertedBooking.id,
        pet_id: petId,
      }));

      const { error: linkErr } = await supabase.from("booking_pets").insert(rows);
      if (linkErr) throw linkErr;

      setSubmitted(true);
    } catch (e: any) {
      console.error("예약 저장 실패 상세:", e);
      alert(e?.message ? `예약 저장 실패: ${e.message}` : "예약 저장 실패");
    }
  }

  if (submitted) {
    const selectedPets = pets.filter((p) => selectedPetIds.includes(p.id));

    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">예약 신청이 완료되었습니다!</h2>
        <p className="text-gray-500 mb-2">관리자 확인 후 예약이 확정됩니다.</p>
        <p className="text-gray-400 text-sm mb-8">보통 1시간 이내에 확정 연락을 드립니다.</p>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-left mb-8 space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">객실:</span> {room?.name}
          </p>

          <p className="text-sm text-gray-600">
            <span className="font-semibold">반려동물:</span> {petCountLabel}
          </p>

          <div className="text-sm text-gray-600">
            <span className="font-semibold">선택한 아이들:</span>
            <div className="mt-1 space-y-1">
              {selectedPets.map((p) => (
                <div key={p.id} className="text-gray-600">
                  - {p.name} {p.breed ? `(${p.breed})` : ""}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-gray-600">
            <span className="font-semibold">체크인:</span> {formatDate(checkIn)}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">체크아웃:</span> {formatDate(checkOut)}
          </p>
          <p className="text-sm font-bold text-blue-600">
            <span className="font-semibold text-gray-600">결제 예정 금액:</span> ₩{totalPrice.toLocaleString()}
          </p>
        </div>

        <a
          href="/Hotel/Mypage/Bookings"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors"
        >
          예약 내역 확인하기
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="mb-10">
        <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          📅 실시간 예약
        </span>
        <h2 className="text-3xl font-bold text-gray-900">간편하게 예약하세요</h2>
        <p className="text-gray-500 mt-2">3단계로 빠르게 완료할 수 있습니다.</p>
      </div>

      {/* 스텝 인디케이터 */}
      <div className="flex items-center gap-0 mb-10">
        {["객실 선택", "날짜 & 펫 선택", "최종 확인"].map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${step > i + 1 ? "bg-blue-600 text-white" : step === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"}`}
              >
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span className={`text-xs mt-1 font-medium ${step === i + 1 ? "text-blue-600" : "text-gray-400"}`}>{label}</span>
            </div>
            {i < 2 && <div className={`h-[2px] flex-1 mx-2 mb-4 ${step > i + 1 ? "bg-blue-600" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      {/* STEP 1: 객실 선택 */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">어떤 객실을 원하세요?</h3>

          {roomsLoading && <div className="text-gray-400 text-sm mb-3">객실 불러오는 중...</div>}
          {!roomsLoading && rooms.length === 0 && <div className="text-gray-400 text-sm mb-3">등록된 객실이 없습니다.</div>}

          <div className="space-y-4">
            {rooms.map((r, idx) => (
              <div
                key={r.id}
                onClick={() => setSelectedRoomUiId(idx)}
                className={`border-2 rounded-2xl p-5 cursor-pointer transition-all
                  ${selectedRoomUiId === idx ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200 bg-white"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs
                        ${selectedRoomUiId === idx ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"}`}
                      >
                        {selectedRoomUiId === idx ? "✓" : ""}
                      </span>
                      <span className="font-bold text-gray-900">{r.name}</span>
                    </div>
                    <span className="text-sm text-gray-500 ml-7">{r.spec ?? ""}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600 text-lg">₩{r.price.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">/ 1박</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!canNext1}
            className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-base hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            다음 단계 →
          </button>
        </div>
      )}

      {/* STEP 2: 날짜 & 펫 선택 */}
      {step === 2 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-6">날짜와 반려동물을 선택하세요</h3>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-6">
            <p className="font-semibold text-gray-700 mb-4">📅 입실 / 퇴실 날짜</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">체크인</label>
                <input
                  type="date"
                  min={today}
                  value={checkIn}
                  onChange={(e) => {
                    setCheckIn(e.target.value);
                    setCheckOut("");
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">체크아웃</label>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              ⚠️ 예약 불가 날짜: {BOOKED_DATES.slice(0, 3).join(", ")} 등은 이미 예약이 꽉 찼습니다.
            </div>

            {nights > 0 && (
              <div className="mt-3 text-sm text-blue-600 font-semibold">
                ✅ {formatDate(checkIn)} ~ {formatDate(checkOut)} · 총 {nights}박
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-700">🐶 함께할 반려동물</p>
              <div className="text-sm font-bold text-blue-600">{petCountLabel}</div>
            </div>

            {petsLoading && <div className="text-gray-400 text-sm mb-3">내 펫 불러오는 중...</div>}
            {!petsLoading && pets.length === 0 && <div className="text-gray-400 text-sm mb-3">등록된 반려동물이 없습니다.</div>}

            <div className="space-y-3">
              {pets.map((p) => {
                const selected = selectedPetIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePet(p.id)}
                    className={`border-2 rounded-2xl p-4 cursor-pointer flex items-center gap-4 transition-all
                      ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200 bg-white"}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-xl">
                      {p.photo_url ? <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" /> : "🐾"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.breed ?? "품종 미입력"} · {p.weight}kg
                      </p>
                    </div>
                    {selected && <span className="ml-auto text-blue-600 font-bold text-lg">✓</span>}
                  </div>
                );
              })}
            </div>

            <a href="/Hotel/Mypage/Pets" className="mt-3 flex items-center gap-1 text-sm text-blue-500 hover:underline">
              + 반려동물 등록하기
            </a>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-50">
              ← 이전
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canNext2}
              className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              다음 단계 →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 최종 확인 */}
      {step === 3 && (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-6">예약 내용을 확인해주세요</h3>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-blue-100">
              <span className="text-gray-500 text-sm">선택 객실</span>
              <span className="font-bold text-gray-900">{room?.name}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-blue-100">
              <span className="text-gray-500 text-sm">반려동물</span>
              <span className="font-bold text-gray-900">{petCountLabel}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-blue-100">
              <span className="text-gray-500 text-sm">체크인 / 체크아웃</span>
              <span className="font-bold text-gray-900">
                {formatDate(checkIn)} → {formatDate(checkOut)}
              </span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-blue-100">
              <span className="text-gray-500 text-sm">숙박 기간</span>
              <span className="font-bold text-gray-900">{nights}박</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">총 결제 금액</span>
              <span className="font-bold text-blue-600 text-xl">₩{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">💬 요청 사항 (선택)</label>
            <textarea
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              placeholder="예: 사료 직접 가져갑니다 / 약을 먹어야 해요 / 분리불안이 있어요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 min-h-[100px] resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 text-gray-600 py-4 rounded-xl font-bold hover:bg-gray-50">
              ← 이전
            </button>

            <button
              onClick={handleSubmitBooking}
              className="flex-[2] bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              🐾 예약 신청하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}