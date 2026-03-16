import './Footer.css'

function Footer() {
  return (
    <footer className="siteFooter">
      <div className="siteFooterInner">
        <div className="footerBrandBlock">
          <p className="footerEyebrow">PetHotel</p>
          <strong className="footerTitle">PetHotel 운영 정보</strong>
          <p className="footerText">
            사업장 정보와 주요 정책 링크를 제공해 이용자에게 필요한 기본 정보를 안내합니다.
          </p>
        </div>

        <div className="footerInfoGrid">
          <div className="footerColumn">
            <h3>Business Info</h3>
            <p>상호 펫호텔</p>
            <p>주소 경기도 화성시 동탄면 금곡리 560-1, PetHotel</p>
            <p>연락처 02-555-1990</p>
            <p>운영시간 매일 08:00 - 20:00</p>
          </div>

          <div className="footerColumn">
            <h3>Policy</h3>
            <a href="/terms">이용약관</a>
            <a href="/privacy">개인정보처리방침</a>
            <a href="https://map.naver.com" target="_blank" rel="noreferrer">
              지도 보기
            </a>
          </div>

          <div className="footerColumn">
            <h3>Support</h3>
            <p>메일 hello@pethotel.kr</p>
            <p>예약 및 체크인 문의 가능</p>
            <p>운영 정책은 관리자 설정에 따라 갱신됩니다.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
