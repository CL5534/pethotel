package com.example.demo.users;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

@Service
public class UserService {

	private static final String LOGIN_USER_ID = "LOGIN_USER_ID";

	private final UserDAO userDAO;

	public UserService(UserDAO userDAO) {
		this.userDAO = userDAO;
	}

	public UserDTO signUp(UserDTO userDTO) {
		validateSignUp(userDTO);

		if (userDAO.selectUserByEmail(userDTO.getEmail()) != null) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다.");
		}

		userDTO.setName(userDTO.getName().trim());
		userDTO.setEmail(userDTO.getEmail().trim());
		userDTO.setPasswordHash(hashPassword(userDTO.getPassword()));
		userDTO.setPhone(userDTO.getPhone().trim());
		userDTO.setAddress(userDTO.getAddress().trim());

		userDAO.insertUser(userDTO);
		return toResponseUser(userDTO);
	}

	public UserDTO login(UserDTO userDTO, HttpSession session) {
		if (isBlank(userDTO.getEmail()) || isBlank(userDTO.getPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일과 비밀번호는 필수입니다.");
		}

		UserDTO savedUser = userDAO.selectUserByEmail(userDTO.getEmail().trim());

		if (savedUser == null || !savedUser.getPasswordHash().equals(hashPassword(userDTO.getPassword()))) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
		}

		session.setAttribute(LOGIN_USER_ID, savedUser.getId());
		return toResponseUser(savedUser);
	}

	public UserDTO getCurrentUser(HttpSession session) {
		Long userId = (Long) session.getAttribute(LOGIN_USER_ID);

		if (userId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}

		UserDTO userDTO = userDAO.selectUserById(userId);

		if (userDTO == null) {
			session.invalidate();
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "세션 사용자 정보를 찾을 수 없습니다.");
		}

		return toResponseUser(userDTO);
	}

	public void logout(HttpSession session) {
		session.invalidate();
	}

	private void validateSignUp(UserDTO userDTO) {
		if (isBlank(userDTO.getName())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름은 필수입니다.");
		}

		if (isBlank(userDTO.getEmail())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일은 필수입니다.");
		}

		if (isBlank(userDTO.getPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 필수입니다.");
		}

		if (isBlank(userDTO.getPhone())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "연락처는 필수입니다.");
		}

		if (isBlank(userDTO.getAddress())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "주소는 필수입니다.");
		}
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private String hashPassword(String rawPassword) {
		try {
			MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
			byte[] hash = messageDigest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
			StringBuilder builder = new StringBuilder();

			for (byte value : hash) {
				builder.append(String.format("%02x", value));
			}

			return builder.toString();
		} catch (NoSuchAlgorithmException exception) {
			throw new IllegalStateException("비밀번호 해시 생성에 실패했습니다.", exception);
		}
	}

	private UserDTO toResponseUser(UserDTO userDTO) {
		UserDTO responseUser = new UserDTO();
		responseUser.setId(userDTO.getId());
		responseUser.setName(userDTO.getName());
		responseUser.setEmail(userDTO.getEmail());
		responseUser.setPhone(userDTO.getPhone());
		responseUser.setAddress(userDTO.getAddress());
		responseUser.setCreatedAt(userDTO.getCreatedAt());
		return responseUser;
	}

}
