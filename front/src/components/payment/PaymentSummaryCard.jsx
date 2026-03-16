function PaymentSummaryCard({ draft }) {
  if (!draft) {
    return <p className="paymentNotice">결제할 예약 정보가 없습니다. 예약 페이지에서 다시 진행해 주세요.</p>
  }

  return (
    <section className="paymentCard">
      <h2>결제 대상 예약</h2>
      <ul className="paymentInfoList">
        <li><span>예약번호</span><strong>{draft.reservationCode}</strong></li>
        <li><span>객실</span><strong>{draft.roomName}</strong></li>
        <li><span>체크인</span><strong>{draft.checkInDate}</strong></li>
        <li><span>체크아웃</span><strong>{draft.checkOutDate}</strong></li>
        <li><span>보호자</span><strong>{draft.guardianName}</strong></li>
        <li><span>연락처</span><strong>{draft.guardianPhone}</strong></li>
      </ul>
      <div className="paymentAmountBox">
        <p>총 결제금액</p>
        <strong>{draft.totalAmount.toLocaleString('ko-KR')}원</strong>
      </div>
    </section>
  )
}

export default PaymentSummaryCard
