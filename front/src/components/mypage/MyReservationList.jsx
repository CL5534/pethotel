import { Fragment, useMemo, useState } from 'react'

function toDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function addDays(value, days) {
  const base = toDate(value)
  if (!base) return ''
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

function getKstToday() {
  return new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString().slice(0, 10)
}

function canCancel(reservation) {
  const cancellableStatus = reservation.statusCode === 'PAYMENT_PENDING' || reservation.statusCode === 'CONFIRMED'
  return cancellableStatus && reservation.checkInDate > getKstToday()
}

function canRequestModify(reservation) {
  const modifiableStatus = reservation.statusCode === 'PAYMENT_PENDING' || reservation.statusCode === 'CONFIRMED'
  const customerDeadline = addDays(reservation.checkInDate, -3)
  return modifiableStatus && customerDeadline && getKstToday() <= customerDeadline
}

function normalizePhone(value) {
  return (value ?? '').replace(/\D/g, '')
}

function resolvePaymentStatus(statusCode) {
  if (statusCode === 'PAYMENT_PENDING') return '결제대기'
  if (statusCode === 'CANCELED') return '결제취소'
  return '결제완료'
}

function MyReservationList({
  reservations,
  onPayReservation,
  onCancelReservation,
  onRequestModifyReservation,
}) {
  const [expandedCode, setExpandedCode] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyPhone, setVerifyPhone] = useState('')
  const [verifiedReservationCode, setVerifiedReservationCode] = useState('')
  const [verifyMessage, setVerifyMessage] = useState('')

  const visibleReservations = useMemo(() => {
    if (!verifiedReservationCode) return reservations
    return reservations.filter((item) => item.reservationCode === verifiedReservationCode)
  }, [reservations, verifiedReservationCode])

  const handleVerify = () => {
    const code = verifyCode.trim()
    const phone = normalizePhone(verifyPhone)
    if (!code || !phone) {
      setVerifyMessage('예약번호와 연락처를 모두 입력해주세요.')
      return
    }

    const matched = reservations.find(
      (item) => item.reservationCode === code && normalizePhone(item.guardianPhone) === phone,
    )
    if (!matched) {
      setVerifiedReservationCode('')
      setVerifyMessage('예약번호와 연락처가 일치하는 예약을 찾지 못했습니다.')
      return
    }

    setVerifiedReservationCode(matched.reservationCode)
    setExpandedCode(matched.reservationCode)
    setVerifyMessage('일치하는 예약을 확인했습니다.')
  }

  const clearVerify = () => {
    setVerifyCode('')
    setVerifyPhone('')
    setVerifiedReservationCode('')
    setVerifyMessage('')
  }

  return (
    <section className="myCard">
      <h2>예약 내역</h2>
      <div className="myVerifyBar">
        <input
          value={verifyCode}
          placeholder="예약번호"
          onChange={(event) => setVerifyCode(event.target.value)}
        />
        <input
          value={verifyPhone}
          placeholder="연락처(숫자만 가능)"
          onChange={(event) => setVerifyPhone(event.target.value)}
        />
        <button type="button" className="myActionButton" onClick={handleVerify}>검증</button>
        <button type="button" className="myActionButton" onClick={clearVerify}>초기화</button>
      </div>
      {verifyMessage ? <p className="myMuted">{verifyMessage}</p> : null}

      <table className="myTable">
        <thead>
          <tr>
            <th>예약번호</th>
            <th>일정</th>
            <th>객실</th>
            <th>반려견</th>
            <th>예약상태</th>
            <th>결제상태</th>
            <th>결제금액</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {visibleReservations.map((item) => (
            <Fragment key={item.reservationCode}>
              <tr className={verifiedReservationCode === item.reservationCode ? 'myVerifiedRow' : ''}>
                <td>{item.reservationCode}</td>
                <td>
                  {item.checkInDate} ~ {item.checkOutDate}
                </td>
                <td>{item.roomName}</td>
                <td>{item.petName}</td>
                <td>{item.status}</td>
                <td>{resolvePaymentStatus(item.statusCode)}</td>
                <td>{item.totalAmount.toLocaleString('ko-KR')}원</td>
                <td>
                  <div className="myTableActions">
                    <button
                      type="button"
                      className="myActionButton primary"
                      onClick={() => onPayReservation(item)}
                      disabled={item.statusCode !== 'PAYMENT_PENDING'}
                    >
                      결제하기
                    </button>
                    <button
                      type="button"
                      className="myActionButton"
                      onClick={() => setExpandedCode(expandedCode === item.reservationCode ? '' : item.reservationCode)}
                    >
                      상세
                    </button>
                    <button
                      type="button"
                      className="myActionButton"
                      onClick={() => onRequestModifyReservation(item)}
                      disabled={!canRequestModify(item)}
                    >
                      수정 신청
                    </button>
                    <button
                      type="button"
                      className="myActionButton"
                      onClick={() => onCancelReservation(item)}
                      disabled={!canCancel(item)}
                    >
                      취소
                    </button>
                  </div>
                </td>
              </tr>
              {expandedCode === item.reservationCode ? (
                <tr className="myDetailRow">
                  <td colSpan="8">
                    <div className="myDetailGrid">
                      <p><strong>보호자:</strong> {item.guardianName}</p>
                      <p><strong>연락처:</strong> {item.guardianPhone}</p>
                      <p><strong>방문시간:</strong> {item.visitTime || '-'}</p>
                      <p><strong>상태코드:</strong> {item.statusCode}</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
          {visibleReservations.length === 0 ? (
            <tr>
              <td colSpan="8" className="myEmptyCell">표시할 예약이 없습니다.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  )
}

export default MyReservationList
