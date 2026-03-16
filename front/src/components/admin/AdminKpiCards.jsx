function AdminKpiCards({ dashboard }) {
  return (
    <section className="adminKpiGrid">
      <article className="adminKpiCard"><p>오늘 체크인</p><strong>{dashboard.todayCheckIn}</strong></article>
      <article className="adminKpiCard"><p>오늘 체크아웃</p><strong>{dashboard.todayCheckOut}</strong></article>
      <article className="adminKpiCard"><p>미결제 예약</p><strong>{dashboard.paymentPending}</strong></article>
      <article className="adminKpiCard"><p>객실 점유율</p><strong>{dashboard.occupancyRate}%</strong></article>
    </section>
  )
}

export default AdminKpiCards
