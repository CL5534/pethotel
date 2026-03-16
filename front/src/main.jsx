import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'
import './styles/common.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/*
      앱 최상단에서 두 가지 전역 기능을 주입한다.

      1. AuthProvider
         - 로그인 여부 / 사용자 정보 / 로그인/로그아웃 함수 제공
         - Header, LoginPage 등 어디서든 useAuth()로 접근 가능
         - 인증 구조가 바뀌어도 App 아래 개별 페이지를 뜯지 않고
           이 Provider 중심으로 수정하도록 하기 위한 설계다.

      2. BrowserRouter
         - URL 변경에 따라 App.jsx의 Route를 매칭
         - MainLayout의 Outlet에 각 페이지를 렌더링

      순서상 AuthProvider가 Router 바깥에 있어도 내부 페이지 전체를 감쌀 수 있으므로
      라우팅되는 모든 화면에서 동일한 인증 상태를 공유할 수 있다.
    */}
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
