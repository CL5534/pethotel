package com.example.demo.community;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CommunityCommentDAO {

	List<CommunityCommentDTO> selectCommentsByPostId(@Param("postId") Long postId);

	CommunityCommentDTO selectCommentById(@Param("commentId") Long commentId);

	int insertComment(CommunityCommentDTO commentDTO);

	int updateComment(CommunityCommentDTO commentDTO);

	int deleteComment(@Param("commentId") Long commentId);

	int deleteCommentsByPostId(@Param("postId") Long postId);

}
