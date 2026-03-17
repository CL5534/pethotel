function BookingRoomSelector({ rooms, selectedRoomId, hasError, onSelectRoom }) {
  return (
    <div className="bookingField bookingFieldFull">
      <span>객실 타입 (필수)</span>
      <div className="bookingRoomGrid">
        {rooms.map((room) => {
          const left = Math.max(room.totalQuantity - room.reservedQuantity, 0)
          const isSelected = String(selectedRoomId) === String(room.id)
          return (
            <button
              key={room.id}
              type="button"
              className={`bookingRoomCard${isSelected ? ' isSelected' : ''}${hasError && !isSelected ? ' hasError' : ''}`}
              onClick={() => onSelectRoom(room.id)}
              aria-invalid={hasError && !isSelected ? 'true' : 'false'}
            >
              <span className="bookingRoomBadge">{room.maxWeightKg}kg 이하</span>
              <strong>{room.name}</strong>
              <p>{room.description}</p>
              <small>
                총 {room.totalQuantity}실 / 잔여 {left}실 / 1박 {room.nightlyRate.toLocaleString('ko-KR')}원
              </small>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BookingRoomSelector
