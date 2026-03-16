package com.example.demo.community;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/community/posts")
public class CommunityPostController {

	private final CommunityPostService communityPostService;

	public CommunityPostController(CommunityPostService communityPostService) {
		this.communityPostService = communityPostService;
	}

	@GetMapping
	public Map<String, Object> getPosts(
		@RequestParam(required = false) String category,
		@RequestParam(required = false, defaultValue = "title") String searchType,
		@RequestParam(required = false) String searchKeyword,
		@RequestParam(defaultValue = "1") int page,
		@RequestParam(defaultValue = "15") int size
	) {
		return communityPostService.getPostList(category, searchType, searchKeyword, page, size);
	}

	@GetMapping("/{postId}")
	public CommunityPostDTO getPostDetail(@PathVariable Long postId) {
		return communityPostService.getPostDetail(postId);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public CommunityPostDTO createPost(@RequestBody CommunityPostDTO postDTO, HttpSession session) {
		return communityPostService.createPost(postDTO, session);
	}

	@PutMapping("/{postId}")
	public CommunityPostDTO updatePost(@PathVariable Long postId, @RequestBody CommunityPostDTO postDTO, HttpSession session) {
		return communityPostService.updatePost(postId, postDTO, session);
	}

	@DeleteMapping("/{postId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deletePost(@PathVariable Long postId, HttpSession session) {
		communityPostService.deletePost(postId, session);
	}

}
