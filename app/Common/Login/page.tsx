import Link from "next/link";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        {/* 로고 및 헤더 */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold text-3xl mb-2 hover:opacity-80 transition-opacity">
            <span>🐾</span>
            <span>PET HOTEL</span>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            보호자님, 환영합니다!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            아이들의 소식을 확인하시려면 로그인해주세요.
          </p>
        </div>
        
        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-bold text-gray-700">
                  비밀번호
                </label>
                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500">
                  비밀번호 찾기
                </a>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">
              로그인 상태 유지
            </label>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3.5 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg shadow-blue-100 hover:shadow-xl hover:-translate-y-0.5"
          >
            로그인
          </button>
        </form>

        {/* 소셜 로그인 구분선 */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                간편 로그인
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl shadow-sm bg-[#FEE500] text-sm font-medium text-[#191919] hover:bg-[#FDD835] transition-colors">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C7.58 3 4 5.79 4 9.24c0 2.16 1.4 4.06 3.54 5.17-.16.58-.57 2.1-.66 2.42-.1.38.14.38.29.25l3.52-2.33c.43.06.87.09 1.31.09 4.42 0 8-2.79 8-6.24C20 5.79 16.42 3 12 3z" />
              </svg>
              Kakao
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-sm text-gray-600">
          아직 계정이 없으신가요?{' '}
          <Link href="/Common/Signup" className="font-bold text-blue-600 hover:text-blue-700 ml-1">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}