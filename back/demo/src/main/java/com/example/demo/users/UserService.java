package com.example.demo.users;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

@Service
public class UserService {

	private static final String LOGIN_USER_ID = "LOGIN_USER_ID";
	private static final String ADMIN_EMAIL = "admin@pethotel.kr";
	private static final String DEFAULT_ADMIN_PASSWORD = "123qweasdzxc";
	private static final Pattern LEGACY_SHA256_PATTERN = Pattern.compile("^[a-f0-9]{64}$");
	private static final int LOGIN_FAIL_LIMIT = 5;
	private static final long LOCK_MILLIS = 10 * 60 * 1000L;
	private static final Map<String, Integer> LOGIN_FAIL_COUNT = new ConcurrentHashMap<>();
	private static final Map<String, Long> LOCKED_UNTIL = new ConcurrentHashMap<>();

	private final UserDAO userDAO;
	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

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
		userDTO.setPasswordHash(encodePassword(userDTO.getPassword()));
		userDTO.setPhone(userDTO.getPhone().trim());
		userDTO.setAddress(userDTO.getAddress().trim());

		userDAO.insertUser(userDTO);
		return toResponseUser(userDTO);
	}

	public UserDTO login(UserDTO userDTO, HttpSession session) {
		if (isBlank(userDTO.getEmail()) || isBlank(userDTO.getPassword())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일과 비밀번호는 필수입니다.");
		}
		String email = userDTO.getEmail().trim().toLowerCase();
		ensureAdminAccount(email, userDTO.getPassword());
		long now = Instant.now().toEpochMilli();
		Long lockedUntil = LOCKED_UNTIL.get(email);
		if (lockedUntil != null && now < lockedUntil) {
			throw new ResponseStatusException(HttpStatus.LOCKED, "로그인 5회 실패로 계정이 잠겼습니다. 잠시 후 다시 시도해 주세요.");
		}

		UserDTO savedUser = userDAO.selectUserByEmail(email);

		if (savedUser == null || !matchesPassword(userDTO.getPassword(), savedUser.getPasswordHash())) {
			int failCount = LOGIN_FAIL_COUNT.getOrDefault(email, 0) + 1;
			LOGIN_FAIL_COUNT.put(email, failCount);
			if (failCount >= LOGIN_FAIL_LIMIT) {
				LOCKED_UNTIL.put(email, now + LOCK_MILLIS);
			}
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
		}
		migrateLegacyPasswordHashIfNeeded(savedUser, userDTO.getPassword());
		LOGIN_FAIL_COUNT.remove(email);
		LOCKED_UNTIL.remove(email);

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

	public UserDTO updateCurrentUser(UserDTO userDTO, HttpSession session) {
		Long userId = (Long) session.getAttribute(LOGIN_USER_ID);

		if (userId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}

		if (isBlank(userDTO.getName())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름은 필수입니다.");
		}

		if (isBlank(userDTO.getPhone())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "연락처는 필수입니다.");
		}

		if (isBlank(userDTO.getAddress())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "주소는 필수입니다.");
		}

		UserDTO savedUser = userDAO.selectUserById(userId);
		if (savedUser == null) {
			session.invalidate();
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "세션 사용자 정보를 찾을 수 없습니다.");
		}

		UserDTO updateTarget = new UserDTO();
		updateTarget.setId(userId);
		updateTarget.setName(userDTO.getName().trim());
		updateTarget.setPhone(userDTO.getPhone().trim());
		updateTarget.setAddress(userDTO.getAddress().trim());
		userDAO.updateUserProfile(updateTarget);

		UserDTO updatedUser = userDAO.selectUserById(userId);
		return toResponseUser(updatedUser);
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

	private String encodePassword(String rawPassword) {
		return passwordEncoder.encode(rawPassword);
	}

	private boolean matchesPassword(String rawPassword, String savedHash) {
		if (isBlank(savedHash)) {
			return false;
		}
		if (isLegacySha256Hash(savedHash)) {
			return savedHash.equals(legacySha256(rawPassword));
		}
		return passwordEncoder.matches(rawPassword, savedHash);
	}

	private void migrateLegacyPasswordHashIfNeeded(UserDTO savedUser, String rawPassword) {
		if (savedUser == null || isBlank(savedUser.getPasswordHash())) {
			return;
		}
		if (!isLegacySha256Hash(savedUser.getPasswordHash())) {
			return;
		}
		userDAO.updateUserPasswordHashByEmail(savedUser.getEmail(), encodePassword(rawPassword));
	}

	private boolean isLegacySha256Hash(String savedHash) {
		return LEGACY_SHA256_PATTERN.matcher(savedHash).matches();
	}

	private String legacySha256(String rawPassword) {
		// 기존 가입 사용자 호환을 위한 임시 SHA-256 비교 루틴 (로그인 성공 시 bcrypt로 자동 전환됨)
		try {
			java.security.MessageDigest messageDigest = java.security.MessageDigest.getInstance("SHA-256");
			byte[] hash = messageDigest.digest(rawPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8));
			StringBuilder builder = new StringBuilder();
			for (byte value : hash) {
				builder.append(String.format("%02x", value));
			}
			return builder.toString();
		} catch (java.security.NoSuchAlgorithmException exception) {
			throw new IllegalStateException("기존 비밀번호 해시 비교에 실패했습니다.", exception);
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

	private void ensureAdminAccount(String email, String loginPassword) {
		if (!ADMIN_EMAIL.equalsIgnoreCase(email)) {
			return;
		}

		String adminPassword = resolveAdminPassword();
		String passwordHash = encodePassword(adminPassword);
		UserDTO savedAdmin = userDAO.selectUserByEmail(ADMIN_EMAIL);

		if (savedAdmin == null) {
			UserDTO adminUser = new UserDTO();
			adminUser.setName("관리자");
			adminUser.setEmail(ADMIN_EMAIL);
			adminUser.setPasswordHash(passwordHash);
			adminUser.setPhone("010-0000-0000");
			adminUser.setAddress("PetHotel 본사");
			userDAO.insertUser(adminUser);
			return;
		}

		boolean shouldSyncPassword = adminPassword.equals(loginPassword)
			&& !matchesPassword(adminPassword, savedAdmin.getPasswordHash());
		if (shouldSyncPassword) {
			userDAO.updateUserPasswordHashByEmail(ADMIN_EMAIL, passwordHash);
		}
	}

	private String resolveAdminPassword() {
		String fromEnv = System.getenv("PETHOTEL_ADMIN_PASSWORD");
		if (fromEnv != null && !fromEnv.trim().isEmpty()) {
			return fromEnv.trim();
		}
		return DEFAULT_ADMIN_PASSWORD;
	}

}
