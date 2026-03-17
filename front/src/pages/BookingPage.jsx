import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BookingGuestForm from '../components/booking/BookingGuestForm.jsx'
import BookingHeroSection from '../components/booking/BookingHeroSection.jsx'
import BookingRoomSelector from '../components/booking/BookingRoomSelector.jsx'
import BookingSummaryCard from '../components/booking/BookingSummaryCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { VISIT_TIME_RULES } from '../data/roomCatalog.js'
import {
  createReservation,
  getBookingFormDraft,
  getMyPets,
  getRooms,
  saveBookingFormDraft,
  saveDraft,
} from '../services/reservationService.js'
import './BookingPage.css'

const PHONE_REGEX = /^01[0-9]-?\d{3,4}-?\d{4}$/
const DEFAULT_FORM = {
  checkInDate: '',
  checkOutDate: '',
  roomType: '',
  ownerName: '',
  contact: '',
  petId: '',
  petName: '',
  petBreed: '',
  petAge: '',
  notes: '',
  visitTime: '10:00',
}

function toDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function calcNights(checkIn, checkOut) {
  const inDate = toDate(checkIn)
  const outDate = toDate(checkOut)
  if (!inDate || !outDate) return 0
  const diffMs = outDate.getTime() - inDate.getTime()
  return Math.floor(diffMs / (24 * 60 * 60 * 1000))
}

function calcExtraFee(visitTime) {
  if (!visitTime) return 0
  if (visitTime < '07:00') return -1
  if (visitTime < '08:00') return 10000
  if (visitTime < '10:00') return 5000
  if (visitTime <= '19:00') return 0
  return -1
}

function calcAgeFromBirthDate(birthDate) {
  if (!birthDate) return ''
  const birth = new Date(`${birthDate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return ''

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 0 ? String(age) : ''
}

function BookingPage() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth()
  const [rooms, setRooms] = useState([])
  const [pets, setPets] = useState([])
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM, ...(getBookingFormDraft() ?? {}) }))
  const [isPrefilled, setIsPrefilled] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reservationCode, setReservationCode] = useState('')

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  useEffect(() => {
    let mounted = true
    const loadRooms = async () => {
      try {
        const list = await getRooms(form.checkInDate, form.checkOutDate)
        if (mounted) setRooms(list)
      } catch (exception) {
        if (mounted) {
          setRooms([])
          setError(exception.message || '객실 정보를 불러오지 못했습니다.')
        }
      }
    }
    loadRooms()
    return () => {
      mounted = false
    }
  }, [form.checkInDate, form.checkOutDate])

  useEffect(() => {
    saveBookingFormDraft(form)
  }, [form])

  useEffect(() => {
    if (!isLoggedIn || !user || isPrefilled) return
    let mounted = true

    const prefillByUser = async () => {
      let firstPet = null
      try {
        const petList = await getMyPets()
        if (mounted) setPets(petList)
        firstPet = petList[0] ?? null
      } catch {
        if (mounted) setPets([])
      }

      if (!mounted) return
      setForm((current) => ({
        ...current,
        ownerName: current.ownerName || user.name || '',
        contact: current.contact || user.phone || '',
        petId: current.petId || (firstPet?.id ? String(firstPet.id) : ''),
        petName: current.petName || firstPet?.name || '',
        petBreed: current.petBreed || firstPet?.breed || '',
        petAge: current.petAge || calcAgeFromBirthDate(firstPet?.birthDate),
        notes: current.notes || firstPet?.notes || '',
      }))
      setIsPrefilled(true)
    }

    prefillByUser()
    return () => {
      mounted = false
    }
  }, [isLoggedIn, user, isPrefilled])

  const selectedRoom = useMemo(
    () => rooms.find((room) => String(room.id) === String(form.roomType)) ?? null,
    [rooms, form.roomType],
  )

  const nights = useMemo(
    () => calcNights(form.checkInDate, form.checkOutDate),
    [form.checkInDate, form.checkOutDate],
  )
  const extraFee = useMemo(() => calcExtraFee(form.visitTime), [form.visitTime])

  const roomLeft = useMemo(() => {
    if (!selectedRoom) return 0
    return Math.max((selectedRoom.totalQuantity ?? selectedRoom.capacity ?? 0) - (selectedRoom.reservedQuantity ?? 0), 0)
  }, [selectedRoom])

  const baseAmount = selectedRoom && nights > 0 ? selectedRoom.nightlyRate * nights : 0
  const totalAmount = baseAmount + (extraFee > 0 ? extraFee : 0)

  const handleChange = (key, value) => {
    setFieldErrors((current) => {
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })

    if (key === 'petId') {
      const selected = pets.find((pet) => String(pet.id) === String(value))
      setForm((current) => ({
        ...current,
        petId: value,
        petName: selected?.name || '',
        petBreed: selected?.breed || '',
        petAge: selected?.birthDate ? calcAgeFromBirthDate(selected.birthDate) : '',
        notes: selected?.notes || '',
      }))
      return
    }
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setFieldErrors({})

    const nextFieldErrors = {}
    if (!form.checkInDate) nextFieldErrors.checkInDate = true
    if (!form.checkOutDate) nextFieldErrors.checkOutDate = true
    if (!form.roomType) nextFieldErrors.roomType = true
    if (!form.ownerName.trim()) nextFieldErrors.ownerName = true
    if (!form.contact.trim()) nextFieldErrors.contact = true
    if (!form.petId) nextFieldErrors.petId = true

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setError('필수 입력 항목을 모두 작성해주세요.')
      return
    }
    if (form.checkInDate < today) {
      setError('체크인 날짜는 오늘 이후만 선택할 수 있습니다.')
      return
    }
    if (nights <= 0) {
      setError('체크아웃 날짜는 체크인 날짜보다 뒤여야 합니다.')
      return
    }
    if (!PHONE_REGEX.test(form.contact)) {
      setError('연락처 형식이 올바르지 않습니다. 예: 010-1234-5678')
      return
    }
    if (extraFee < 0) {
      setError('체크인 희망 방문시간은 07:00~19:00 사이만 가능합니다.')
      return
    }
    if (roomLeft < 1) {
      setError('선택한 객실 타입의 잔여 객실이 없습니다.')
      return
    }

    try {
      const created = await createReservation({
        roomId: Number(form.roomType),
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        visitTime: form.visitTime,
        guardianName: form.ownerName,
        guardianPhone: form.contact,
        petId: Number(form.petId),
      })

      const draft = {
        reservationCode: created.reservationCode,
        roomId: created.roomId,
        roomName: created.roomName,
        checkInDate: created.checkInDate,
        checkOutDate: created.checkOutDate,
        visitTime: created.visitTime,
        guardianName: created.guardianName,
        guardianPhone: created.guardianPhone,
        petName: created.petName,
        petBreed: form.petBreed,
        petAge: form.petAge,
        notes: form.notes,
        baseAmount: created.baseAmount,
        extraAmount: created.extraAmount,
        totalAmount: created.totalAmount,
        status: created.status,
      }

      saveDraft(draft)
      setReservationCode(created.reservationCode)
      setSuccess('예약이 생성되었습니다. 결제 페이지에서 결제를 진행해주세요.')
    } catch (exception) {
      setError(exception.message || '예약 생성에 실패했습니다.')
    }
  }

  return (
    <section className="bookingPage">
      <BookingHeroSection />

      <div className="bookingLayout">
        <form className="bookingForm" onSubmit={handleSubmit}>
          <h2>예약 정보 입력</h2>

          <div className="bookingGrid">
            <BookingRoomSelector
              rooms={rooms}
              selectedRoomId={form.roomType}
              hasError={Boolean(fieldErrors.roomType)}
              onSelectRoom={(roomId) => handleChange('roomType', String(roomId))}
            />

            <BookingGuestForm
              form={form}
              today={today}
              pets={pets}
              fieldErrors={fieldErrors}
              onChange={handleChange}
              onGoMyPage={() => navigate('/mypage')}
            />
          </div>

          {error ? <p className="bookingError">{error}</p> : null}
          {success ? <p className="bookingSuccess">{success}</p> : null}

          <div className="bookingActions">
            <button type="submit" className="bookingPrimaryButton">
              예약 요청
            </button>
            <button
              type="button"
              className="bookingSecondaryButton"
              onClick={() => navigate('/payment')}
              disabled={!reservationCode}
            >
              결제 페이지 이동
            </button>
          </div>

          {reservationCode ? (
            <div className="resultCard">
              <p>예약번호</p>
              <strong>{reservationCode}</strong>
              <p>예약상태: 결제대기</p>
            </div>
          ) : null}
        </form>

        <BookingSummaryCard
          selectedRoom={selectedRoom}
          roomLeft={roomLeft}
          nights={nights}
          baseAmount={baseAmount}
          extraFee={extraFee > 0 ? extraFee : 0}
          totalAmount={totalAmount}
          policies={VISIT_TIME_RULES}
        />
      </div>
    </section>
  )
}

export default BookingPage
