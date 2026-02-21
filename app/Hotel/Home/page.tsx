import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Section: Trustworthy First Impression & CTA */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gray-900 text-white">
        {/* Background Image Placeholder - Replace with actual hotel image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')" }}
        ></div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            반려동물을 위한<br />가장 안전한 선택
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-gray-200">
            전문 펫 시터와 24시간 케어 시스템으로<br />
            보호자님의 소중한 가족을 따뜻하게 맞이합니다.
          </p>
          <Link href="/Hotel/Booking">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-10 rounded-full text-xl transition-transform transform hover:scale-105 shadow-lg">
              지금 바로 예약하기
            </button>
          </Link>
        </div>
      </section>

      {/* 2. Reviews Section: 3 Actual User Reviews */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800">
            실제 이용 고객님들의 생생한 후기
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "김지영 님",
                pet: "말티즈 (3세)",
                content: "처음 맡기는 거라 걱정이 많았는데, 매일 사진이랑 영상을 보내주셔서 안심할 수 있었어요. 시설이 정말 깨끗해요!",
                rating: 5
              },
              {
                name: "이현우 님",
                pet: "골든 리트리버 (5세)",
                content: "대형견이라 받아주는 곳이 많이 없었는데, 넓은 운동장에서 맘껏 뛰어놀 수 있어서 아이가 너무 좋아했습니다.",
                rating: 5
              },
              {
                name: "박수민 님",
                pet: "비숑 (2세)",
                content: "직원분들이 강아지를 정말 예뻐하시는 게 느껴졌어요. 위생 관리도 철저하고 냄새도 안 나서 놀랐습니다.",
                rating: 5
              }
            ].map((review, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                <div className="flex text-yellow-400 mb-4">
                  {"★".repeat(review.rating)}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">"{review.content}"</p>
                <div className="border-t pt-4 border-gray-200">
                  <p className="font-bold text-gray-900">{review.name}</p>
                  <p className="text-sm text-gray-500">{review.pet}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Location Section: Map */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 text-gray-800">오시는 길</h2>
              <p className="text-lg text-gray-600 mb-2">서울시 강남구 테헤란로 123 펫호텔 빌딩 1층</p>
              <p className="text-gray-500 mb-8">지하철 2호선 강남역 1번 출구 도보 5분</p>
              <div className="space-y-2">
                <p className="font-semibold">운영 시간</p>
                <p className="text-gray-600">매일 09:00 - 20:00 (연중무휴)</p>
                <p className="font-semibold mt-4">문의 전화</p>
                <p className="text-gray-600">02-1234-5678</p>
              </div>
            </div>
            <div className="w-full md:w-1/2 h-[400px] bg-gray-200 rounded-2xl overflow-hidden shadow-inner relative">
              {/* Map Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center bg-gray-300">
                <span className="text-gray-500 font-medium">지도 영역 (API 연동 필요)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}