import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full py-6 border-t bg-gray-50 text-gray-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-2">
        {/* 서비스 이름 */}
        <p className="font-bold text-blue-600 text-sm">PET HOTEL SERVICE</p>
        
        {/* 카피라이트 */}
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} PetHotel. All rights reserved.
        </p>
        
        {/* 간단한 링크 (나중에 수정 가능) */}
        <div className="flex gap-4 text-xs mt-2">
          <span className="hover:underline cursor-pointer">이용약관</span>
          <span className="hover:underline cursor-pointer">개인정보처리방침</span>
        </div>
      </div>
    </footer>
  );
}