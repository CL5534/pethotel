import { Link } from 'react-router-dom'
import './HomeHeroSection.css'

function HomeHeroSection() {
  return (
    <section

      className="heroBannerSection"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(20, 16, 14, 0.12) 0%, rgba(20, 16, 14, 0.58) 100%), url('https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1600&q=80')",
      }}
    >
           <h1>홈페이지</h1>
      <div className="heroBannerContent">
        <p className="sectionEyebrow heroBannerEyebrow">PetHotel Main</p>
        <h1>편안한 하루를 맡기고, 안심되는 케어를 바로 확인해보세요.</h1>

        <div className="heroBannerActions">
          <Link to="/booking" className="primaryLinkButton">
            예약하기
          </Link>
          <a href="#contact" className="secondaryLinkButton heroGhostButton">
            위치 / 연락처 보기
          </a>
        </div>
      </div>
    </section>
  )
}

export default HomeHeroSection
