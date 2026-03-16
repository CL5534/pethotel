import { useState } from 'react'
import CommunityBoardSection from '../components/community/CommunityBoardSection.jsx'
import CommunityCategorySection from '../components/community/CommunityCategorySection.jsx'
import CommunityHeroSection from '../components/community/CommunityHeroSection.jsx'
import './CommunityPage.css'

const CATEGORIES = ['전체', '자유게시판', '질문/답변', '공지사항', '이벤트']

function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('전체')

  return (
    <div className="communityPage">
      <CommunityHeroSection
        title="커뮤니티"
        description="자유게시판, 질문/답변, 공지사항을 한 화면에서 정리해 보는 테이블형 커뮤니티입니다."
      />

      <CommunityCategorySection
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onChangeCategory={setActiveCategory}
      />

      <CommunityBoardSection
        key={activeCategory}
        categories={CATEGORIES}
        activeCategory={activeCategory}
      />
    </div>
  )
}

export default CommunityPage
