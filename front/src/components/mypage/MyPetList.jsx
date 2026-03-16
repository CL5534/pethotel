import { useMemo, useState } from 'react'
import { createMyPet, deleteMyPet, updateMyPet } from '../../services/reservationService.js'

function formatBirthDate(value) {
  return value || '-'
}

function emptyPetForm() {
  return {
    name: '',
    breed: '',
    weightKg: '',
    birthDate: '',
    notes: '',
  }
}

function normalizeForm(form) {
  return {
    name: form.name.trim(),
    breed: form.breed.trim(),
    weightKg: form.weightKg === '' ? null : Number(form.weightKg),
    birthDate: form.birthDate || null,
    notes: form.notes.trim(),
  }
}

function MyPetList({ pets, onChangePets }) {
  const [editingPetId, setEditingPetId] = useState(null)
  const [form, setForm] = useState(emptyPetForm)
  const [addForm, setAddForm] = useState(emptyPetForm)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const petCountText = useMemo(() => `${pets.length}마리 등록됨`, [pets])

  const startEdit = (pet) => {
    setError('')
    setMessage('')
    setEditingPetId(pet.id)
    setForm({
      name: pet.name ?? '',
      breed: pet.breed ?? '',
      weightKg: pet.weightKg ?? '',
      birthDate: pet.birthDate ?? '',
      notes: pet.notes ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingPetId(null)
    setError('')
  }

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleAddChange = (field, value) => {
    setAddForm((current) => ({ ...current, [field]: value }))
  }

  const saveEdit = async () => {
    if (!editingPetId) return

    if (!form.name.trim() || !form.breed.trim()) {
      setError('이름과 견종은 필수입니다.')
      return
    }

    setError('')
    setMessage('')

    try {
      const updated = await updateMyPet(editingPetId, normalizeForm(form))
      onChangePets((current) => current.map((pet) => (pet.id === updated.id ? updated : pet)))
      setMessage('반려견 정보가 저장되었습니다.')
      setEditingPetId(null)
    } catch (exception) {
      setError(exception.message || '반려견 정보 수정에 실패했습니다.')
    }
  }

  const removePet = async (petId) => {
    const confirmed = window.confirm('이 반려견 정보를 삭제할까요?')
    if (!confirmed) return

    setError('')
    setMessage('')

    try {
      await deleteMyPet(petId)
      onChangePets((current) => current.filter((pet) => pet.id !== petId))
      setMessage('반려견 정보가 삭제되었습니다.')
      if (editingPetId === petId) {
        setEditingPetId(null)
      }
    } catch (exception) {
      setError(exception.message || '반려견 정보 삭제에 실패했습니다.')
    }
  }

  const startAdd = () => {
    setError('')
    setMessage('')
    setShowAddForm(true)
    setAddForm(emptyPetForm())
  }

  const cancelAdd = () => {
    setShowAddForm(false)
    setAddForm(emptyPetForm())
    setError('')
  }

  const saveAdd = async () => {
    if (!addForm.name.trim() || !addForm.breed.trim()) {
      setError('이름과 견종은 필수입니다.')
      return
    }

    setError('')
    setMessage('')

    try {
      const created = await createMyPet(normalizeForm(addForm))
      onChangePets((current) => [created, ...current])
      setMessage('반려견이 등록되었습니다.')
      setShowAddForm(false)
      setAddForm(emptyPetForm())
    } catch (exception) {
      setError(exception.message || '반려견 등록에 실패했습니다.')
    }
  }

  return (
    <section className="myCard myPetSection">
      <div className="myCardHeader">
        <h2>반려견 정보</h2>
        <small className="myMuted">{petCountText}</small>
      </div>

      {!showAddForm ? (
        <button type="button" className="myActionButton" onClick={startAdd}>
          + 반려견 등록
        </button>
      ) : (
        <article className="myPetCard isEditor">
          <h3>새 반려견 등록</h3>
          <div className="myPetEditGrid">
            <label>
              <span>이름 (name)</span>
              <input value={addForm.name} onChange={(event) => handleAddChange('name', event.target.value)} />
            </label>
            <label>
              <span>견종 (breed)</span>
              <input value={addForm.breed} onChange={(event) => handleAddChange('breed', event.target.value)} />
            </label>
            <label>
              <span>체중 kg (weight_kg)</span>
              <input
                type="number"
                step="0.1"
                value={addForm.weightKg}
                onChange={(event) => handleAddChange('weightKg', event.target.value)}
              />
            </label>
            <label>
              <span>생년월일 (birth_date)</span>
              <input
                type="date"
                value={addForm.birthDate}
                onChange={(event) => handleAddChange('birthDate', event.target.value)}
              />
            </label>
            <label className="myPetFieldFull">
              <span>특이사항 (notes)</span>
              <input value={addForm.notes} onChange={(event) => handleAddChange('notes', event.target.value)} />
            </label>
            <div className="myActionRow">
              <button type="button" className="myActionButton primary" onClick={saveAdd}>등록</button>
              <button type="button" className="myActionButton" onClick={cancelAdd}>취소</button>
            </div>
          </div>
        </article>
      )}

      {pets.length === 0 ? <p className="myMuted">등록된 반려견 정보가 없습니다.</p> : null}

      <div className="myPetGrid">
        {pets.map((pet) => {
          const isEditing = editingPetId === pet.id

          if (isEditing) {
            return (
              <article key={pet.id} className="myPetCard isEditor">
                <h3>반려견 정보 수정</h3>
                <div className="myPetEditGrid">
                  <label>
                    <span>이름 (name)</span>
                    <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} />
                  </label>
                  <label>
                    <span>견종 (breed)</span>
                    <input value={form.breed} onChange={(event) => handleChange('breed', event.target.value)} />
                  </label>
                  <label>
                    <span>체중 kg (weight_kg)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={form.weightKg}
                      onChange={(event) => handleChange('weightKg', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>생년월일 (birth_date)</span>
                    <input
                      type="date"
                      value={form.birthDate ?? ''}
                      onChange={(event) => handleChange('birthDate', event.target.value)}
                    />
                  </label>
                  <label className="myPetFieldFull">
                    <span>특이사항 (notes)</span>
                    <input value={form.notes} onChange={(event) => handleChange('notes', event.target.value)} />
                  </label>
                  <div className="myActionRow">
                    <button type="button" className="myActionButton primary" onClick={saveEdit}>저장</button>
                    <button type="button" className="myActionButton" onClick={cancelEdit}>취소</button>
                  </div>
                </div>
              </article>
            )
          }

          return (
            <article key={pet.id} className="myPetCard">
              <div className="myPetCardTop">
                <h3>{pet.name}</h3>
                <div className="myPetTopActions">
                  <button type="button" className="myActionButton" onClick={() => startEdit(pet)}>수정</button>
                  <button type="button" className="myActionButton danger" onClick={() => removePet(pet.id)}>삭제</button>
                </div>
              </div>

              <dl className="myPetDataList">
                <div><dt>견종</dt><dd>{pet.breed || '-'}</dd></div>
                <div><dt>체중(kg)</dt><dd>{pet.weightKg ?? '-'}</dd></div>
                <div><dt>생년월일</dt><dd>{formatBirthDate(pet.birthDate)}</dd></div>
                <div><dt>특이사항</dt><dd>{pet.notes || '-'}</dd></div>
              </dl>
            </article>
          )
        })}
      </div>

      {error ? <p className="myError">{error}</p> : null}
      {message ? <p className="mySuccess">{message}</p> : null}
    </section>
  )
}

export default MyPetList
