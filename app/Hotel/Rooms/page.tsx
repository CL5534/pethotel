"use client";
import Link from "next/link";

const ROOMS_DATA = [
  {
    id: 1,
    name: "스탠다드 룸",
    subName: "Standard",
    price: "30,000",
    spec: "소형견 (5kg 미만)",
    desc: "아늑하고 포근한 기본 객실로, 작은 아이들이 편안하게 쉴 수 있는 맞춤 공간입니다. 개별 침대와 장난감이 제공됩니다.",
    features: ["🛏️ 개별 침대 제공", "📹 24시간 CCTV", "❄️ 에어컨/난방"],
    emoji: "🐩",
    imageBg: "bg-gradient-to-br from-blue-100 to-sky-200",
    badgeColor: "bg-blue-100 text-blue-700",
    btnColor: "bg-blue-600 hover:bg-blue-700",
    priceColor: "text-blue-600",
    borderColor: "border-blue-200",
    tag: "POPULAR",
    tagColor: "bg-blue-600",
  },
  {
    id: 2,
    name: "디럭스 룸",
    subName: "Deluxe",
    price: "50,000",
    spec: "중형견 (15kg 미만)",
    desc: "활동량이 많은 중형견을 위해 넉넉한 공간과 놀이 시설을 갖춘 프리미엄 객실입니다. 개별 산책 서비스가 포함됩니다.",
    features: ["🏃 넓은 놀이 공간", "🎾 장난감 비치", "🦮 개별 산책 서비스"],
    emoji: "🐕",
    imageBg: "bg-gradient-to-br from-emerald-100 to-green-200",
    badgeColor: "bg-emerald-100 text-emerald-700",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
    priceColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    tag: "BEST",
    tagColor: "bg-emerald-600",
  },
  {
    id: 3,
    name: "프리미엄 스위트",
    subName: "Suite",
    price: "80,000",
    spec: "대형견 / 다견 가정",
    desc: "대형견도 마음껏 뛰어놀 수 있는 최고급 독채 객실. 여러 마리를 함께 맡길 수 있으며, 야외 정원이 연결됩니다.",
    features: ["🏡 독채 구조", "🌿 야외 정원 연결", "👑 프리미엄 케어"],
    emoji: "🐾",
    imageBg: "bg-gradient-to-br from-purple-100 to-violet-200",
    badgeColor: "bg-purple-100 text-purple-700",
    btnColor: "bg-purple-600 hover:bg-purple-700",
    priceColor: "text-purple-600",
    borderColor: "border-purple-200",
    tag: "PREMIUM",
    tagColor: "bg-purple-600",
  },
];

export default function Rooms() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* 페이지 헤더 */}
      <div className="mb-12 text-center">
        <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          🏨 객실 안내
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          우리 아이에게 딱 맞는 방을 선택하세요
        </h2>
        <p className="text-gray-500 text-lg">
          투명한 가격, 깨끗한 시설, 전문 케어 — 믿고 맡길 수 있는 곳입니다.
        </p>
        {/* 가격 요약 배너 */}
        <div className="mt-6 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-5 py-2.5 rounded-full text-sm font-medium">
          💰 1박 기준 3만원부터 — 숨겨진 비용 없이 투명하게 공개합니다
        </div>
      </div>

      {/* 객실 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ROOMS_DATA.map((room) => (
          <div
            key={room.id}
            className={`border ${room.borderColor} rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white flex flex-col`}
          >
            {/* 이미지 영역 */}
            <div className={`relative h-52 ${room.imageBg} flex items-center justify-center`}>
              <span className="text-7xl">{room.emoji}</span>
              {/* 태그 뱃지 */}
              <span className={`absolute top-4 left-4 ${room.tagColor} text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide`}>
                {room.tag}
              </span>
              {/* 가격 플로팅 */}
              <div className="absolute bottom-4 right-4 bg-white rounded-xl px-3 py-1.5 shadow-md">
                <span className={`text-base font-bold ${room.priceColor}`}>₩{room.price}</span>
                <span className="text-xs text-gray-400 ml-1">/ 1박</span>
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="p-6 flex flex-col flex-1">
              {/* 제목 */}
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-bold text-xl text-gray-900">{room.name}</h3>
                <span className="text-xs text-gray-400 font-medium">{room.subName}</span>
              </div>

              {/* 입실 가능 뱃지 */}
              <span className={`inline-block w-fit text-xs font-semibold ${room.badgeColor} px-3 py-1 rounded-full mb-3`}>
                🐶 {room.spec}
              </span>

              {/* 설명 */}
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{room.desc}</p>

              {/* 특징 리스트 */}
              <ul className="space-y-1.5 mb-6 flex-1">
                {room.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* 예약 버튼 */}
              <Link href="/Hotel/Booking">
                <button className={`w-full ${room.btnColor} text-white py-3 rounded-xl font-bold transition-colors text-sm`}>
                  이 방으로 예약하기 →
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 안내 */}
      <div className="mt-14 bg-gray-50 border border-gray-200 rounded-2xl p-8">
        <h3 className="font-bold text-gray-800 text-lg mb-4">📋 공통 제공 서비스</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "📹", label: "24시간 CCTV 실시간 확인" },
            { icon: "🩺", label: "입실 전 건강 체크" },
            { icon: "📸", label: "매일 사진/영상 전송" },
            { icon: "🚨", label: "응급 상황 즉시 연락" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-gray-100">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm text-gray-600 font-medium leading-snug">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}