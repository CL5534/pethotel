function AdminRoomTable({ rooms }) {
  return (
    <section className="adminCard">
      <h2>객실/요금 설정</h2>
      <table className="adminTable">
        <thead>
          <tr>
            <th>객실코드</th><th>객실명</th><th>최대중량</th><th>기본요금</th><th>총 수량</th><th>잔여수량</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => {
            const left = Math.max(room.totalQuantity - room.reservedQuantity, 0)
            return (
              <tr key={room.id}>
                <td>{room.roomCode}</td>
                <td>{room.name}</td>
                <td>{room.maxWeightKg}kg</td>
                <td>{room.nightlyRate.toLocaleString('ko-KR')}원</td>
                <td>{room.totalQuantity}</td>
                <td>{left}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

export default AdminRoomTable
