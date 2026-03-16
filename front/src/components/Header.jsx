import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Header.css'

function Header() {
  const { isLoggedIn, logout, user } = useAuth()
  const isAdminLoggedIn = false

  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <div className="brandBlock">
          <Link to="/" className="brand">
            PetHotel
          </Link>
          <p className="brandCaption">Premium care for quiet stays and happy returns.</p>
        </div>

        <nav className="siteNav">
          <a href="/#contact">문의</a>
          <Link to="/booking">예약</Link>
          <Link to="/mypage">마이페이지</Link>
          <Link to="/community">커뮤니티</Link>
          {isAdminLoggedIn ? (
            <Link to="/admin">관리자</Link>
          ) : (
            <span className="navDisabled">관리자</span>
          )}
        </nav>

        <nav className="siteNav authNav">
          {isLoggedIn ? <span className="userName">{user?.name}님</span> : null}
          {isLoggedIn ? <button type="button" onClick={logout}>로그아웃</button> : <Link to="/login">로그인</Link>}
          {!isLoggedIn ? <Link to="/signup">회원가입</Link> : null}
        </nav>
      </div>
    </header>
  )
}

export default Header
