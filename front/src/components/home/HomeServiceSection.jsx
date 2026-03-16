import './HomeServiceSection.css'

const roomGuides = [
  {
    title: '소형견 전용룸',
    target: '5kg 이하',
    description:
      '포근한 침구와 낮은 동선으로 낯가림 있는 작은 강아지도 편안하게 머물 수 있는 아늑한 객실입니다.',
    image:
      'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1600&q=80',
  },
  {
    title: '중형견 케어룸',
    target: '10kg 이하',
    description:
      '활동량이 있는 강아지를 고려해 머무는 공간과 쉬는 공간을 안정적으로 나눈 여유 있는 객실입니다.',
    image:
      'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1600&q=80',
  },
]

function HomeServiceSection() {
  return (
    <section id="service" className="contentSection">
      <div className="sectionHeading">
        <p className="sectionEyebrow">Dog Room</p>
        <h2>강아지 객실 안내</h2>
      </div>

      <div className="serviceGrid">
        {roomGuides.map((room) => (
          <article key={room.title} className="serviceCard serviceRoomCard">
            <img
              className="serviceRoomImage"
              src={room.image}
              alt={room.title}
            />
            <div className="serviceRoomBody">
              <span className="serviceBadge">{room.target}</span>
              <h3>{room.title}</h3>
              <p>{room.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default HomeServiceSection
