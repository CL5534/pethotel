function CommunityBoardDetailModal({
  post,
  isLoggedIn,
  currentUserId,
  canManagePost,
  commentInput,
  onChangeComment,
  onAddComment,
  onDeleteComment,
  onClose,
  onOpenEditModal,
  onDeletePost,
}) {
  if (!post) return null // 선택된 글이 없으면 상세 모달을 렌더링하지 않는다.

  return (
    <div className="communityModalOverlay" onClick={onClose}>
      <div className="communityModal" onClick={(event) => event.stopPropagation()}>
        <div className="communityModalHeader">
          <h3>{post.title}</h3>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="communityPostMeta">
          <span>{post.category}</span>
          <span>{post.author}</span>
          <span>{post.createdAt}</span>
          <span>조회 {post.views}</span>
        </div>

        <div className="communityPostContent">{post.content}</div>

        <section className="communityComments">
          <h4>댓글 {post.comments.length}</h4>

          <div className="communityCommentList">
            {post.comments.length > 0 ? (
              post.comments.map((comment, index) => (
                <article key={`${comment.author}-${index}`} className="communityCommentItem">
                  <div className="communityCommentAvatar">{comment.author.slice(0, 1)}</div>
                  <div>
                    <div className="communityCommentTop">
                      <strong>{comment.author}</strong>
                      {currentUserId === comment.userId ? (
                        <button
                          type="button"
                          className="communityCommentDelete"
                          onClick={() => onDeleteComment(comment.id)}
                        >
                          삭제
                        </button>
                      ) : null}
                    </div>
                    <p>{comment.text}</p>
                    <span>{comment.createdAt}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="communityCommentEmpty">첫 번째 댓글을 남겨보세요.</p>
            )}
          </div>

          <div className="communityCommentForm">
            <input
              value={commentInput}
              onChange={(event) => onChangeComment(event.target.value)}
              placeholder={isLoggedIn ? '댓글을 입력하세요' : '로그인 후 댓글 작성이 가능합니다'}
              disabled={!isLoggedIn}
            />
            {isLoggedIn ? (
              <button type="button" onClick={onAddComment}>
                등록
              </button>
            ) : null}
          </div>
        </section>

        <div className="communityModalFooter">
          {canManagePost ? (
            <>
              <button type="button" onClick={onOpenEditModal}>
                수정
              </button>
              <button type="button" className="danger" onClick={onDeletePost}>
                삭제
              </button>
            </>
          ) : null}
          <button type="button" className="primary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommunityBoardDetailModal
