function AdminKpiCards({ dashboard, selectedDate }) {
  const formatWon = (amount) => `${(amount ?? 0).toLocaleString('ko-KR')}원`

  return (
    <section className="adminKpiGrid">
      <article className="adminKpiCard"><p>오늘 체크인</p><strong>{dashboard.todayCheckIn}</strong></article>
      <article className="adminKpiCard"><p>오늘 체크아웃</p><strong>{dashboard.todayCheckOut}</strong></article>
      <article className="adminKpiCard"><p>미결제 예약</p><strong>{dashboard.paymentPending}</strong></article>
      <article className="adminKpiCard"><p>객실 점유율</p><strong>{dashboard.occupancyRate}%</strong></article>
      <article className="adminKpiCard"><p>오늘 매출</p><strong>{formatWon(dashboard.todayRevenue)}</strong></article>
      <article className="adminKpiCard"><p>이번 달 매출</p><strong>{formatWon(dashboard.monthRevenue)}</strong></article>
      <article className="adminKpiCard"><p>{selectedDate} 예약 건수</p><strong>{dashboard.selectedDateReservations}</strong></article>
      <article className="adminKpiCard"><p>{selectedDate} 점유율</p><strong>{dashboard.selectedDateOccupancy}%</strong></article>
    </section>
  )
}

export default AdminKpiCards
