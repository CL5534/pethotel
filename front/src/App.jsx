import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout.jsx'
import AdminPage from './pages/AdminPage.jsx'
import BookingPage from './pages/BookingPage.jsx'
import CommunityPage from './pages/CommunityPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import MyPage from './pages/MyPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import TermsPage from './pages/TermsPage.jsx'

function App() {
  return (
    <Routes>
      {/*
        App.jsx는 "어떤 URL에 어떤 페이지를 보여줄지"만 담당하는 라우팅 진입점이다.
        공통 UI는 각 페이지에서 중복 렌더링하지 않고 MainLayout 하나로 묶는다.

        MainLayout 안에는 Header / Footer / <Outlet /> 구조가 들어있다.
        아래처럼 Route를 중첩하면 react-router가 현재 URL에 맞는 페이지를 찾아
        MainLayout 내부의 <Outlet /> 자리에 자동으로 꽂아 준다.

        예시:
        - /          -> MainLayout + HomePage
        - /login     -> MainLayout + LoginPage
        - /community -> MainLayout + CommunityPage

        즉 "껍데기(MainLayout)"는 유지하고 "가운데 내용"만 바꾸는 구조다.
        페이지가 늘어나도 이 파일에는 Route만 추가하면 되므로 유지보수가 쉽다.
      */}
      <Route element={<MainLayout />}>
        {/* 메인 홈: 첫 진입 화면 */}
        <Route path="/" element={<HomePage />} />
        {/* 인증 관련 페이지: 추후 백엔드 인증 API와 연결될 예정 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        {/* 고객용 기능 페이지: 현재는 골격만 있고 이후 기능별로 확장 */}
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/community" element={<CommunityPage />} />
        {/* 관리자 / 정책 페이지: 권한 제어는 추후 AuthContext + 백엔드 인증으로 연결 */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Route>
    </Routes>
  )
}

export default App
