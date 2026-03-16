import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './AuthPage.css'

const API_BASE_URL = 'http://localhost:8080'

function SignUpPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    address: '',
    terms: false,
    privacy: false,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (key, value) => {
    /*
      입력 필드가 많아서 각 useState를 따로 두는 대신 form 객체 하나로 관리한다.
      새 필드를 추가할 때는
      1. 초기값 추가
      2. input 추가
      3. 필요하면 검증 로직 추가
      정도만 하면 되므로 유지보수가 쉽다.
    */
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event) => {
    // 제출 전에 메시지를 초기화하고, 아래에서 순차적으로 필수 검증을 수행한다.
    event.preventDefault()
    setError('')
    setSuccess('')

    /*
      현재는 요구사항 시트 기준의 프론트 검증만 수행한다.
      나중에 백엔드 회원가입 API를 붙일 때는:

      1. 아래 프론트 검증 유지
      2. POST /api/users/signup 호출
      3. 성공 시 /login 이동

      순서로 확장하면 된다.

      프론트 검증을 먼저 두는 이유는:
      - 서버 호출 전에 즉시 피드백을 줄 수 있고
      - 불필요한 요청을 줄일 수 있기 때문이다.
    */
    if (!form.name.trim()) {
      setError('이름은 필수입니다.')
      return
    }

    if (!form.email.trim()) {
      setError('이메일은 필수입니다.')
      return
    }

    if (!form.password.trim() || !form.passwordConfirm.trim()) {
      setError('비밀번호와 비밀번호 확인은 필수입니다.')
      return
    }

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    if (!form.phone.trim()) {
      setError('연락처는 필수입니다.')
      return
    }

    if (!form.address.trim()) {
      setError('주소는 필수입니다.')
      return
    }

    if (!form.terms || !form.privacy) {
      setError('필수 약관에 모두 동의해야 합니다.')
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
        }),
      })

      const responseBody = await response.json().catch(() => null)

      if (!response.ok) {
        setError(responseBody?.message || '회원가입에 실패했습니다.')
        return
      }
    } catch {
      setError('백엔드 서버와 연결하지 못했습니다.')
      return
    }

    // 실제 회원가입 성공 후 로그인 페이지로 이동한다.
    setSuccess('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.')
    window.setTimeout(() => navigate('/login'), 700)
  }

  return (
    <section className="authPage">
      <div className="authHeading">
        <p className="sectionEyebrow">Sign Up</p>
        <h1>회원가입</h1>
        {/* 회원가입에서 어떤 정보를 받는지 먼저 설명하는 영역 */}
        <p>기본 정보를 입력하고 약관에 동의하면 가입을 진행할 수 있습니다.</p>
      </div>

      <form className="authForm" onSubmit={handleSubmit}>
        <div className="authField">
          <label htmlFor="signup-name">이름</label>
          <input
            id="signup-name"
            type="text"
            value={form.name}
            onChange={(event) => handleChange('name', event.target.value)}
            placeholder="이름 입력"
          />
        </div>

        <div className="authField">
          <label htmlFor="signup-email">이메일</label>
          <input
            id="signup-email"
            type="email"
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
            placeholder="example@pethotel.kr"
          />
        </div>

        <div className="authField">
          <label htmlFor="signup-password">비밀번호</label>
          <input
            id="signup-password"
            type="password"
            value={form.password}
            onChange={(event) => handleChange('password', event.target.value)}
            placeholder="비밀번호 입력"
          />
        </div>

        <div className="authField">
          <label htmlFor="signup-password-confirm">비밀번호 확인</label>
          <input
            id="signup-password-confirm"
            type="password"
            value={form.passwordConfirm}
            onChange={(event) => handleChange('passwordConfirm', event.target.value)}
            placeholder="비밀번호 다시 입력"
          />
        </div>

        <div className="authField">
          <label htmlFor="signup-phone">연락처</label>
          <input
            id="signup-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => handleChange('phone', event.target.value)}
            placeholder="010-0000-0000"
          />
        </div>

        <div className="authField">
          <label htmlFor="signup-address">주소</label>
          <input
            id="signup-address"
            type="text"
            value={form.address}
            onChange={(event) => handleChange('address', event.target.value)}
            placeholder="주소 입력"
          />
        </div>

        <div className="authCheckboxGroup">
          {/*
            필수 동의 항목은 요구사항상 가입 차단 조건이다.
            따라서 UI에 표시만 하는 것이 아니라 submit 시점에 실제로 검사한다.
          */}
          <label className="authCheckbox">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(event) => handleChange('terms', event.target.checked)}
            />
            <span>이용약관에 동의합니다. (필수)</span>
          </label>

          <label className="authCheckbox">
            <input
              type="checkbox"
              checked={form.privacy}
              onChange={(event) => handleChange('privacy', event.target.checked)}
            />
            <span>개인정보 처리방침에 동의합니다. (필수)</span>
          </label>
        </div>

        {error ? <p className="authError">{error}</p> : null}
        {success ? <p className="authSuccess">{success}</p> : null}

        <div className="authActions">
          <button type="submit" className="authPrimaryButton">
            회원가입
          </button>
          <Link to="/login" className="authSecondaryLink">
            로그인으로 이동
          </Link>
        </div>

        {/* 선택 기능으로 남아 있는 이메일 인증은 후속 작업 대상임을 명시한다. */}
        <p className="authHint">이메일 인증은 추후 연동 예정입니다.</p>
      </form>
    </section>
  )
}

export default SignUpPage
