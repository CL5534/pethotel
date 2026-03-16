function MyReservationList({ reservations, onDeleteReservation }) {
  return (
    <section className="myCard">
      <h2>예약 내역</h2>
      <table className="myTable">
        <thead>
          <tr>
            <th>예약번호</th>
            <th>일정</th>
            <th>객실</th>
            <th>반려견</th>
            <th>상태</th>
            <th>결제금액</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((item) => (
            <tr key={item.reservationCode}>
              <td>{item.reservationCode}</td>
              <td>
                {item.checkInDate} ~ {item.checkOutDate}
              </td>
              <td>{item.roomName}</td>
              <td>{item.petName}</td>
              <td>{item.status}</td>
              <td>{item.totalAmount.toLocaleString('ko-KR')}원</td>
              <td>
                <button
                  type="button"
                  className="myActionButton"
                  onClick={() => onDeleteReservation(item)}
                >
                  삭제
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default MyReservationList
