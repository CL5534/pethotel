import { useEffect, useMemo, useState } from 'react'

const STATUS_FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'PAYMENT_PENDING', label: '결제대기' },
  { value: 'CONFIRMED', label: '예약확정' },
  { value: 'CHECKED_IN', label: '체크인' },
  { value: 'CHECKED_OUT', label: '체크아웃' },
  { value: 'CANCELED', label: '취소' },
]

const NEXT_STATUS_OPTIONS = {
  PAYMENT_PENDING: ['CONFIRMED', 'CANCELED'],
  CONFIRMED: ['CHECKED_IN', 'CANCELED'],
  CHECKED_IN: ['CHECKED_OUT'],
  CHECKED_OUT: [],
  CANCELED: ['PAYMENT_PENDING', 'CONFIRMED'],
}

const STATUS_LABEL = {
  PAYMENT_PENDING: '결제대기',
  CONFIRMED: '예약확정',
  CHECKED_IN: '체크인',
  CHECKED_OUT: '체크아웃',
  CANCELED: '취소',
}

const PAGE_SIZE = 10

function formatAmount(amount) {
  return `${(amount ?? 0).toLocaleString('ko-KR')}원`
}

function getTodayKst() {
  return new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString().slice(0, 10)
}

function AdminReservationTable({
  reservations,
  selectedDate,
  onSelectedDateChange,
  onUpdateStatus,
  onUpdateSchedule,
}) {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loadingCode, setLoadingCode] = useState('')
  const [page, setPage] = useState(1)

  const filteredReservations = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return reservations.filter((item) => {
      if (statusFilter !== 'ALL' && item.statusCode !== statusFilter) {
        return false
      }

      if (selectedDate) {
        const includesDate = item.checkInDate <= selectedDate && item.checkOutDate > selectedDate
        if (!includesDate) {
          return false
        }
      }

      if (!keyword) return true

      return [
        item.reservationCode,
        item.guardianName,
        item.guardianPhone,
        item.petName,
        item.roomName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    })
  }, [reservations, searchKeyword, statusFilter, selectedDate])

  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [selectedDate, statusFilter, searchKeyword])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const pagedReservations = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredReservations.slice(start, start + PAGE_SIZE)
  }, [filteredReservations, page])

  const handleUpdateStatus = async (reservation, nextStatus) => {
    if (!nextStatus) return
    setLoadingCode(reservation.reservationCode)
    try {
      await onUpdateStatus(reservation, nextStatus)
    } finally {
      setLoadingCode('')
    }
  }

  const handleUpdateSchedule = async (reservation) => {
    setLoadingCode(reservation.reservationCode)
    try {
      await onUpdateSchedule(reservation)
    } finally {
      setLoadingCode('')
    }
  }

  const handleDateChange = (value) => {
    // 브라우저 기본 date picker의 "삭제"를 눌러도 날짜 필터는 비워지지 않게 유지한다.
    onSelectedDateChange(value || getTodayKst())
  }

  return (
    <section className="adminCard">
      <div className="adminCardHeader">
        <h2>예약 관리</h2>
        <div className="adminReservationControls">
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => handleDateChange(event.target.value)}
            aria-label="날짜 필터"
          />
          <input
            type="search"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="예약번호/보호자/연락처 검색"
            aria-label="예약 검색"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="상태 필터"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <table className="adminTable">
        <thead>
          <tr>
            <th>예약번호</th>
            <th>보호자</th>
            <th>연락처</th>
            <th>반려견</th>
            <th>객실</th>
            <th>일정</th>
            <th>상태</th>
            <th>금액</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {pagedReservations.map((item) => {
            const isRowLoading = loadingCode === item.reservationCode
            const nextOptions = NEXT_STATUS_OPTIONS[item.statusCode] ?? []

            return (
              <tr key={item.reservationCode}>
                <td>{item.reservationCode}</td>
                <td>{item.guardianName}</td>
                <td>{item.guardianPhone}</td>
                <td>{item.petName || '-'}</td>
                <td>{item.roomName || '-'}</td>
                <td>{item.checkInDate} ~ {item.checkOutDate}</td>
                <td>{STATUS_LABEL[item.statusCode] ?? item.status}</td>
                <td>{formatAmount(item.totalAmount)}</td>
                <td>
                  <div className="adminActionGroup">
                    <button
                      type="button"
                      onClick={() => {
                        window.alert(
                          [
                            `예약번호: ${item.reservationCode}`,
                            `보호자: ${item.guardianName}`,
                            `연락처: ${item.guardianPhone}`,
                            `반려견: ${item.petName || '-'}`,
                            `객실: ${item.roomName || '-'}`,
                            `방문시간: ${item.visitTime || '-'}`,
                            `일정: ${item.checkInDate} ~ ${item.checkOutDate}`,
                            `상태: ${STATUS_LABEL[item.statusCode] ?? item.status}`,
                            `결제금액: ${formatAmount(item.totalAmount)}`,
                          ].join('\n'),
                        )
                      }}
                    >
                      상세
                    </button>
                    <select
                      value=""
                      disabled={isRowLoading || nextOptions.length === 0}
                      onChange={(event) => {
                        const nextStatus = event.target.value
                        event.target.value = ''
                        handleUpdateStatus(item, nextStatus)
                      }}
                      aria-label="예약 상태 변경"
                    >
                      <option value="">상태변경</option>
                      {nextOptions.map((code) => (
                        <option key={code} value={code}>{STATUS_LABEL[code]}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleUpdateSchedule(item)}
                      disabled={isRowLoading || item.statusCode === 'CANCELED'}
                    >
                      수정
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
          {pagedReservations.length === 0 ? (
            <tr>
              <td colSpan={9} className="adminEmptyRow">조회된 예약이 없습니다.</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="adminPagination">
        <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
          이전
        </button>
        <span>{page} / {totalPages}</span>
        <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
          다음
        </button>
      </div>
    </section>
  )
}

export default AdminReservationTable
