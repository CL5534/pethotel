function AdminRoomTable({ rooms, onCreateRoom, onUpdateRoom, onDeleteRoom }) {
  const handleCreateRoom = async () => {
    const roomCode = window.prompt('객실 코드', 'SMALL_NEW')
    if (roomCode === null) return
    const name = window.prompt('객실명', '신규 객실')
    if (name === null) return
    const sizeType = window.prompt('객실 타입(SMALL/MEDIUM/LARGE)', 'SMALL')
    if (sizeType === null) return
    const maxWeightKg = window.prompt('최대중량(kg)', '5')
    if (maxWeightKg === null) return
    const capacity = window.prompt('객실 수량', '1')
    if (capacity === null) return
    const description = window.prompt('설명', '')
    if (description === null) return

    await onCreateRoom({
      roomCode: roomCode.trim(),
      name: name.trim(),
      sizeType: sizeType.trim().toUpperCase(),
      maxWeightKg: Number(maxWeightKg),
      capacity: Number(capacity),
      description: description.trim(),
      isActive: true,
    })
  }

  const handleUpdateRoom = async (room) => {
    const roomCode = window.prompt('객실 코드', room.roomCode)
    if (roomCode === null) return
    const name = window.prompt('객실명', room.name)
    if (name === null) return
    const sizeType = window.prompt('객실 타입(SMALL/MEDIUM/LARGE)', room.sizeType)
    if (sizeType === null) return
    const maxWeightKg = window.prompt('최대중량(kg)', String(room.maxWeightKg ?? 0))
    if (maxWeightKg === null) return
    const capacity = window.prompt('객실 수량', String(room.totalQuantity ?? room.capacity ?? 1))
    if (capacity === null) return
    const description = window.prompt('설명', room.description ?? '')
    if (description === null) return

    await onUpdateRoom(room.id, {
      roomCode: roomCode.trim(),
      name: name.trim(),
      sizeType: sizeType.trim().toUpperCase(),
      maxWeightKg: Number(maxWeightKg),
      capacity: Number(capacity),
      description: description.trim(),
      isActive: true,
    })
  }

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`${room.name} 객실을 비활성화할까요?`)) return
    await onDeleteRoom(room.id)
  }

  return (
    <section className="adminCard">
      <div className="adminCardHeader">
        <h2>객실/요금 설정</h2>
        <button type="button" onClick={handleCreateRoom}>객실 등록</button>
      </div>
      <table className="adminTable">
        <thead>
          <tr>
            <th>객실코드</th><th>객실명</th><th>타입</th><th>최대중량</th><th>기본요금</th><th>총 수량</th><th>잔여수량</th><th>관리</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => {
            const left = Math.max((room.totalQuantity ?? room.capacity ?? 0) - (room.reservedQuantity ?? 0), 0)
            return (
              <tr key={room.id}>
                <td>{room.roomCode}</td>
                <td>{room.name}</td>
                <td>{room.sizeType}</td>
                <td>{room.maxWeightKg}kg</td>
                <td>{(room.nightlyRate ?? 0).toLocaleString('ko-KR')}원</td>
                <td>{room.totalQuantity ?? room.capacity}</td>
                <td>{left}</td>
                <td>
                  <div className="adminActionGroup">
                    <button type="button" onClick={() => handleUpdateRoom(room)}>수정</button>
                    <button type="button" onClick={() => handleDeleteRoom(room)}>삭제</button>
                  </div>
                </td>
              </tr>
            )
          })}
          {rooms.length === 0 ? (
            <tr><td colSpan={8} className="adminEmptyRow">등록된 객실이 없습니다.</td></tr>
          ) : null}
        </tbody>
      </table>
    </section>
  )
}

export default AdminRoomTable
