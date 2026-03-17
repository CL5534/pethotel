package com.example.demo.community;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.users.UserDAO;
import com.example.demo.users.UserDTO;

import jakarta.servlet.http.HttpSession;

@Service
public class CommunityCommentService {

	private static final String LOGIN_USER_ID = "LOGIN_USER_ID"; // 로그인 세션에서 사용자 id를 꺼낼 때 쓰는 키다.

	private final CommunityCommentDAO communityCommentDAO;
	private final CommunityPostDAO communityPostDAO;
	private final UserDAO userDAO;

	public CommunityCommentService(
		CommunityCommentDAO communityCommentDAO,
		CommunityPostDAO communityPostDAO,
		UserDAO userDAO
	) {
		this.communityCommentDAO = communityCommentDAO;
		this.communityPostDAO = communityPostDAO;
		this.userDAO = userDAO;
	}

	public List<CommunityCommentDTO> getComments(Long postId) {
		validatePostExists(postId);
		return communityCommentDAO.selectCommentsByPostId(postId);
	}

	public CommunityCommentDTO createComment(Long postId, CommunityCommentDTO commentDTO, HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		validatePostExists(postId);

		if (isBlank(commentDTO.getContent())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 내용은 필수입니다.");
		}

		commentDTO.setPostId(postId);
		commentDTO.setUserId(loginUserId);
		commentDTO.setContent(commentDTO.getContent().trim());
		communityCommentDAO.insertComment(commentDTO);
		return communityCommentDAO.selectCommentById(commentDTO.getId());
	}

	public CommunityCommentDTO updateComment(Long commentId, CommunityCommentDTO commentDTO, HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		CommunityCommentDTO savedComment = communityCommentDAO.selectCommentById(commentId);

		if (savedComment == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다.");
		}
		if (!savedComment.getUserId().equals(loginUserId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자만 댓글을 수정할 수 있습니다.");
		}
		if (isBlank(commentDTO.getContent())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "댓글 내용은 필수입니다.");
		}

		savedComment.setContent(commentDTO.getContent().trim());
		communityCommentDAO.updateComment(savedComment);
		return communityCommentDAO.selectCommentById(savedComment.getId());
	}

	public void deleteComment(Long commentId, HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		CommunityCommentDTO savedComment = communityCommentDAO.selectCommentById(commentId);

		if (savedComment == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "댓글을 찾을 수 없습니다.");
		}

		if (!savedComment.getUserId().equals(loginUserId) && !isAdminUser(loginUserId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "작성자 또는 관리자만 댓글을 삭제할 수 있습니다.");
		}

		communityCommentDAO.deleteComment(commentId);
	}

	private void validatePostExists(Long postId) {
		if (communityPostDAO.selectPostById(postId) == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다.");
		}
	}

	private Long getLoginUserId(HttpSession session) {
		Long loginUserId = (Long) session.getAttribute(LOGIN_USER_ID);

		if (loginUserId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}

		return loginUserId;
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private boolean isAdminUser(Long userId) {
		UserDTO userDTO = userDAO.selectUserById(userId);
		if (userDTO == null || userDTO.getEmail() == null) return false;
		return "admin@pethotel.kr".equalsIgnoreCase(userDTO.getEmail().trim());
	}

}
