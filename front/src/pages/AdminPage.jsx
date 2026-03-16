import { useEffect, useMemo, useState } from 'react'
import AdminKpiCards from '../components/admin/AdminKpiCards.jsx'
import AdminReservationTable from '../components/admin/AdminReservationTable.jsx'
import AdminRoomTable from '../components/admin/AdminRoomTable.jsx'
import { getReservations, getRooms } from '../services/reservationService.js'
import './AdminPage.css'

function AdminPage() {
  const [reservations, setReservations] = useState([])
  const [rooms, setRooms] = useState([])
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

    const totalRoom = rooms.reduce((sum, room) => sum + (room.totalQuantity ?? room.capacity ?? 0), 0)
    const reservedRoom = rooms.reduce((sum, room) => sum + (room.reservedQuantity ?? 0), 0)
    const occupancyRate = totalRoom > 0 ? Math.round((reservedRoom / totalRoom) * 100) : 0

    return {
      todayCheckIn,
      todayCheckOut,
      paymentPending,
      occupancyRate,
    }
  }, [reservations, rooms])

  return (
    <section className="adminPage">
      <header className="adminHeading">
        <p className="sectionEyebrow">Admin</p>
        <h1>관리자</h1>
        <p>예약/객실/요금 운영 화면을 한 곳에서 확인할 수 있도록 구성했습니다.</p>
      </header>

      {error ? <p className="adminError">{error}</p> : null}
      <AdminKpiCards dashboard={dashboard} />
      <AdminReservationTable reservations={reservations} />
      <AdminRoomTable rooms={rooms} />
    </section>
  )
}

export default AdminPage
