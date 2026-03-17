import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MyPetList from '../components/mypage/MyPetList.jsx'
import MyProfileCard from '../components/mypage/MyProfileCard.jsx'
import MyReservationList from '../components/mypage/MyReservationList.jsx'
import {
  cancelMyReservation,
  getMyPets,
  getMyReservations,
  saveDraft,
  updateMyReservation,
} from '../services/reservationService.js'
import './MyPage.css'

function MyPage() {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState([])
  const [pets, setPets] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      try {
        const [reservationList, petList] = await Promise.all([
          getMyReservations(),
          getMyPets(),
        ])

        if (mounted) {
          setReservations(reservationList)
          setPets(petList)
          setError('')
          setMessage('')
        }
      } catch (exception) {
        if (mounted) {
          setReservations([])
          setPets([])
          setError(exception.message || '마이페이지 데이터를 불러오지 못했습니다.')
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  const handleCancelReservation = async (reservation) => {
    const confirmed = window.confirm('이 예약을 취소할까요?')
    if (!confirmed) return

    try {
      const canceled = await cancelMyReservation(reservation.reservationCode)
      setReservations((current) =>
        current.map((item) =>
          item.reservationCode === canceled.reservationCode ? canceled : item,
        ),
      )
      setError('')
      setMessage('예약이 취소되었습니다.')
    } catch (exception) {
      setError(exception.message || '예약 취소에 실패했습니다.')
      setMessage('')
    }
  }

  const handleRequestModifyReservation = async (reservation) => {
    const nextCheckInDate = window.prompt('변경할 체크인 날짜(YYYY-MM-DD)를 입력하세요.', reservation.checkInDate)
    if (nextCheckInDate === null) return
    const nextCheckOutDate = window.prompt('변경할 체크아웃 날짜(YYYY-MM-DD)를 입력하세요.', reservation.checkOutDate)
    if (nextCheckOutDate === null) return
    const nextVisitTime = window.prompt('변경할 방문시간(HH:mm)을 입력하세요.', reservation.visitTime || '10:00')
    if (nextVisitTime === null) return

    try {
      const updated = await updateMyReservation(reservation.reservationCode, {
        checkInDate: nextCheckInDate.trim(),
        checkOutDate: nextCheckOutDate.trim(),
        visitTime: nextVisitTime.trim(),
      })
      setReservations((current) =>
        current.map((item) =>
          item.reservationCode === updated.reservationCode ? updated : item,
        ),
      )
      setError('')
      setMessage('예약 수정 신청이 반영되었습니다.')
    } catch (exception) {
      setError(exception.message || '예약 수정 신청에 실패했습니다.')
      setMessage('')
    }
  }

  const handlePayReservation = (reservation) => {
    saveDraft({
      reservationCode: reservation.reservationCode,
      roomId: reservation.roomId,
      roomName: reservation.roomName,
      checkInDate: reservation.checkInDate,
      checkOutDate: reservation.checkOutDate,
      visitTime: reservation.visitTime,
      guardianName: reservation.guardianName,
      guardianPhone: reservation.guardianPhone,
      petName: reservation.petName,
      totalAmount: reservation.totalAmount,
      status: reservation.statusCode,
    })
    navigate('/payment')
  }

  return (
    <section className="myPage">
      <header className="myHeading">
        <p className="sectionEyebrow">MyPage</p>
        <h1>마이페이지</h1>
        <p>내 정보, 예약 내역, 반려견 정보를 한 화면에서 관리합니다.</p>
      </header>
      {error ? <p className="myError">{error}</p> : null}
      {message ? <p className="mySuccess">{message}</p> : null}

      <div className="myLayout">
        <MyProfileCard />
        <MyPetList pets={pets} onChangePets={setPets} />
      </div>

      <MyReservationList
        reservations={reservations}
        onPayReservation={handlePayReservation}
        onCancelReservation={handleCancelReservation}
        onRequestModifyReservation={handleRequestModifyReservation}
      />
    </section>
  )
}

export default MyPage
