package com.example.demo.community;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/community")
public class CommunityCommentController {

	private final CommunityCommentService communityCommentService;

	public CommunityCommentController(CommunityCommentService communityCommentService) {
		this.communityCommentService = communityCommentService;
	}

	@GetMapping("/posts/{postId}/comments")
	public List<CommunityCommentDTO> getComments(@PathVariable Long postId) {
		return communityCommentService.getComments(postId);
	}

	@PostMapping("/posts/{postId}/comments")
	@ResponseStatus(HttpStatus.CREATED)
	public CommunityCommentDTO createComment(
		@PathVariable Long postId,
		@RequestBody CommunityCommentDTO commentDTO,
		HttpSession session
	) {
		return communityCommentService.createComment(postId, commentDTO, session);
	}

	@PutMapping("/comments/{commentId}")
	public CommunityCommentDTO updateComment(
		@PathVariable Long commentId,
		@RequestBody CommunityCommentDTO commentDTO,
		HttpSession session
	) {
		return communityCommentService.updateComment(commentId, commentDTO, session);
	}

	@DeleteMapping("/comments/{commentId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteComment(@PathVariable Long commentId, HttpSession session) {
		communityCommentService.deleteComment(commentId, session);
	}

}
