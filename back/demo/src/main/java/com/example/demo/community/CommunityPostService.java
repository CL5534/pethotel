package com.example.demo.community;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

@Service
public class CommunityPostService {

	private static final String LOGIN_USER_ID = "LOGIN_USER_ID"; // users 서비스와 같은 세션 키를 사용한다.

	private final CommunityPostDAO communityPostDAO;
	private final CommunityCommentDAO communityCommentDAO;

	public CommunityPostService(CommunityPostDAO communityPostDAO, CommunityCommentDAO communityCommentDAO) {
		this.communityPostDAO = communityPostDAO;
		this.communityCommentDAO = communityCommentDAO;
	}

	public Map<String, Object> getPostList(String category, String searchType, String searchKeyword, int page, int size) {
		int safePage = Math.max(page, 1); // 페이지는 1보다 작아지지 않게 보정한다.
		int safeSize = Math.max(size, 1); // size도 최소 1개는 보장한다.
		int offset = (safePage - 1) * safeSize;

		List<CommunityPostDTO> posts = communityPostDAO.selectPostList(category, searchType, searchKeyword, offset, safeSize);
		int totalCount = communityPostDAO.countPosts(category, searchType, searchKeyword);

		Map<String, Object> response = new HashMap<>();
		response.put("posts", posts);
		response.put("page", safePage);
		response.put("size", safeSize);
		response.put("totalCount", totalCount);
		response.put("totalPages", Math.max(1, (int) Math.ceil((double) totalCount / safeSize)));
		return response;
	}

	public CommunityPostDTO getPostDetail(Long postId) {
		CommunityPostDTO post = communityPostDAO.selectPostById(postId);

		if (post == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다.");
		}

		communityPostDAO.increaseViewCount(postId); // 상세 조회 시 조회수를 먼저 증가시킨다.
		post = communityPostDAO.selectPostById(postId); // 증가된 조회수를 다시 반영하기 위해 재조회한다.
		post.setComments(communityCommentDAO.selectCommentsByPostId(postId)); // 댓글은 상세 조회에서만 붙인다.
		return post;
	}

	public CommunityPostDTO createPost(CommunityPostDTO postDTO, HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		validatePost(postDTO);

		postDTO.setUserId(loginUserId);
		communityPostDAO.insertPost(postDTO);
		return communityPostDAO.selectPostById(postDTO.getId());
	}

	public CommunityPostDTO updatePost(Long postId, CommunityPostDTO postDTO, HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		CommunityPostDTO savedPost = getOwnedPost(postId, loginUserId);
		validatePost(postDTO);

		savedPost.setCategory(postDTO.getCategory().trim());
		savedPost.setTitle(postDTO.getTitle().trim());
		savedPost.setContent(postDTO.getContent().trim());
		communityPostDAO.updatePost(savedPost);
		return communityPostDAO.selectPostById(postId);
	}

	public void deletePost(Long postId, HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		getOwnedPost(postId, loginUserId); // 작성자 검증이 통과해야 삭제 가능
		communityCommentDAO.deleteCommentsByPostId(postId); // 실제 DB에는 ON DELETE CASCADE가 없을 수 있어 댓글을 먼저 지운다.
		communityPostDAO.deletePost(postId);
	}

	private CommunityPostDTO getOwnedPost(Long postId, Long loginUserId) {
		CommunityPostDTO savedPost = communityPostDAO.selectPostById(postId);

		if (savedPost == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다.");
		}

		if (!savedPost.getUserId().equals(loginUserId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 게시글을 수정 또는 삭제할 수 있습니다.");
		}

		return savedPost;
	}

	private Long getLoginUserId(HttpSession session) {
		Long loginUserId = (Long) session.getAttribute(LOGIN_USER_ID);

		if (loginUserId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}

		return loginUserId;
	}

	private void validatePost(CommunityPostDTO postDTO) {
		if (isBlank(postDTO.getCategory())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "카테고리는 필수입니다.");
		}

		if (isBlank(postDTO.getTitle())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "제목은 필수입니다.");
		}

		if (isBlank(postDTO.getContent())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "내용은 필수입니다.");
		}
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

}
