import './HomeContactSection.css'

function HomeContactSection() {
  return (
    <section id="contact" className="contactSection">
      <div className="sectionHeading">
        <p className="sectionEyebrow">Contact</p>
        <h2>위치 / 연락처</h2>
      </div>

      <div className="contactGrid">
        <article className="contactInfoCard">
          <p className="contactLabel">Address</p>
          <h3>PetHotel 금곡점</h3>
          <p>경기도 화성시 동탄면 금곡리 560-1, PetHotel</p>
          <p>주차 및 픽업 문의 가능</p>

          <div className="contactDivider" />

          <p className="contactLabel">Contact</p>
          <p>전화 02-555-1990</p>
          <p>메일 hello@pethotel.kr</p>
          <p>운영시간 매일 08:00 - 20:00</p>

          <a
            className="contactMapLink"
            href="https://map.naver.com/p/search/%EA%B8%88%EA%B3%A1%EB%A6%AC%20560-1?c=15.00,0,0,0,dh"
            target="_blank"
            rel="noreferrer"
          >
            네이버지도에서 보기
          </a>
        </article>

        <article className="contactMapCard">
          <div className="naverMapViewport">
            <iframe
              className="naverMapFrame"
              title="PetHotel Naver Map"
              src="https://map.naver.com/p/search/%EA%B8%88%EA%B3%A1%EB%A6%AC%20560-1"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="mapHint">
            브라우저 정책에 따라 화면 내 지도가 제한되면 왼쪽 버튼으로 네이버지도를 직접 열어주세요.
          </p>
        </article>
      </div>
    </section>
  )
}

export default HomeContactSection
