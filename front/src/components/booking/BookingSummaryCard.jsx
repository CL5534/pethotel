function BookingSummaryCard({ selectedRoom, roomLeft, nights, baseAmount, extraFee, totalAmount, policies }) {
  const toCurrency = (value) => value.toLocaleString('ko-KR')

  return (
    <aside className="bookingSummary">
      <h2>예약 요약</h2>
      <ul className="summaryList">
        <li>
          <span>객실 타입</span>
          <strong>{selectedRoom?.name ?? '-'}</strong>
        </li>
        <li>
          <span>잔여 객실</span>
          <strong>{selectedRoom ? `${roomLeft}실` : '-'}</strong>
        </li>
        <li>
          <span>숙박 일수</span>
          <strong>{nights > 0 ? `${nights}박` : '-'}</strong>
        </li>
        <li>
          <span>숙박 요금</span>
          <strong>{baseAmount > 0 ? `${toCurrency(baseAmount)}원` : '-'}</strong>
        </li>
        <li>
          <span>추가 요금</span>
          <strong>{extraFee > 0 ? `${toCurrency(extraFee)}원` : '0원'}</strong>
        </li>
        <li className="summaryTotal">
          <span>총 결제 예정금액</span>
          <strong>{totalAmount > 0 ? `${toCurrency(totalAmount)}원` : '-'}</strong>
        </li>
      </ul>

      <div className="policyCard">
        <h3>방문시간 추가요금 정책</h3>
        <ul>
          {policies.map((policy) => (
            <li key={policy.label}>
              {policy.label}: +{toCurrency(policy.fee)}원
            </li>
          ))}
          <li>07:00 이전/19:00 이후 체크인은 예약 불가</li>
        </ul>
      </div>
    </aside>
  )
}

export default BookingSummaryCard
