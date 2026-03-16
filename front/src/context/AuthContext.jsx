import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const AUTH_STORAGE_KEY = 'authSession'
const API_BASE_URL = 'http://localhost:8080'

function getStoredToken() {
  // 새로고침 이후에도 로그인 여부를 복원하기 위해 sessionStorage에서 토큰만 읽어온다.
  // 현재는 임시 프론트 토큰이지만, 나중에 백엔드 세션/JSESSIONID 구조로 바뀌면
  // 이 부분은 "서버에서 현재 로그인 사용자 조회" 쪽으로 대체될 가능성이 높다.
  const storedSession = sessionStorage.getItem(AUTH_STORAGE_KEY)

  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession)?.accessToken ?? null
  } catch {
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function AuthProvider({ children }) {
  /*
    AuthContext는 "로그인 상태를 앱 전체에서 공통으로 쓰기 위한 전역 저장소"다.
    이 파일 하나로 로그인/로그아웃/현재 사용자 상태를 관리하면,
    Header, LoginPage, MyPage 같은 여러 화면이 서로 직접 의존하지 않아도 된다.

    user:
    - 헤더에서 "OOO님" 표시 같은 UI용 데이터
    - 현재는 메모리 상태만 유지하므로 새로고침하면 사라진다.

    accessToken:
    - 로그인 여부를 판단하는 최소 값
    - 현재는 sessionStorage에 저장해서 새로고침 시 유지한다.

    실제 백엔드 세션 도입 후에는:
    - accessToken 대신 서버 세션 확인 결과를 사용할 가능성이 높다.
    - user는 /me 같은 API 응답으로 다시 채우는 구조가 된다.
  */
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(() => getStoredToken())
  const [isLoading, setIsLoading] = useState(false)

  const fetchCurrentUser = async () => {
    /*
      세션 기반 인증에서는 accessToken보다 "현재 세션 사용자 조회"가 더 중요하다.
      새로고침 후에도 JSESSIONID 쿠키가 살아 있으면 /api/users/me 응답으로
      헤더 사용자명을 다시 복원할 수 있다.
    */
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('현재 로그인 사용자 정보를 불러오지 못했습니다.')
    }

    const currentUser = await response.json()
    setUser(currentUser)
    return currentUser
  }

  const login = async ({ email, password }) => {
    /*
      LoginPage는 email/password만 넘기고,
      실제 세션 생성과 사용자 상태 반영은 여기서 담당한다.
      fetch에 credentials: 'include'를 넣어야 브라우저가 JSESSIONID 쿠키를 저장한다.
    */
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const responseBody = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(responseBody?.message || '로그인에 실패했습니다.')
      }

      /*
        실제 인증 주체는 세션 쿠키다.
        sessionStorage에는 "로그인 시도 완료" 정도의 보조 값만 남겨
        새로고침 시 fetchCurrentUser()를 실행할 근거로만 사용한다.
      */
      const nextToken = `session_${Date.now()}`
      const nextUser = responseBody

      setAccessToken(nextToken)
      setUser(nextUser)
      return { accessToken: nextToken, user: nextUser }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    /*
      세션 기반 로그아웃은 서버 세션을 먼저 끊고,
      그다음 프론트 상태를 비워야 한다.
    */
    return fetch(`${API_BASE_URL}/api/users/logout`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      setAccessToken(null)
      setUser(null)
    })
  }

  useEffect(() => {
    /*
      개발자도구 Application > Session Storage에서 바로 확인할 수 있도록
      토큰만 저장한다. 사용자 정보까지 저장하지 않는 이유는:

      1. 지금 단계에서 storage에 민감한 값을 많이 두지 않기 위해
      2. 나중에 세션 기반 인증으로 갈 때 저장 구조를 단순하게 유지하기 위해

      참고:
      - 현재 accessToken은 UI 테스트용 임시 값이다.
      - 실제 세션 인증에서는 브라우저 쿠키가 주체가 되고,
        이 저장소는 제거되거나 최소한의 보조 정보만 남길 가능성이 높다.
    */
    if (accessToken) {
      sessionStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ accessToken }),
      )
      return
    }

    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  }, [accessToken])

  useEffect(() => {
    /*
      sessionStorage에 보조 플래그가 있으면 세션 쿠키도 살아 있을 가능성이 있으므로
      앱 시작 시 현재 사용자 정보를 다시 조회한다.
      실패하면 세션이 만료된 것으로 보고 프론트 상태도 정리한다.
    */
    if (!accessToken) {
      return
    }

    fetchCurrentUser().catch(() => {
      setAccessToken(null)
      setUser(null)
    })
  }, [accessToken])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      // 화면에서는 accessToken 존재 여부만으로 로그인 상태를 단순 판단한다.
      // 이후 권한(role)이나 만료(expireAt)가 생기면 이 객체에 같이 확장하면 된다.
      isLoggedIn: Boolean(accessToken),
      isLoading,
      login,
      logout,
      fetchCurrentUser,
    }),
    [user, accessToken, isLoading],
  )

  // value를 Provider로 감싸서 Header, LoginPage 등 어느 위치에서도 useAuth()로 접근 가능하게 한다.
  // Prop drilling 없이 인증 상태를 공유하기 위한 React Context의 표준 패턴이다.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    // Provider 밖에서 훅을 호출하면 로그인 상태를 읽을 수 없기 때문에
    // 개발 중 바로 오류를 내서 구조 문제를 빨리 찾게 한다.
    // 조용히 undefined를 반환하면 원인 추적이 어려워지므로 명시적으로 막는다.
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export { AuthProvider, useAuth }
