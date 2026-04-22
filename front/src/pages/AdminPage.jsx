import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import AdminKpiCards from '../components/admin/AdminKpiCards.jsx'
import AdminReservationTable from '../components/admin/AdminReservationTable.jsx'
import AdminRoomTable from '../components/admin/AdminRoomTable.jsx'
import {
  adminUpdateReservation,
  adminUpdateReservationStatus,
  getReservations,
  getRooms,
  updateAdminRoom,
} from '../services/reservationService.js'
import './AdminPage.css'

const ADMIN_SECTIONS = [
  { key: 'dashboard', label: '대시보드' },
  { key: 'reservation', label: '예약관리' },
  { key: 'room', label: '객실/요금설정' },
]

function AdminPage() {
  const { isAdmin } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')
  const [reservations, setReservations] = useState([])
  const [rooms, setRooms] = useState([])
  const [selectedDate, setSelectedDate] = useState(() => new Date(Date.now() + (9 * 60 * 60 * 1000)).toISOString().slice(0, 10))
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        const [reservationList, roomList] = await Promise.all([
          getReservations(),
          getRooms(),
        ])

        if (mounted) {
          setReservations(reservationList)
          setRooms(roomList)
          setError('')
        }
      } catch (exception) {
        if (mounted) {
          setReservations([])
          setRooms([])
          setError(exception.message || '관리자 데이터를 불러오지 못했습니다.')
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  const dashboard = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayCheckIn = reservations.filter((item) => item.checkInDate === today).length
    const todayCheckOut = reservations.filter((item) => item.checkOutDate === today).length
    const paymentPending = reservations.filter((item) => item.statusCode === 'PAYMENT_PENDING').length
    const todayRevenue = reservations
      .filter((item) => item.checkInDate === today && item.statusCode !== 'CANCELED')
      .reduce((sum, item) => sum + (item.totalAmount ?? 0), 0)
    const monthPrefix = today.slice(0, 7)
    const monthRevenue = reservations
      .filter((item) => item.checkInDate?.startsWith(monthPrefix) && item.statusCode !== 'CANCELED')
      .reduce((sum, item) => sum + (item.totalAmount ?? 0), 0)

    const totalRoom = rooms.reduce((sum, room) => sum + (room.totalQuantity ?? room.capacity ?? 0), 0)
    const reservedRoom = rooms.reduce((sum, room) => sum + (room.reservedQuantity ?? 0), 0)
    const occupancyRate = totalRoom > 0 ? Math.round((reservedRoom / totalRoom) * 100) : 0

    const dateReservations = reservations.filter((item) => (
      item.checkInDate <= selectedDate && item.checkOutDate > selectedDate && item.statusCode !== 'CANCELED'
    ))
    const selectedDateReservations = dateReservations.length
    const selectedDateOccupancy = totalRoom > 0
      ? Math.round((selectedDateReservations / totalRoom) * 100)
      : 0
    const selectedDateCheckIn = reservations.filter((item) => item.checkInDate === selectedDate).length
    const selectedDateCheckOut = reservations.filter((item) => item.checkOutDate === selectedDate).length
    const selectedDateRevenue = reservations
      .filter((item) => item.checkInDate === selectedDate && item.statusCode !== 'CANCELED')
      .reduce((sum, item) => sum + (item.totalAmount ?? 0), 0)
    const selectedDateStatus = {
      paymentPending: dateReservations.filter((item) => item.statusCode === 'PAYMENT_PENDING').length,
      confirmed: dateReservations.filter((item) => item.statusCode === 'CONFIRMED').length,
      checkedIn: dateReservations.filter((item) => item.statusCode === 'CHECKED_IN').length,
      checkedOut: dateReservations.filter((item) => item.statusCode === 'CHECKED_OUT').length,
      canceled: reservations.filter(
        (item) =>
          item.statusCode === 'CANCELED'
          && (item.checkInDate === selectedDate || item.checkOutDate === selectedDate),
      ).length,
    }

    return {
      todayCheckIn,
      todayCheckOut,
      paymentPending,
      occupancyRate,
      todayRevenue,
      monthRevenue,
      selectedDateReservations,
      selectedDateOccupancy,
      selectedDateCheckIn,
      selectedDateCheckOut,
      selectedDateRevenue,
      selectedDateStatus,
    }
  }, [reservations, rooms, selectedDate])

  const handleAdminStatusUpdate = async (reservation, status) => {
    try {
      const updated = await adminUpdateReservationStatus(reservation.reservationCode, status)
      setReservations((current) =>
        current.map((item) =>
          item.reservationCode === updated.reservationCode ? updated : item,
        ),
      )
      setError('')
    } catch (exception) {
      setError(exception.message || '관리자 상태 변경에 실패했습니다.')
    }
  }

  const handleAdminScheduleUpdate = async (reservation) => {
    const checkInDate = window.prompt('체크인 날짜(YYYY-MM-DD)', reservation.checkInDate)
    if (checkInDate === null) return

    const checkOutDate = window.prompt('체크아웃 날짜(YYYY-MM-DD)', reservation.checkOutDate)
    if (checkOutDate === null) return

    const guardianName = window.prompt('보호자명', reservation.guardianName)
    if (guardianName === null) return

    const guardianPhone = window.prompt('연락처', reservation.guardianPhone)
    if (guardianPhone === null) return

    const roomIdAnswer = window.prompt('객실 ID 변경(유지하려면 비움)', '')
    if (roomIdAnswer === null) return

    const overrideAnswer = window.prompt('재고 검증 실패 시 오버라이드 적용? (Y/N)', 'N')
    const overrideMode = (overrideAnswer ?? '').trim().toUpperCase() === 'Y'
    let overrideReason = ''

    if (overrideMode) {
      overrideReason = window.prompt('오버라이드 사유', '') ?? ''
    }

    const roomId = roomIdAnswer.trim() ? Number(roomIdAnswer.trim()) : null

    try {
      const updated = await adminUpdateReservation(reservation.reservationCode, {
        checkInDate: checkInDate.trim(),
        checkOutDate: checkOutDate.trim(),
        guardianName: guardianName.trim(),
        guardianPhone: guardianPhone.trim(),
        roomId: Number.isFinite(roomId) ? roomId : undefined,
        overrideMode,
        overrideReason: overrideReason.trim(),
      })
      setReservations((current) =>
        current.map((item) =>
          item.reservationCode === updated.reservationCode ? updated : item,
        ),
      )
      setError('')
    } catch (exception) {
      setError(exception.message || '관리자 예약 수정에 실패했습니다.')
    }
  }

  const refreshRooms = async () => {
    const roomList = await getRooms()
    setRooms(roomList)
  }

  const handleUpdateRoom = async (roomId, payload) => {
    try {
      await updateAdminRoom(roomId, payload)
      await refreshRooms()
      setError('')
    } catch (exception) {
      setError(exception.message || '객실 수정에 실패했습니다.')
    }
  }

  if (!isAdmin) {
    return (
      <section className="adminPage">
        <header className="adminHeading">
          <p className="sectionEyebrow">Admin</p>
          <h1>관리자</h1>
          <p>관리자 계정으로 로그인해야 접근할 수 있습니다.</p>
        </header>
      </section>
    )
  }

  return (
    <section className="adminPage">
      <header className="adminHeading">
        <p className="sectionEyebrow">Admin</p>
        <h1>관리자</h1>
        <p>예약/객실/요금 운영 화면을 한 곳에서 확인하도록 구성했습니다.</p>
      </header>

      {error ? <p className="adminError">{error}</p> : null}

      <div className="adminLayout">
        <aside className="adminSidebar">
          {ADMIN_SECTIONS.map((section) => (
            <button
              key={section.key}
              type="button"
              className={`adminMenuButton${activeSection === section.key ? ' active' : ''}`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
          {activeSection === 'dashboard' ? (
            <div className="adminSidebarCalendar">
              <p className="adminCalendarTitle">대시보드 날짜</p>
              <input
                type="date"
                className="adminCalendarInput"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>
          ) : null}
        </aside>

        <div className="adminContent">
          {activeSection === 'dashboard' ? (
            <AdminKpiCards dashboard={dashboard} selectedDate={selectedDate} />
          ) : null}

          {activeSection === 'reservation' ? (
            <AdminReservationTable
              reservations={reservations}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              onUpdateStatus={handleAdminStatusUpdate}
              onUpdateSchedule={handleAdminScheduleUpdate}
            />
          ) : null}

          {activeSection === 'room' ? (
            <AdminRoomTable
              rooms={rooms}
              onUpdateRoom={handleUpdateRoom}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default AdminPage
