const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const DRAFT_KEY = 'pethotel_booking_draft'

function readJson(key, fallback) {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
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

  return {
    reservationCode: item.reservationCode,
    roomId: item.roomId,
    checkInDate: item.checkInDate,
    checkOutDate: item.checkOutDate,
    roomName: item.roomName,
    petName: item.petName,
    guardianName: item.guardianName,
    guardianPhone: item.guardianPhone,
    status: statusMap[item.status] ?? item.status,
    statusCode: item.status,
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
  writeJson(DRAFT_KEY, draft)
}

export function getDraft() {
  return readJson(DRAFT_KEY, null)
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

export async function cancelMyReservation(reservationCode) {
  const response = await fetch(`${API_BASE_URL}/api/reservations/${reservationCode}/cancel`, {
    method: 'POST',
    credentials: 'include',
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || '예약 취소에 실패했습니다.')
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
