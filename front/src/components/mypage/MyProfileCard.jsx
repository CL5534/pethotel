import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'

function getRequestMemoKey(user) {
  if (!user?.id) return ''
  return `mypage_request_memo_${user.id}`
}

function loadRequestMemo(user) {
  const key = getRequestMemoKey(user)
  if (!key) return ''
  return localStorage.getItem(key) ?? ''
}

function saveRequestMemo(user, memo) {
  const key = getRequestMemoKey(user)
  if (!key) return
  localStorage.setItem(key, memo)
}

function MyProfileCard() {
  const { user, isLoggedIn, updateProfile, fetchCurrentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    requestMemo: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn) return

    if (!user) {
      fetchCurrentUser().catch(() => {})
      return
    }

    setForm({
      name: user.name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      address: user.address ?? '',
      requestMemo: loadRequestMemo(user),
    })
  }, [user, isLoggedIn, fetchCurrentUser])

  const profileRows = useMemo(
    () => [
      { label: '이름', value: form.name || '-' },
      { label: '이메일(아이디)', value: form.email || '-' },
      { label: '연락처', value: form.phone || '-' },
      { label: '주소', value: form.address || '-' },
      { label: '요청사항', value: form.requestMemo || '-' },
    ],
    [form],
  )

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleStartEdit = () => {
    setError('')
    setMessage('')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setError('')
    setMessage('')
    setIsEditing(false)
    if (user) {
      setForm({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
        requestMemo: loadRequestMemo(user),
      })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('이름, 연락처, 주소를 모두 입력해 주세요.')
      return
    }

    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      })
      saveRequestMemo(user, form.requestMemo.trim())
      setMessage('내 정보가 수정되었습니다.')
      setIsEditing(false)
    } catch (exception) {
      setError(exception.message || '내 정보 수정에 실패했습니다.')
    }
  }

  if (!isLoggedIn) {
    return (
      <section className="myCard">
        <h2>내 정보</h2>
        <p className="myMuted">로그인 후 내 정보를 확인할 수 있습니다.</p>
      </section>
    )
  }

  return (
    <section className="myCard">
      <div className="myCardHeader">
        <h2>내 정보</h2>
        <button type="button" className="myActionButton" onClick={handleStartEdit}>
          내정보관리
        </button>
      </div>

      <dl className="myInfoList">
        {profileRows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      {error ? <p className="myError">{error}</p> : null}
      {message ? <p className="mySuccess">{message}</p> : null}

      {isEditing ? (
        <div className="myModalBackdrop" role="dialog" aria-modal="true" aria-label="내 정보 수정">
          <div className="myModalCard">
            <h3>내정보관리</h3>
            <form className="myProfileForm" onSubmit={handleSubmit}>
              <label>
                <span>이름</span>
                <input
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                />
              </label>

              <label>
                <span>이메일(아이디)</span>
                <input value={form.email} disabled />
              </label>

              <label>
                <span>연락처</span>
                <input
                  value={form.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                />
              </label>

              <label>
                <span>주소</span>
                <input
                  value={form.address}
                  onChange={(event) => handleChange('address', event.target.value)}
                />
              </label>

              <label>
                <span>요청사항</span>
                <textarea
                  rows="3"
                  value={form.requestMemo}
                  onChange={(event) => handleChange('requestMemo', event.target.value)}
                />
              </label>

              {error ? <p className="myError">{error}</p> : null}

              <div className="myActionRow">
                <button type="submit" className="myActionButton primary">저장</button>
                <button type="button" className="myActionButton" onClick={handleCancelEdit}>취소</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default MyProfileCard
