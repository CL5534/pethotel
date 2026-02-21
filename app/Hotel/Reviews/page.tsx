"use client";
import { useState } from "react";

// 오늘의 호텔 아이들 (관리자 업로드)
const TODAY_PHOTOS = [
  { id: 1, petName: "보리", emoji: "🐕", desc: "오늘 산책하고 간식도 먹었어요!", date: "2025-02-21" },
  { id: 2, petName: "코코", emoji: "🐩", desc: "낮잠 자는 중... 너무 귀엽죠?", date: "2025-02-21" },
  { id: 3, petName: "하루", emoji: "🐾", desc: "친구들이랑 놀이 시간 즐기는 중!", date: "2025-02-21" },
  { id: 4, petName: "몽이", emoji: "🦮", desc: "목욕 후 그루밍까지 완료 😎", date: "2025-02-21" },
];

// 실제 이용 후기
const REVIEWS = [
  {
    id: 1,
    userName: "김지영",
    petName: "초코 (말티즈, 3세)",
    rating: 5,
    date: "2025-02-18",
    content: "처음 맡기는 거라 걱정이 많았는데, 매일 사진이랑 영상을 보내주셔서 안심할 수 있었어요. 시설이 정말 깨끗하고 직원분들이 강아지를 너무 예뻐해 주셔서 감동받았습니다!",
    emoji: "🐶",
    verified: true,
  },
  {
    id: 2,
    userName: "이현우",
    petName: "뭉치 (골든 리트리버, 5세)",
    rating: 5,
    date: "2025-02-12",
    content: "대형견이라 받아주는 곳이 많이 없었는데, 넓은 운동장에서 맘껏 뛰어놀 수 있어서 아이가 너무 좋아했습니다. 다음에도 꼭 이용할 거예요.",
    emoji: "🦮",
    verified: true,
  },
  {
    id: 3,
    userName: "박수민",
    petName: "루비 (비숑프리제, 2세)",
    rating: 5,
    date: "2025-01-30",
    content: "직원분들이 강아지를 정말 예뻐하시는 게 느껴졌어요. 위생 관리도 철저하고 냄새도 안 나서 놀랐습니다. 특이사항도 꼼꼼히 기록해 두셨고 퇴실 때 간단한 케어 리포트도 주셔서 신뢰가 갔어요.",
    emoji: "🐩",
    verified: true,
  },
  {
    id: 4,
    userName: "최민준",
    petName: "두부 (포메라니안, 4세)",
    rating: 4,
    date: "2025-01-22",
    content: "전반적으로 만족스러웠습니다. 아이가 낯가림이 심한데도 잘 적응해서 보내줬다고 하더라고요. 다음엔 더 긴 기간도 맡겨볼 것 같습니다.",
    emoji: "🐕",
    verified: false,
  },
  {
    id: 5,
    userName: "정혜연",
    petName: "밤비 (닥스훈트, 6세)",
    rating: 5,
    date: "2025-01-10",
    content: "노령견이라 걱정이 많았는데, 특별히 더 신경써주신다는 말씀에 믿고 맡겼어요. 정말 꼼꼼하게 케어해주셔서 감사했습니다. 약 시간도 잊지 않고 챙겨주셨어요!",
    emoji: "🐾",
    verified: true,
  },
];

export default function Review() {
  const [activeTab, setActiveTab] = useState<"review" | "today">("today");

  const avgRating = (REVIEWS.reduce((acc, r) => acc + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* 헤더 */}
      <div className="mb-8 text-center">
        <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          ⭐ 이용 후기
        </span>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">실제 보호자님들의 이야기</h2>
        <p className="text-gray-500">믿고 맡길 수 있는 곳인지 직접 확인해보세요.</p>

        {/* 평점 요약 */}
        <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl mt-5">
          <span className="text-3xl font-bold text-amber-500">{avgRating}</span>
          <div className="text-left">
            <div className="text-yellow-400 text-sm">{"★".repeat(5)}</div>
            <p className="text-xs text-gray-500">{REVIEWS.length}개의 리뷰</p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("today")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all
            ${activeTab === "today" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          📸 오늘의 호텔 아이들
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all
            ${activeTab === "review" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          ⭐ 이용 후기
        </button>
      </div>

      {/* 오늘의 호텔 아이들 */}
      {activeTab === "today" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800">📅 2025년 2월 21일의 아이들</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">관리자 업로드</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {TODAY_PHOTOS.map((photo) => (
              <div key={photo.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                {/* 사진 영역 (실제로는 img 태그) */}
                <div className="h-40 bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center text-6xl">
                  {photo.emoji}
                </div>
                <div className="p-4">
                  <p className="font-bold text-gray-900 text-sm">{photo.petName}</p>
                  <p className="text-xs text-gray-500 mt-1">{photo.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {/* 과거 사진첩 버튼 */}
          <div className="text-center">
            <button className="border border-gray-200 text-gray-600 px-6 py-3 rounded-full text-sm font-bold hover:bg-gray-50 transition-colors">
              📂 이전 날짜 사진 보기
            </button>
          </div>
        </div>
      )}

      {/* 이용 후기 */}
      {activeTab === "review" && (
        <div className="space-y-4">
          {REVIEWS.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                    {review.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">{review.userName}</span>
                      {review.verified && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                          ✓ 실제 이용
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{review.petName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 text-sm">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                  <p className="text-xs text-gray-400 mt-0.5">{review.date}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
            </div>
          ))}

          {/* 후기 작성 유도 */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100 rounded-2xl p-6 text-center mt-6">
            <p className="text-2xl mb-2">✍️</p>
            <p className="font-bold text-gray-800 mb-1">이용하셨나요? 후기를 남겨주세요!</p>
            <p className="text-xs text-gray-500 mb-4">소중한 후기가 다른 보호자님께 큰 도움이 됩니다.</p>
            <button className="bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-blue-700 transition-colors">
              후기 작성하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}