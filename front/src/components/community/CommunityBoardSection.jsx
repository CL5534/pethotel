import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import CommunityBoardDetailModal from './communityBoardModals/CommunityBoardDetailModal.jsx'
import CommunityBoardWriteModal from './communityBoardModals/CommunityBoardWriteModal.jsx'
import './CommunityBoardSection.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '' // 운영에서는 같은 도메인의 /api로 붙고, 필요하면 환경변수로 분리할 수 있다.
const POSTS_PER_PAGE = 15 // getCommunityPosts()를 호출할 때 size 값으로 같이 들어간다.

const EMPTY_FORM = {
  category: '',
  title: '',
  content: '',
  author: '',
} // 글쓰기 모달을 처음 열 때 쓸 기본 폼값이다.

function isNewPost(date) {
  // date는 아래 table 렌더링에서 post.createdAt을 넣어 호출한다.
  // 즉 서버 응답 -> normalizePost() -> post.createdAt -> isNewPost() 순서로 들어온 값이다.
  const diff = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24) // 오늘 기준 며칠 지났는지 계산한다.
  return diff <= 3 // 3일 이내 글은 NEW 뱃지를 보여준다.
}

function formatDateTime(value) {
  // value는 백엔드 LocalDateTime 문자열이다.
  // normalizePost(), normalizeComment() 안에서 createdAt / updatedAt을 화면용으로 바꿀 때 사용한다.
  if (!value) return '' // 날짜가 없으면 빈 값으로 처리한다.

  return String(value).replace('T', ' ').slice(0, 16) // 백엔드 날짜를 화면용 YYYY-MM-DD HH:mm 형식으로 맞춘다.
}

function normalizeComment(comment) {
  // comment는 createCommunityComment(), getCommunityPostDetail() 응답 안의 댓글 원본 객체다.
  // 백엔드 필드명(authorName, content)을 프론트가 읽기 쉬운 이름(author, text)으로 바꾼다.
  return {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    author: comment.authorName ?? '',
    text: comment.content ?? '',
    createdAt: formatDateTime(comment.createdAt),
  } // 댓글 응답 이름을 화면이 쓰는 이름으로 맞춘다.
}

function normalizePost(post) {
  // post는 getCommunityPosts(), getCommunityPostDetail(), create/update 응답으로 받은 게시글 원본 객체다.
  // 화면 JSX에서는 post.author, post.views처럼 단순한 이름으로 쓰고 싶어서 여기서 한 번 맞춘다.
  return {
    id: post.id,
    userId: post.userId,
    author: post.authorName ?? '',
    category: post.category ?? '',
    title: post.title ?? '',
    content: post.content ?? '',
    views: post.viewCount ?? 0,
    commentCount: post.commentCount ?? post.comments?.length ?? 0,
    createdAt: formatDateTime(post.createdAt),
    updatedAt: formatDateTime(post.updatedAt),
    isNotice: post.category === '공지사항',
    comments: Array.isArray(post.comments) ? post.comments.map(normalizeComment) : [],
  } // 게시글도 백엔드 응답을 화면용 구조로 맞춘다.
}

async function requestCommunity(path, options = {}) {
  // 이 파일 안의 모든 API 함수는 결국 이 requestCommunity()를 공통으로 사용한다.
  // 즉 getCommunityPosts(), createCommunityComment() 같은 함수는 여기 위에 얹힌 얇은 래퍼다.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include', // 세션 로그인 기반이라 쿠키를 항상 같이 보낸다.
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  const responseBody = await response.json().catch(() => null) // DELETE처럼 본문이 비어 있는 응답도 안전하게 처리한다.

  if (!response.ok) {
    throw new Error(responseBody?.message || '커뮤니티 요청 처리에 실패했습니다.')
  }

  return responseBody
}

async function getCommunityPosts({ category, searchType, searchKeyword, page, size }) {
  // 이 함수는 loadPosts() 안에서 호출된다.
  // activeCategory, searchParams, currentPage 상태값을 받아 서버 목록 API로 보낸다.
  const query = new URLSearchParams()

  if (category && category !== '전체') query.set('category', category)
  if (searchType) query.set('searchType', searchType)
  if (searchKeyword) query.set('searchKeyword', searchKeyword)
  query.set('page', String(page))
  query.set('size', String(size))

  const response = await requestCommunity(`/api/community/posts?${query.toString()}`)

  return {
    ...response,
    posts: Array.isArray(response?.posts) ? response.posts.map(normalizePost) : [],
  }
}

async function getCommunityPostDetail(postId) {
  // 이 함수는 refreshSelectedPost() 안에서 호출된다.
  // 사용자가 테이블에서 게시글 제목을 눌렀을 때 상세 모달 데이터를 가져오는 역할이다.
  const response = await requestCommunity(`/api/community/posts/${postId}`)
  return normalizePost(response)
}

async function createCommunityPost(payload) {
  // payload는 handleSubmitPost()에서 form 상태를 정리해서 만든 객체다.
  const response = await requestCommunity('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizePost(response)
}

async function updateCommunityPost(postId, payload) {
  // postId는 editingPostId 상태에서 오고, payload는 현재 폼 입력값에서 만든다.
  const response = await requestCommunity(`/api/community/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

  return normalizePost(response)
}

function deleteCommunityPost(postId) {
  // postId는 handleDeletePost() 안에서 selectedPost.id를 넘겨 호출한다.
  return requestCommunity(`/api/community/posts/${postId}`, {
    method: 'DELETE',
  })
}

async function createCommunityComment(postId, payload) {
  // postId는 현재 상세 모달에서 보고 있는 selectedPost.id다.
  // payload는 댓글 input 값(commentInput)을 content 형태로 감싼 객체다.
  const response = await requestCommunity(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizeComment(response)
}

function deleteCommunityComment(commentId) {
  // commentId는 상세 모달 안에서 각 댓글 옆 삭제 버튼을 눌렀을 때 넘어온다.
  return requestCommunity(`/api/community/comments/${commentId}`, {
    method: 'DELETE',
  })
}

function CommunityBoardSection({ categories, activeCategory }) {
  // categories, activeCategory는 CommunityPage.jsx에서 내려주는 props다.
  // CommunityPage -> CommunityBoardSection 순서로 들어오며,
  // categories는 글쓰기 select 옵션과 카테고리 예외 처리에 쓰고,
  // activeCategory는 실제 목록 조회 시 category 파라미터로 사용한다.
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuth() // 로그인 사용자 정보로 본인 글/댓글인지 판단한다.

  // 1. 화면 상태
  const [posts, setPosts] = useState([]) // loadPosts()가 서버에서 받아온 현재 페이지 게시글 목록을 넣는 상태다.
  const [searchForm, setSearchForm] = useState({ type: 'title', keyword: '' }) // 검색 input/select에 바로 연결된 입력 상태다.
  const [searchParams, setSearchParams] = useState({ type: 'title', keyword: '' }) // 검색 버튼을 눌렀을 때만 서버 조회에 반영되는 확정 검색 상태다.
  const [currentPage, setCurrentPage] = useState(1) // 현재 페이지 번호
  const [totalPages, setTotalPages] = useState(1) // 서버가 내려준 총 페이지 수
  const [totalCount, setTotalCount] = useState(0) // 서버가 내려준 총 게시글 수
  const [selectedPost, setSelectedPost] = useState(null) // handleOpenPost() 또는 refreshSelectedPost()가 채우는 상세 모달용 게시글 객체다.
  const [isWriteOpen, setIsWriteOpen] = useState(false) // 글쓰기/수정 모달 열림 여부
  const [editingPostId, setEditingPostId] = useState(null) // 수정 모드일 때 handleOpenEditModal()이 selectedPost.id를 넣어두는 상태다.
  const [commentInput, setCommentInput] = useState('') // 상세 모달 댓글 input에 직접 연결된 입력 상태다.
  const [form, setForm] = useState(EMPTY_FORM) // 글쓰기/수정 모달 input, textarea, select가 같이 바라보는 상태다.
  const [formError, setFormError] = useState({ title: false, content: false }) // handleSubmitPost()에서 제목/내용 검사 후 에러 표시용으로 사용한다.
  const [isLoading, setIsLoading] = useState(false) // 목록 로딩 표시용
  const [error, setError] = useState('') // 서버 에러 메시지
  const [reloadKey, setReloadKey] = useState(0) // 글 저장/삭제 후 useEffect를 한 번 더 태우기 위한 강제 새로고침용 숫자 상태다.

  // 2. 화면 계산값
  const normalPosts = posts.filter((post) => !post.isNotice) // 아래 table JSX에서 번호 계산할 때 posts 전체 중 공지가 아닌 글만 따로 쓰기 위해 만든 값이다.
  const writeCategories = categories.filter((category) => category !== '전체') // CommunityPage에서 받은 categories 중 글쓰기 select에 불필요한 '전체'만 제외한 값이다.

  // 3. 서버에서 목록 불러오기
  const loadPosts = async () => {
    // 이 함수는 useEffect에서 자동 호출되고, 글 저장/삭제 뒤에도 다시 호출되는 목록 조회 중심 함수다.
    setIsLoading(true)
    setError('')

    try {
      const response = await getCommunityPosts({
        category: activeCategory,
        searchType: searchParams.type,
        searchKeyword: searchParams.keyword,
        page: currentPage,
        size: POSTS_PER_PAGE,
      })

      setPosts(response.posts ?? [])
      setTotalPages(response.totalPages ?? 1)
      setTotalCount(response.totalCount ?? 0)
    } catch (exception) {
      setPosts([])
      setTotalPages(1)
      setTotalCount(0)
      setError(exception.message || '게시글 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPosts() // activeCategory는 CommunityPage에서 바뀌어 내려오고, currentPage/searchParams/reloadKey는 이 파일 상태가 바뀔 때 변한다.
  }, [activeCategory, currentPage, searchParams, reloadKey])

  // 4. 공통 초기화
  const resetForm = () => {
    // 새 글쓰기 시작할 때와 모달 닫을 때 공통으로 사용하는 폼 초기화 함수다.
    setForm(EMPTY_FORM)
    setFormError({ title: false, content: false })
    setEditingPostId(null)
  }

  const refreshSelectedPost = async (postId) => {
    // postId는 handleOpenPost(), handleAddComment(), handleDeleteComment()가 넘겨준다.
    // 즉 "상세 화면 기준 최신 게시글 1개를 다시 맞추는 공통 함수"라고 생각하면 된다.
    const refreshedPost = await getCommunityPostDetail(postId) // 상세 게시글을 다시 읽어서 댓글 수, 조회수, 댓글 목록을 한 번에 맞춘다.

    setSelectedPost(refreshedPost)
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === refreshedPost.id ? { ...post, commentCount: refreshedPost.commentCount, views: refreshedPost.views } : post,
      ),
    )

    return refreshedPost
  }

  // 5. 이벤트 함수
  const handleSearchSubmit = (event) => {
    // onSubmit={handleSearchSubmit}로 연결되어 있어서 검색 form 제출 시 실행된다.
    event.preventDefault()
    setSearchParams({
      type: searchForm.type,
      keyword: searchForm.keyword.trim(),
    })
    setCurrentPage(1)
  }

  const handleOpenPost = async (postId) => {
    // postId는 아래 게시글 테이블에서 제목 버튼 onClick={() => handleOpenPost(post.id)} 로 들어온다.
    try {
      await refreshSelectedPost(postId)
      setCommentInput('')
    } catch (exception) {
      window.alert(exception.message || '게시글을 불러오지 못했습니다.')
    }
  }

  const handleClosePost = () => {
    // 이 함수는 상세 모달 닫기 버튼과 오버레이 클릭에서 호출된다.
    setSelectedPost(null)
    setCommentInput('')
  }

  const handleOpenWriteModal = () => {
    // 툴바의 글쓰기 버튼에서 호출된다.
    if (!isLoggedIn) {
      window.alert('로그인 후 글쓰기가 가능합니다.')
      navigate('/login')
      return
    }
    resetForm()
    setIsWriteOpen(true)
  }

  const handleOpenEditModal = () => {
    // 상세 모달 안 수정 버튼에서 호출된다.
    // 지금 상세로 보고 있는 selectedPost 내용을 form 상태로 복사해서 수정 모달을 연다.
    if (!isLoggedIn) {
      window.alert('로그인 후 이용해 주세요.')
      navigate('/login')
      return
    }
    if (!selectedPost) return

    setEditingPostId(selectedPost.id)
    setForm({
      category: selectedPost.category,
      title: selectedPost.title,
      content: selectedPost.content,
      author: selectedPost.author,
    })
    setFormError({ title: false, content: false })
    setIsWriteOpen(true)
  }

  const handleCloseWriteModal = () => {
    // 글쓰기/수정 모달 닫기 공통 함수다.
    setIsWriteOpen(false)
    resetForm()
  }

  const handleAddComment = async () => {
    // commentInput은 상세 모달 input에서 입력 중인 값이고, selectedPost는 현재 보고 있는 게시글이다.
    if (!isLoggedIn) {
      window.alert('로그인 후 댓글 작성이 가능합니다.')
      navigate('/login')
      return
    }
    const nextComment = commentInput.trim()

    if (!selectedPost || !nextComment) return

    try {
      await createCommunityComment(selectedPost.id, { content: nextComment })
      await refreshSelectedPost(selectedPost.id)
      setCommentInput('')
    } catch (exception) {
      window.alert(exception.message || '댓글 등록에 실패했습니다.')
    }
  }

  const handleDeleteComment = async (commentId) => {
    // commentId는 CommunityBoardDetailModal.jsx에서 댓글 삭제 버튼 클릭 시 넘겨준다.
    if (!isLoggedIn) {
      window.alert('로그인 후 이용해 주세요.')
      navigate('/login')
      return
    }
    if (!selectedPost || !commentId) return

    try {
      await deleteCommunityComment(commentId)
      await refreshSelectedPost(selectedPost.id)
    } catch (exception) {
      window.alert(exception.message || '댓글 삭제에 실패했습니다.')
    }
  }

  const handleDeletePost = async () => {
    // selectedPost.id를 기준으로 현재 보고 있는 게시글을 삭제한다.
    if (!isLoggedIn) {
      window.alert('로그인 후 이용해 주세요.')
      navigate('/login')
      return
    }
    if (!selectedPost) return

    try {
      const deletedPostId = selectedPost.id

      await deleteCommunityPost(deletedPostId)
      handleClosePost()
      setPosts((currentPosts) => currentPosts.filter((post) => post.id !== deletedPostId))
      setReloadKey((currentKey) => currentKey + 1)
    } catch (exception) {
      window.alert(exception.message || '게시글 삭제에 실패했습니다.')
    }
  }

  const handleSubmitPost = async () => {
    // 이 함수는 글쓰기/수정 모달의 등록 버튼에서 호출된다.
    // form 상태를 검사한 뒤 새 글 등록 또는 기존 글 수정 둘 중 하나를 처리한다.
    if (!isLoggedIn) {
      window.alert('로그인 후 글 작성이 가능합니다.')
      navigate('/login')
      return
    }
    const nextError = {
      title: !form.title.trim(),
      content: !form.content.trim(),
    }

    setFormError(nextError)
    if (nextError.title || nextError.content) return

    const payload = {
      category: form.category || '자유게시판',
      title: form.title.trim(),
      content: form.content.trim(),
    }

    try {
      if (editingPostId) {
        const updatedPost = await updateCommunityPost(editingPostId, payload)

        setSelectedPost(updatedPost)
        setPosts((currentPosts) =>
          currentPosts.map((post) =>
            post.id === updatedPost.id
              ? { ...post, title: updatedPost.title, content: updatedPost.content, category: updatedPost.category }
              : post,
          ),
        )
      } else {
        await createCommunityPost(payload)
      }

      setSearchForm({ type: 'title', keyword: '' })
      setSearchParams({ type: 'title', keyword: '' })
      setCurrentPage(1)
      handleCloseWriteModal()
      setReloadKey((currentKey) => currentKey + 1)
    } catch (exception) {
      window.alert(exception.message || '게시글 저장에 실패했습니다.')
    }
  }

  const handleFieldChange = (field, value) => {
    // 이 함수는 CommunityBoardWriteModal.jsx에서 input/select/textarea가 공통으로 사용한다.
    // 예: onChangeField('title', event.target.value)
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
  }

  // 6. 화면
  return (
    <>
      <section className="communityBoardCard">
        <div className="communityToolbar">
          <p className="communityTotalCount">
            총 <strong>{totalCount}</strong>개의 게시물
          </p>

          <div className="communityToolbarRight">
            <form className="communitySearchWrap" onSubmit={handleSearchSubmit}>
              <select
                value={searchForm.type}
                onChange={(event) => setSearchForm((currentForm) => ({ ...currentForm, type: event.target.value }))}
              >
                <option value="title">제목</option>
                <option value="content">내용</option>
                <option value="author">글쓴이</option>
              </select>
              <input
                value={searchForm.keyword}
                onChange={(event) => setSearchForm((currentForm) => ({ ...currentForm, keyword: event.target.value }))}
                placeholder="검색어를 입력하세요"
              />
              <button type="submit">검색</button>
            </form>

            {isLoggedIn ? (
              <button type="button" className="communityWriteButton" onClick={handleOpenWriteModal}>
                글쓰기
              </button>
            ) : null}
          </div>
        </div>

        {error ? <div className="communityEmptyState">{error}</div> : null}
        {!error && isLoading ? <div className="communityEmptyState">게시글을 불러오는 중입니다.</div> : null}

        {!error && !isLoading ? (
          <div className="communityTableWrap">
            <table className="communityTable">
              <thead>
                <tr>
                  <th>번호</th>
                  <th className="titleCol">제목</th>
                  <th>분류</th>
                  <th>글쓴이</th>
                  <th>날짜</th>
                  <th>조회</th>
                </tr>
              </thead>
              <tbody>
                {posts.length > 0 ? (
                  posts.map((post) => {
                    const postNumber = normalPosts.length - normalPosts.indexOf(post)
                    const commentCount = post.commentCount ?? post.comments?.length ?? 0

                    return (
                      <tr key={post.id} className={post.isNotice ? 'isNotice' : ''}>
                        <td>{post.isNotice ? <span className="communityBadge notice">공지</span> : postNumber}</td>
                        <td className="titleCol">
                          <button type="button" className="communityPostTitle" onClick={() => handleOpenPost(post.id)}>
                            <span>{post.title}</span>
                            {commentCount > 0 ? <span className="communityCommentCount">[{commentCount}]</span> : null}
                            {isNewPost(post.createdAt) ? <span className="communityBadge new">NEW</span> : null}
                          </button>
                        </td>
                        <td>
                          <span className="communityCategoryPill">{post.category}</span>
                        </td>
                        <td>{post.author}</td>
                        <td>{post.createdAt}</td>
                        <td>{post.views}</td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="communityEmptyState">게시물이 없습니다.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {totalPages > 1 ? (
          <div className="communityPagination">
            <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
              이전
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={currentPage === pageNumber ? 'isCurrent' : ''}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        ) : null}
      </section>

      <CommunityBoardDetailModal
        post={selectedPost}
        isLoggedIn={isLoggedIn}
        currentUserId={user?.id ?? null}
        canManagePost={selectedPost ? user?.id === selectedPost.userId : false}
        commentInput={commentInput}
        onChangeComment={setCommentInput}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onClose={handleClosePost}
        onOpenEditModal={handleOpenEditModal}
        onDeletePost={handleDeletePost}
      />

      <CommunityBoardWriteModal
        isOpen={isWriteOpen}
        categories={writeCategories}
        editingPostId={editingPostId}
        form={form}
        formError={formError}
        onChangeField={handleFieldChange}
        onClose={handleCloseWriteModal}
        onSubmit={handleSubmitPost}
      />
    </>
  )
}

export default CommunityBoardSection
