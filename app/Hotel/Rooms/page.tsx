"use client";
import Link from "next/link";
import { useState } from "react";

const TABS = ["스탠다드룸", "디럭스룸"];

const ROOMS_DATA = [
  {
    id: 0,
    name: "스탠다드룸",
    nameEn: "Standard Room",
    images: [
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1200&q=90",
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=90",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=90",
      "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=1200&q=90",
    ],
    bullets: [
      "가장 기본적인 객실",
      "전용 1.4 ㎡",
      "바닥/벽 타일 마감",
      "1견 1실",
      "개별 방석 이용",
      "이용금액 : - 5kg 이하 : 55,000원\n              - 5kg 초과 : 66,000원",
      "날씨 고려 평일 기준 1일 1회 소나무 숲길 산책 추가 1만원/1회",
    ],
    price: "55,000",
  },
  {
    id: 1,
    name: "디럭스룸",
    nameEn: "Deluxe Room",
    images: [
      "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=1200&q=90",
      "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=1200&q=90",
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=1200&q=90",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=90",
    ],
    bullets: [
      "강아지를 위한 디럭스 룸",
      "답답한 걸 싫어하는 아이들을 위해 상부 개방",
      "다른 아이들이 보이지 않게 시선을 차단한 독립된 공간",
      "전용 면적 2.5 ㎡ 내외",
      "1견 1실 (가족견 2견까지)",
      "이용금액 : - 1견 기준 77,000원\n              - 1견 추가 이용 시 (5kg이하 : 55,000원 / 5kg초과 : 66,000원)",
      "날씨 고려 평일 기준 1일 1회 소나무 숲길 산책 추가 : 1만원/1회",
    ],
    price: "77,000",
  },
];

export default function Rooms() {
  const [activeTab, setActiveTab] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);

  const room = ROOMS_DATA[activeTab];

  const handleTab = (idx: number) => {
    setActiveTab(idx);
    setImgIdx(0);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

        .rooms-wrap * { box-sizing: border-box; margin: 0; padding: 0; }

        .rooms-wrap {
          font-family: 'Noto Sans KR', sans-serif;
          background: #fff;
          color: #1a1a1a;
          min-height: auto;
          width: 100%;
        }

        /* 탭 */
        .tab-nav {
          border-bottom: 1px solid #ddd;
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .tab-btn {
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          padding: 22px 44px;
          font-size: 17px;
          font-family: 'Noto Sans KR', sans-serif;
          font-weight: 500;
          color: #aaa;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: color 0.2s, border-color 0.2s;
          margin-bottom: -1px;
        }
        .tab-btn.active {
          color: #8B1C1C;
          border-bottom-color: #8B1C1C;
          font-weight: 700;
        }
        .tab-btn:hover { color: #8B1C1C; }

        /* 본문 전체 */
        .content-area {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 64px 24px 120px;
        }

        /* 좌(이미지) + 우(텍스트) */
        .room-layout {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 72px;
          align-items: start;
        }

        /* 왼쪽: 메인 사진 위 + 썸네일 아래 */
        .img-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* 메인 사진 */
        .img-main {
          width: 100%;
          aspect-ratio: 3/2;
          object-fit: cover;
          display: block;
        }

        /* 썸네일 4개 가로 나열 */
        .img-thumbs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .img-thumb {
          width: 100%;
          aspect-ratio: 4/3;
          object-fit: cover;
          cursor: pointer;
          opacity: 0.45;
          transition: opacity 0.2s;
          border: 2px solid transparent;
          display: block;
        }
        .img-thumb.active { opacity: 1; border-color: #8B1C1C; }
        .img-thumb:hover { opacity: 0.8; }

        /* 오른쪽: 텍스트 */
        .text-col {}

        .room-title {
          font-family: 'Noto Serif KR', serif;
          font-size: 34px;
          font-weight: 700;
          color: #8B1C1C;
          line-height: 1.35;
          margin-bottom: 4px;
        }
        .room-title-en {
          font-size: 18px;
          font-weight: 400;
          opacity: 0.7;
        }

        .divider {
          width: 100%;
          height: 1px;
          background: #e0e0e0;
          margin: 24px 0;
        }

        .bullet-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bullet-list li {
          font-size: 16px;
          color: #2a2a2a;
          line-height: 1.9;
          padding-left: 16px;
          position: relative;
          white-space: pre-line;
        }
        .bullet-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #bbb;
        }

        .price-section {
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid #e0e0e0;
        }
        .price-label {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        .price-amount {
          font-family: 'Noto Serif KR', serif;
          font-size: 36px;
          font-weight: 700;
          color: #8B1C1C;
        }
        .price-unit {
          font-size: 17px;
          color: #666;
          margin-left: 4px;
        }

        .book-btn {
          display: block;
          width: 100%;
          margin-top: 20px;
          padding: 18px;
          background: #fff;
          border: 1.5px solid #8B1C1C;
          color: #8B1C1C;
          font-size: 15px;
          font-family: 'Noto Sans KR', sans-serif;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          transition: background 0.2s, color 0.2s;
        }
        .book-btn:hover { background: #8B1C1C; color: #fff; }

        @media (max-width: 1100px) {
          .content-area { padding: 48px 40px 100px; }
          .room-layout { grid-template-columns: 1fr 360px; gap: 48px; }
        }
        @media (max-width: 768px) {
          .room-layout { grid-template-columns: 1fr; }
          .content-area { padding: 36px 20px 80px; }
          .room-title { font-size: 26px; }
          .tab-btn { padding: 16px 20px; font-size: 15px; }
        }
      `}</style>

      <div className="rooms-wrap">
        <nav className="tab-nav">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`tab-btn${activeTab === i ? " active" : ""}`}
              onClick={() => handleTab(i)}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="content-area">
          <div className="room-layout">

            {/* 왼쪽: 메인 사진 + 썸네일 */}
            <div className="img-col">
              <img
                className="img-main"
                src={room.images[imgIdx]}
                alt={room.name}
              />
              <div className="img-thumbs">
                {room.images.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    className={`img-thumb${imgIdx === i ? " active" : ""}`}
                    onClick={() => setImgIdx(i)}
                    alt=""
                  />
                ))}
              </div>
            </div>

            {/* 오른쪽: 텍스트 */}
            <div className="text-col">
              <h2 className="room-title">
                {room.name}
                <br />
                <span className="room-title-en">({room.nameEn})</span>
              </h2>

              <div className="divider" />

              <ul className="bullet-list">
                {room.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>

              <div className="price-section">
                <p className="price-label">이용 금액 (Price) 1박</p>
                <p>
                  <span className="price-amount">{room.price}</span>
                  <span className="price-unit">원</span>
                </p>
              </div>

              <Link href={`/Hotel/Booking?room=${room.id}`} className="book-btn">
                예약하기
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}