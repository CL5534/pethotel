package com.example.demo.community;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CommunityPostDAO {

	List<CommunityPostDTO> selectPostList(
		@Param("category") String category,
		@Param("searchType") String searchType,
		@Param("searchKeyword") String searchKeyword,
		@Param("offset") int offset,
		@Param("size") int size
	);

	int countPosts(
		@Param("category") String category,
		@Param("searchType") String searchType,
		@Param("searchKeyword") String searchKeyword
	);

	CommunityPostDTO selectPostById(@Param("postId") Long postId);

	int insertPost(CommunityPostDTO postDTO);

	int updatePost(CommunityPostDTO postDTO);

	int deletePost(@Param("postId") Long postId);

	int increaseViewCount(@Param("postId") Long postId);

}
