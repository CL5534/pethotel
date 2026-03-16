package com.example.demo.users;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserDAO {

	int insertUser(UserDTO userDTO);

	UserDTO selectUserByEmail(@Param("email") String email);

	UserDTO selectUserById(@Param("id") Long id);

	int updateUserProfile(UserDTO userDTO);

}
