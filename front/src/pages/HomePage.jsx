import HomeContactSection from '../components/home/HomeContactSection.jsx'
import HomeHeroSection from '../components/home/HomeHeroSection.jsx'
import HomeServiceSection from '../components/home/HomeServiceSection.jsx'
import './HomePage.css'

function HomePage() {
  return (
    <div className="homePage">
      <HomeHeroSection />
      <HomeServiceSection />
      <HomeContactSection />
    </div>
  )
}

export default HomePage
