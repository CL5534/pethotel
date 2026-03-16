function CommunityBoardWriteModal({
  isOpen,
  categories,
  editingPostId,
  form,
  formError,
  onChangeField,
  onClose,
  onSubmit,
}) {
  if (!isOpen) return null // 글쓰기 모달이 닫혀 있으면 렌더링하지 않는다.

  return (
    <div className="communityModalOverlay" onClick={onClose}>
      <div className="communityModal" onClick={(event) => event.stopPropagation()}>
        <div className="communityModalHeader">
          <h3>{editingPostId ? '게시글 수정' : '새 글쓰기'}</h3>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="communityFormGrid">
          <label>
            <span>분류</span>
            <select value={form.category} onChange={(event) => onChangeField('category', event.target.value)}>
              <option value="">카테고리 선택</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>제목</span>
            <input
              value={form.title}
              onChange={(event) => onChangeField('title', event.target.value)}
              placeholder="제목을 입력하세요"
            />
            {formError.title ? <em>제목은 필수입니다.</em> : null}
          </label>

          <label>
            <span>내용</span>
            <textarea
              value={form.content}
              onChange={(event) => onChangeField('content', event.target.value)}
              placeholder="내용을 입력하세요"
            />
            {formError.content ? <em>내용은 필수입니다.</em> : null}
          </label>

          <label>
            <span>글쓴이</span>
            <input
              value={form.author}
              onChange={(event) => onChangeField('author', event.target.value)}
              placeholder="이름을 입력하세요"
            />
          </label>
        </div>

        <div className="communityModalFooter">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button type="button" className="primary" onClick={onSubmit}>
            등록
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommunityBoardWriteModal
