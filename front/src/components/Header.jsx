import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Header.css'

function Header() {
  const { isLoggedIn, logout, user } = useAuth()
  const isAdminLoggedIn = false

  const navClass = ({ isActive }) => (isActive ? 'activeNav' : '')

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
          <NavLink to="/" className={navClass} end>
            Home
          </NavLink>
          <NavLink to="/booking" className={navClass}>
            예약
          </NavLink>
          <NavLink to="/mypage" className={navClass}>
            마이페이지
          </NavLink>
          <NavLink to="/community" className={navClass}>
            커뮤니티
          </NavLink>
          {isAdminLoggedIn ? (
            <NavLink to="/admin" className={navClass}>
              관리자
            </NavLink>
          ) : (
            <span className="navDisabled">관리자</span>
          )}
        </nav>

        <nav className="siteNav authNav">
          {isLoggedIn ? <span className="userName">{user?.name}님</span> : null}
          {isLoggedIn ? (
            <button type="button" onClick={logout}>
              로그아웃
            </button>
          ) : (
            <NavLink to="/login" className={navClass}>
              로그인
            </NavLink>
          )}
          {!isLoggedIn ? (
            <NavLink to="/signup" className={navClass}>
              회원가입
            </NavLink>
          ) : null}
        </nav>
      </div>
    </header>
  )
}

export default Header
