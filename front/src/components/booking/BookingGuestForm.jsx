function BookingGuestForm({ form, today, pets, onChange, onGoMyPage }) {
  const hasPets = pets.length > 0

  return (
    <>
      <div className="bookingDateRow bookingFieldFull">
        <label className="bookingField bookingDateField">
          <span>체크인 날짜 (필수)</span>
          <input type="date" min={today} value={form.checkInDate} onChange={(event) => onChange('checkInDate', event.target.value)} />
        </label>

        <label className="bookingField bookingDateField">
          <span>체크아웃 날짜 (필수)</span>
          <input type="date" min={form.checkInDate || today} value={form.checkOutDate} onChange={(event) => onChange('checkOutDate', event.target.value)} />
        </label>
      </div>

      <label className="bookingField">
        <span>체크인 희망 방문시간 (07:00~19:00)</span>
        <input type="time" min="07:00" max="19:00" value={form.visitTime} onChange={(event) => onChange('visitTime', event.target.value)} />
      </label>

      <label className="bookingField">
        <span>보호자 이름 (필수)</span>
        <input type="text" value={form.ownerName} placeholder="보호자 이름" onChange={(event) => onChange('ownerName', event.target.value)} />
      </label>

      <label className="bookingField">
        <span>연락처 (필수)</span>
        <input type="tel" value={form.contact} placeholder="010-1234-5678" onChange={(event) => onChange('contact', event.target.value)} />
      </label>

      <label className="bookingField">
        <span>반려견 선택 (필수)</span>
        <select
          value={form.petId}
          onChange={(event) => onChange('petId', event.target.value)}
          disabled={!hasPets}
        >
          <option value="">반려견 선택</option>
          {pets.map((pet) => (
            <option key={pet.id} value={pet.id}>
              {pet.name} ({pet.breed})
            </option>
          ))}
        </select>
      </label>

      {!hasPets ? (
        <div className="bookingField bookingFieldFull">
          <p>등록된 반려견이 없습니다. 마이페이지에서 먼저 등록해주세요.</p>
          <button type="button" className="bookingSecondaryButton" onClick={onGoMyPage}>
            마이페이지로 이동
          </button>
        </div>
      ) : null}

      <label className="bookingField">
        <span>반려견 이름</span>
        <input type="text" value={form.petName} readOnly />
      </label>

      <label className="bookingField">
        <span>견종</span>
        <input type="text" value={form.petBreed} readOnly />
      </label>

      <label className="bookingField">
        <span>반려견 나이</span>
        <input type="text" value={form.petAge} readOnly />
      </label>

      <label className="bookingField bookingFieldFull">
        <span>특이사항</span>
        <textarea rows="3" value={form.notes} readOnly />
      </label>
    </>
  )
}

export default BookingGuestForm
