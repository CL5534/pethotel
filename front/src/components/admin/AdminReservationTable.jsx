function AdminReservationTable({ reservations }) {
  return (
    <section className="adminCard">
      <h2>예약 관리</h2>
      <table className="adminTable">
        <thead>
          <tr>
            <th>예약번호</th><th>보호자</th><th>연락처</th><th>일정</th><th>상태</th><th>금액</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((item) => (
            <tr key={item.reservationCode}>
              <td>{item.reservationCode}</td>
              <td>{item.guardianName}</td>
              <td>{item.guardianPhone}</td>
              <td>{item.checkInDate} ~ {item.checkOutDate}</td>
              <td>{item.status}</td>
              <td>{item.totalAmount.toLocaleString('ko-KR')}원</td>
              <td><button type="button">상세</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default AdminReservationTable
