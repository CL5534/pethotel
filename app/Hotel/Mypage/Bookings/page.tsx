"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type BookingStatus = "대기" | "확정" | "취소";

// DB(status) -> 화면(status)
function mapStatus(dbStatus: string): BookingStatus {
  // DB에 pending/confirmed/canceled 쓰는 경우가 많아서 대응
  if (dbStatus === "confirmed" || dbStatus === "확정") return "확정";
  if (dbStatus === "canceled" || dbStatus === "cancelled" || dbStatus === "취소") return "취소";
  return "대기"; // pending / default
}

function calcNights(start: string, end: string) {
  if (!start || !end) return 0;
  const s = new Date(`${start}T12:00:00`).getTime();
  const e = new Date(`${end}T12:00:00`).getTime();
  return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
}

type BookingCard = {
  id: string;             // bookings.id (uuid)
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  amount: number;
  status: BookingStatus;
  createdAt: string;

  petsLabel: string;      // "초코, 뭉치" 같은 표시용
  firstPetName: string;   // 카드 타이틀용(첫번째)
  breedLabel: string;     // "말티즈 외 1" 같은 표시용
};

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
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState<"전체" | BookingStatus>("전체");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingCard[]>([]);

  // ✅ URL에서 roomName 받아오기 (예: ?roomName=스탠다드룸)
  const roomNameParam = searchParams.get("roomName");
  const normalizedRoomNameParam = useMemo(() => {
    if (!roomNameParam) return "";
    return roomNameParam.replace(/\s/g, "");
  }, [roomNameParam]);

  async function fetchMyBookings() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    // 1) 내 bookings 가져오기 + rooms 조인(객실명)
    const { data: bookingRows, error: bErr } = await supabase
      .from("bookings")
      .select("id, check_in, check_out, total_price, status, created_at, room_id, rooms(name)")
      .order("created_at", { ascending: false });

    if (bErr) {
      console.error(bErr);
      alert("예약 내역 조회 실패");
      setBookings([]);
      setLoading(false);
      return;
    }

    const base = (bookingRows ?? []).map((b: any) => ({
      id: b.id as string,
      checkIn: b.check_in as string,
      checkOut: b.check_out as string,
      nights: calcNights(b.check_in, b.check_out),
      amount: Number(b.total_price ?? 0),
      status: mapStatus(String(b.status ?? "pending")),
      createdAt: String(b.created_at ?? ""),
      roomId: String(b.room_id ?? ""),
      roomName: (b.rooms?.name as string) ?? "객실",
    }));

    // 2) booking_pets에서 booking_id 목록으로 한 번에 가져오기
    const bookingIds = base.map((x) => x.id);
    if (bookingIds.length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const { data: linkRows, error: lErr } = await supabase
      .from("booking_pets")
      .select("booking_id, pet_id, pets!booking_pets_pet_id_fkey(name, breed)")
      .in("booking_id", bookingIds);

    if (lErr) {
      console.error(lErr);
      // bookings는 보여주고, 펫 정보만 빠지게 처리
      const fallback: BookingCard[] = base.map((b) => ({
        id: b.id,
        roomName: b.roomName,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: b.nights,
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt,
        petsLabel: "펫 정보 없음",
        firstPetName: "🐾",
        breedLabel: "",
      }));
      setBookings(fallback);
      setLoading(false);
      return;
    }

    // booking_id -> pets 배열로 그룹핑
    const map = new Map<
      string,
      { name: string; breed: string | null }[]
    >();

    (linkRows ?? []).forEach((row: any) => {
      const bid = String(row.booking_id);
      const pet = row.pets;
      const item = {
        name: String(pet?.name ?? "펫"),
        breed: (pet?.breed ?? null) as string | null,
      };
      if (!map.has(bid)) map.set(bid, []);
      map.get(bid)!.push(item);
    });

    // 3) 카드 형태로 변환
    const result: BookingCard[] = base.map((b) => {
      const pets = map.get(b.id) ?? [];
      const names = pets.map((p) => p.name);
      const breeds = pets.map((p) => p.breed).filter(Boolean) as string[];

      const firstName = names[0] ?? "🐾";
      const petsLabel =
        names.length <= 1 ? (names[0] ?? "펫") : `${names[0]}, ${names[1]}${names.length > 2 ? ` 외 ${names.length - 2}` : ""}`;

      const breedLabel =
        breeds.length === 0
          ? ""
          : breeds.length === 1
          ? breeds[0]
          : `${breeds[0]} 외 ${breeds.length - 1}`;

      return {
        id: b.id,
        roomName: b.roomName,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: b.nights,
        amount: b.amount,
        status: b.status,
        createdAt: b.createdAt.split("T")[0] ?? b.createdAt, // 날짜만
        petsLabel,
        firstPetName: firstName,
        breedLabel,
      };
    });

    setBookings(result);
    setLoading(false);
  }

  useEffect(() => {
    fetchMyBookings();
  }, []);

  // ✅ 들어오자마자 해당 룸 예약 1개 자동 펼치기
  useEffect(() => {
    if (!normalizedRoomNameParam) return;

    const target = bookings.find((b) => b.roomName.replace(/\s/g, "") === normalizedRoomNameParam);
    if (target) {
      setFilter("전체");
      setExpandedId(target.id);
    }
  }, [normalizedRoomNameParam, bookings]);

  const filtered = filter === "전체" ? bookings : bookings.filter((b) => b.status === filter);

  const counts = {
    전체: bookings.length,
    확정: bookings.filter((b) => b.status === "확정").length,
    대기: bookings.filter((b) => b.status === "대기").length,
    취소: bookings.filter((b) => b.status === "취소").length,
  };

  async function cancelBooking(bookingId: string) {
    const ok = confirm("예약을 취소하시겠습니까?");
    if (!ok) return;

    // DB status 값이 pending/confirmed/canceled 형식이면 canceled로 맞추는 게 좋음
    const { error } = await supabase.from("bookings").update({ status: "canceled" }).eq("id", bookingId);

    if (error) {
      console.error(error);
      alert("취소 실패");
      return;
    }
    await fetchMyBookings();
  }

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

      {/* 로딩 */}
      {loading && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">⏳</div>
          <p className="font-medium">예약 내역 불러오는 중...</p>
        </div>
      )}

      {!loading && (
        <>
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
                          <span className="font-bold text-gray-900">{booking.firstPetName}</span>
                          <span className="text-xs text-gray-400">{booking.breedLabel}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[booking.status]}`}>
                            {STATUS_ICON[booking.status]} {booking.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-0.5">{booking.roomName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {booking.checkIn} ~ {booking.checkOut} · {booking.nights}박
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">함께한 아이들: {booking.petsLabel}</p>
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
                      <span className="text-gray-500">예약 ID</span>
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
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="w-full mt-2 border border-red-200 text-red-500 py-2.5 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                      >
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
            <a
              href="/Hotel/Booking"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
            >
              + 새 예약 신청하기
            </a>
          </div>
        </>
      )}
    </div>
  );
}