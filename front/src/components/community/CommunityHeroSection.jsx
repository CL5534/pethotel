import './CommunityHeroSection.css'

function CommunityHeroSection({ title, description }) {
  return (
    <section className="communityHeroSection">
      <div className="communityHeroContent">
        <p className="communityHeroBreadcrumb">HOME / COMMUNITY</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  )
}

export default CommunityHeroSection
