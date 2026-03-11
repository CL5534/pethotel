import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [number, setNumber] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchItems = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/test')

      if (!response.ok) {
        throw new Error('목록을 불러오지 못했습니다.')
      }

      const data = await response.json()
      setItems(data)
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!number.trim()) {
      setError('숫자를 입력하세요.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: Number(number) }),
      })

      if (!response.ok) {
        throw new Error('데이터 저장에 실패했습니다.')
      }

      setNumber('')
      await fetchItems()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app">
      <section className="panel">
        <p className="eyebrow">Frontend + Backend + DB Test</p>
        <h1>test1 연결 확인</h1>
        <p className="description">
          숫자를 입력하고 저장하면 Spring Boot를 거쳐 MariaDB test1 테이블에 반영됩니다.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="number"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder="숫자 입력"
          />
          <button type="submit" disabled={submitting}>
            {submitting ? '저장 중...' : '저장'}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}

        <div className="listHeader">
          <h2>저장된 데이터</h2>
          <button type="button" className="ghostButton" onClick={fetchItems}>
            새로고침
          </button>
        </div>

        {loading ? (
          <p className="status">불러오는 중...</p>
        ) : items.length === 0 ? (
          <p className="status">데이터가 없습니다.</p>
        ) : (
          <ul className="list">
            {items.map((item) => (
              <li key={item.id} className="listItem">
                <span>id {item.id}</span>
                <strong>{item.number}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
