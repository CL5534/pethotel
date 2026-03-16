import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './AuthPage.css'

function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event) => {
    // 로그인 시도마다 이전 결과를 비워야 현재 입력 기준의 메시지만 남는다.
    event.preventDefault()
    setError('')
    setSuccess('')

    // 지금 단계에서는 프론트에서만 필수값 검증을 하고,
    // 실제 인증 실패/잠금/토큰 발급은 추후 백엔드 응답으로 대체될 예정이다.
    if (!email.trim()) {
      setError('이메일은 필수입니다.')
      return
    }

    if (!password.trim()) {
      setError('비밀번호는 필수입니다.')
      return
    }

    /*
      login()은 현재 AuthContext 안의 임시 로그인 구현을 호출한다.
      나중에 백엔드 세션 로그인으로 바뀌어도
      LoginPage 쪽에서는 이 호출부를 유지하고 AuthContext 내부만 바꾸면 된다.

      즉 이 페이지는 "입력과 검증 UI"만 책임지고,
      인증 방식 자체는 AuthContext가 책임지도록 역할을 분리한 상태다.
    */
    try {
      await login({
        email,
        password,
      })
    } catch (exception) {
      setError(exception.message || '로그인 중 오류가 발생했습니다.')
      return
    }

    // 실제 백엔드 로그인 성공 후 홈으로 이동한다.
    setSuccess('로그인에 성공했습니다. 메인으로 이동합니다.')
    window.setTimeout(() => navigate('/'), 600)
  }

  return (
    <section className="loginPageShell">
      <div className="authPage authPageLogin">
        <div className="authHeading authHeadingLogin">
          <p className="sectionEyebrow">Login</p>
          <h1>로그인</h1>
          {/* 설명 문구는 페이지 목적과 필수 입력값을 한 번에 보여주기 위한 영역이다. */}
          <p>예약 조회, 커뮤니티 글쓰기, 마이페이지 이용을 위해 로그인해 주세요.</p>
        </div>

        <form className="authForm authFormLogin" onSubmit={handleSubmit}>
          <div className="authField">
            <label htmlFor="login-email">이메일</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@pethotel.kr"
            />
          </div>

          <div className="authField">
            <label htmlFor="login-password">비밀번호</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호 입력"
            />
          </div>

          {/*
            현재는 프론트 검증 결과만 표시하지만,
            이후에는 "이메일 또는 비밀번호가 올바르지 않습니다" 같은
            서버 응답 메시지를 같은 영역에 연결하면 된다.
          */}
          {error ? <p className="authError">{error}</p> : null}
          {success ? <p className="authSuccess">{success}</p> : null}

          <div className="authActions authActionsLogin">
            <button type="submit" className="authPrimaryButton authPrimaryButtonLogin">
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          <div className="authLinkRow">
            <Link to="/signup" className="authTextLink">
              회원가입
            </Link>
            <span className="authLinkDivider" />
            <Link to="/terms" className="authTextLink">
              비밀번호 찾기
            </Link>
          </div>

          {/* 요구사항 시트의 보안 메모를 사용자가 알 수 있게 미리 노출한다. */}
          <p className="authHint authHintLogin">보안 정책상 5회 실패 시 계정 잠금 처리가 적용될 예정입니다.</p>
        </form>
      </div>
    </section>
  )
}

export default LoginPage
