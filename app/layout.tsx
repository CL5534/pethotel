import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ✅ 추가: 공통 헤더/푸터 컴포넌트 가져오기
import Header from "./Common/Header/page";
import Footer from "./Common/Footer/page";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "pethotel",
  description: "pethotel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode; // ✅ children = 각 페이지 내용(app/page.tsx, app/Hotel/Booking/page.tsx 등)
}>) {
  return (
    // ✅ 변경 추천: 사이트 언어가 한국어면 "ko"가 자연스럽다
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ✅ 추가: 화면 전체를 세로로 쌓는 레이아웃 틀 */}
        {/* - min-h-screen: 화면 높이(100vh)만큼 최소 높이 확보 */}
        {/* - flex flex-col: 위에서 아래로(세로) 쌓기 */}
        <div className="min-h-screen flex flex-col font-sans">
          
          {/* ✅ 추가: 모든 페이지에서 공통으로 보일 헤더 */}
          <Header />

          {/* ✅ 추가: 메인 영역 */}
          {/* - flex-grow: 남는 세로 공간을 main이 먹어서 */}
          {/*   푸터가 항상 아래로 밀려 내려가게 함 */}
          <main className="flex-grow">
            {children} {/* ✅ 기존 children을 여기로 이동: 페이지 내용은 이 위치에 렌더링됨 */}
          </main>

          {/* ✅ 추가: 모든 페이지에서 공통으로 보일 푸터 */}
          <Footer />
        </div>

        {/* ⚠️ 기존 {children}은 main 안으로 옮겼기 때문에 여기엔 더 이상 두면 안 됨 */}
      </body>
    </html>
  );
}