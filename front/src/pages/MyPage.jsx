import { useEffect, useState } from 'react'
import MyPetList from '../components/mypage/MyPetList.jsx'
import MyProfileCard from '../components/mypage/MyProfileCard.jsx'
import MyReservationList from '../components/mypage/MyReservationList.jsx'
import { deleteMyReservation, getMyPets, getMyReservations } from '../services/reservationService.js'
import './MyPage.css'

function MyPage() {
  const [reservations, setReservations] = useState([])
  const [pets, setPets] = useState([])
  const [error, setError] = useState('')

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

  const handleDeleteReservation = async (reservation) => {
    const confirmed = window.confirm('이 예약을 삭제할까요?')
    if (!confirmed) return

    try {
      await deleteMyReservation(reservation.reservationCode)
      setReservations((current) =>
        current.filter((item) => item.reservationCode !== reservation.reservationCode),
      )
      setError('')
      window.alert('예약이 삭제되었습니다.')
    } catch (exception) {
      setError(exception.message || '예약 삭제에 실패했습니다.')
    }
  }

  return (
    <section className="myPage">
      <header className="myHeading">
        <p className="sectionEyebrow">MyPage</p>
        <h1>마이페이지</h1>
        <p>내 정보, 예약 내역, 반려견 정보를 한 화면에서 관리합니다.</p>
      </header>
      {error ? <p className="myError">{error}</p> : null}

      <div className="myLayout">
        <MyProfileCard />
        <MyPetList pets={pets} onChangePets={setPets} />
      </div>

      <MyReservationList
        reservations={reservations}
        onDeleteReservation={handleDeleteReservation}
      />
    </section>
  )
}

export default MyPage
