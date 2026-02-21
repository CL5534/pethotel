// app/page.tsx
import Header from "./Common/Header/page";
import Footer from "./Common/Footer/page";
import HomeContent from "./Hotel/Home/page";

export default function RootPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* 1. 상단 헤더 (공용) */}
      <Header />

      {/* 2. 메인 컨텐츠 (Hotel/Home 내용) */}
      <main className="flex-grow">
        <HomeContent />
      </main>

      {/* 3. 하단 푸터 (공용) */}
      <Footer />
    </div>
  );
}