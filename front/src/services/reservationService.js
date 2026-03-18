const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const DRAFT_KEY = 'pethotel_booking_draft'
const BOOKING_FORM_DRAFT_KEY = 'pethotel_booking_form_draft'
const MOCK_PAID_CODES_KEY = 'pethotel_mock_paid_codes'
const MOCK_PAYMENT_LOGS_KEY = 'pethotel_mock_payment_logs'
const SAFE_BOOKING_DRAFT_KEYS = ['checkInDate', 'checkOutDate', 'roomType', 'petId', 'visitTime']

function readJson(storage, key, fallback) {
  const raw = storage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(storage, key, value) {
  storage.setItem(key, JSON.stringify(value))
}

function pickBookingDraft(value) {
  const source = value && typeof value === 'object' ? value : {}
  return SAFE_BOOKING_DRAFT_KEYS.reduce((acc, key) => {
    if (source[key] !== undefined && source[key] !== null) {
      acc[key] = source[key]
    }
    return acc
  }, {})
}

function getMockPaidCodes() {
  return readJson(localStorage, MOCK_PAID_CODES_KEY, [])
}

function hasMockPaidCode(reservationCode) {
  return getMockPaidCodes().includes(reservationCode)
}

function clearMockPaidReservation(reservationCode) {
  const nextCodes = getMockPaidCodes().filter((code) => code !== reservationCode)
  writeJson(localStorage, MOCK_PAID_CODES_KEY, nextCodes)
}

function getMockPaymentLogs() {
  return readJson(localStorage, MOCK_PAYMENT_LOGS_KEY, {})
}

function saveMockPaymentLog(log) {
  const logs = getMockPaymentLogs()
  logs[log.reservationCode] = log
  writeJson(localStorage, MOCK_PAYMENT_LOGS_KEY, logs)
}

function clearMockPaymentLog(reservationCode) {
  const logs = getMockPaymentLogs()
  if (!logs[reservationCode]) return
  delete logs[reservationCode]
  writeJson(localStorage, MOCK_PAYMENT_LOGS_KEY, logs)
}

function normalizeRoom(room) {
  return {
    id: room.id,
    roomCode: room.roomCode,
    name: room.name,
    sizeType: room.sizeType,
    maxWeightKg: room.maxWeightKg,
    capacity: room.capacity,
    description: room.description,
    totalQuantity: room.totalQuantity,
    reservedQuantity: room.reservedQuantity,
    nightlyRate: room.nightlyRate,
  }
}

function normalizeReservation(item) {
  const statusMap = {
    PAYMENT_PENDING: '결제대기',
    CONFIRMED: '예약확정',
    CHECKED_IN: '체크인완료',
    CHECKED_OUT: '이용완료',
    CANCELED: '취소완료',
  }

  const statusCode = item.status === 'PAYMENT_PENDING' && hasMockPaidCode(item.reservationCode)
    ? 'CONFIRMED'
    : item.status

  return {
    reservationCode: item.reservationCode,
    roomId: item.roomId,
    checkInDate: item.checkInDate,
    checkOutDate: item.checkOutDate,
    visitTime: item.visitTime,
    roomName: item.roomName,
    petName: item.petName,
    guardianName: item.guardianName,
    guardianPhone: item.guardianPhone,
    status: statusMap[statusCode] ?? statusCode,
    statusCode,
    totalAmount: item.totalAmount,
  }
}

function normalizePet(item) {
  return {
    id: item.id,
    name: item.name ?? '',
    breed: item.breed ?? '',
    weightKg: item.weightKg ?? null,
    birthDate: item.birthDate ?? '',
    notes: item.notes ?? '',
  }
}

export async function getRooms(checkInDate, checkOutDate) {
  const query = new URLSearchParams()
  if (checkInDate) query.set('checkInDate', checkInDate)
  if (checkOutDate) query.set('checkOutDate', checkOutDate)

  const response = await fetch(`${API_BASE_URL}/api/rooms?${query.toString()}`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('객실 정보를 불러오지 못했습니다.')
  }

  const body = await response.json()
  return body.map(normalizeRoom)
}

export async function createAdminRoom(payload) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '객실 등록에 실패했습니다.')
  }
  return normalizeRoom(body)
}

export async function updateAdminRoom(roomId, payload) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms/${roomId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '객실 수정에 실패했습니다.')
  }
  return normalizeRoom(body)
}

export async function deleteAdminRoom(roomId) {
  const response = await fetch(`${API_BASE_URL}/api/admin/rooms/${roomId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || '객실 삭제에 실패했습니다.')
  }
}

export async function createReservation(payload) {
  const response = await fetch(`${API_BASE_URL}/api/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '예약 생성에 실패했습니다.')
  }

  return body
}

export function saveDraft(draft) {
  writeJson(localStorage, DRAFT_KEY, draft)
}

export function getDraft() {
  return readJson(localStorage, DRAFT_KEY, null)
}

export function saveBookingFormDraft(form) {
  writeJson(sessionStorage, BOOKING_FORM_DRAFT_KEY, pickBookingDraft(form))
}

export function getBookingFormDraft() {
  const raw = readJson(sessionStorage, BOOKING_FORM_DRAFT_KEY, null)
  if (!raw) return null
  const sanitized = pickBookingDraft(raw)
  // 기존에 저장된 민감정보(보호자명/연락처/메모 등)는 즉시 제거해 다시 저장한다.
  writeJson(sessionStorage, BOOKING_FORM_DRAFT_KEY, sanitized)
  return sanitized
}

export async function getReservations() {
  const response = await fetch(`${API_BASE_URL}/api/reservations`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('예약 목록을 불러오지 못했습니다.')
  }

  const body = await response.json()
  return body.map(normalizeReservation)
}

export async function getMyReservations() {
  const response = await fetch(`${API_BASE_URL}/api/reservations/me`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('내 예약 목록을 불러오지 못했습니다.')
  }

  const body = await response.json()
  return body.map(normalizeReservation)
}

export async function confirmReservation(reservationCode) {
  const response = await fetch(`${API_BASE_URL}/api/reservations/${reservationCode}/confirm-payment`, {
    method: 'POST',
    credentials: 'include',
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '결제 상태 반영에 실패했습니다.')
  }

  return body
}

export function markMockPaidReservation(reservationCode) {
  const codes = getMockPaidCodes()
  if (codes.includes(reservationCode)) return
  writeJson(localStorage, MOCK_PAID_CODES_KEY, [...codes, reservationCode])
}

export function createMockPaymentResult({ reservationCode, method, scenario }) {
  const orderId = `${reservationCode}-${Date.now()}`
  const paymentKey = `MOCK_PAY_${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  const transactionId = `MOCK_TX_${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  const status = scenario === 'SUCCESS' ? 'SUCCESS' : 'FAIL'
  const failReason = scenario === 'CANCEL'
    ? '사용자가 결제를 취소했습니다.'
    : (scenario === 'FAIL' ? '한도 초과로 결제가 실패했습니다.' : null)

  if (scenario === 'SUCCESS') {
    markMockPaidReservation(reservationCode)
  } else {
    clearMockPaidReservation(reservationCode)
  }

  saveMockPaymentLog({
    reservationCode,
    method,
    status,
    failReason,
    paymentKey,
    orderId,
    transactionId,
    approvedAt: scenario === 'SUCCESS' ? new Date().toISOString() : null,
  })

  return {
    status,
    failReason,
    paymentKey,
    orderId,
    transactionId,
  }
}

export function getMockPaymentResult(reservationCode) {
  const logs = getMockPaymentLogs()
  return logs[reservationCode] ?? null
}

export async function cancelMyReservation(reservationCode) {
  const response = await fetch(`${API_BASE_URL}/api/reservations/${reservationCode}/cancel`, {
    method: 'POST',
    credentials: 'include',
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '예약 취소에 실패했습니다.')
  }

  clearMockPaidReservation(reservationCode)
  clearMockPaymentLog(reservationCode)
  return normalizeReservation(body)
}

export async function updateMyReservation(reservationCode, payload) {
  const response = await fetch(`${API_BASE_URL}/api/reservations/${reservationCode}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '예약 수정에 실패했습니다.')
  }

  return normalizeReservation(body)
}

export async function adminUpdateReservationStatus(reservationCode, status) {
  const response = await fetch(`${API_BASE_URL}/api/admin/reservations/${reservationCode}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '관리자 상태 변경에 실패했습니다.')
  }

  return normalizeReservation(body)
}

export async function adminUpdateReservation(reservationCode, payload) {
  const response = await fetch(`${API_BASE_URL}/api/admin/reservations/${reservationCode}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '관리자 예약 수정에 실패했습니다.')
  }

  return normalizeReservation(body)
}

export async function deleteMyReservation(reservationCode) {
  const response = await fetch(`${API_BASE_URL}/api/reservations/${reservationCode}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || '예약 삭제에 실패했습니다.')
  }

  clearMockPaidReservation(reservationCode)
  clearMockPaymentLog(reservationCode)
}

export async function getMyPets() {
  const response = await fetch(`${API_BASE_URL}/api/pets/me`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('반려견 목록을 불러오지 못했습니다.')
  }

  const body = await response.json()
  return body.map(normalizePet)
}

export async function updateMyPet(petId, payload) {
  const response = await fetch(`${API_BASE_URL}/api/pets/${petId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '반려견 정보 수정에 실패했습니다.')
  }

  return normalizePet(body)
}

export async function createMyPet(payload) {
  const response = await fetch(`${API_BASE_URL}/api/pets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '반려견 등록에 실패했습니다.')
  }

  return normalizePet(body)
}

export async function deleteMyPet(petId) {
  const response = await fetch(`${API_BASE_URL}/api/pets/${petId}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || '반려견 삭제에 실패했습니다.')
  }
}
