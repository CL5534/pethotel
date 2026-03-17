package com.example.demo.rooms;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.users.UserDAO;
import com.example.demo.users.UserDTO;

import jakarta.servlet.http.HttpSession;

@Service
public class RoomService {

	private static final String LOGIN_USER_ID = "LOGIN_USER_ID";
	private final RoomDAO roomDAO;
	private final UserDAO userDAO;

	public RoomService(RoomDAO roomDAO, UserDAO userDAO) {
		this.roomDAO = roomDAO;
		this.userDAO = userDAO;
	}

	public List<RoomDTO> getRooms(LocalDate checkInDate, LocalDate checkOutDate) {
		ensureDefaultRoomsIfEmpty();

		LocalDate safeCheckIn = checkInDate != null ? checkInDate : LocalDate.now();
		LocalDate safeCheckOut = checkOutDate != null ? checkOutDate : safeCheckIn.plusDays(1);

		List<RoomDTO> rooms = roomDAO.selectActiveRooms();
		for (RoomDTO room : rooms) {
			int reserved = roomDAO.countReservedByRoom(room.getId(), safeCheckIn, safeCheckOut);
			room.setReservedQuantity(reserved);
			room.setTotalQuantity(room.getCapacity());
			room.setNightlyRate(resolveNightlyRate(room.getSizeType()));
		}

		return rooms;
	}

	public void ensureDefaultRoomsIfEmpty() {
		if (roomDAO.countRooms() > 0) {
			return;
		}

		RoomDTO small = new RoomDTO();
		small.setRoomCode("SMALL");
		small.setName("소형견 전용룸");
		small.setSizeType("SMALL");
		small.setMaxWeightKg(5.0);
		small.setCapacity(6);
		small.setDescription("작은 체형 반려견을 위한 안정적인 기본 객실");
		small.setIsActive(true);
		roomDAO.insertDefaultRoom(small);

		RoomDTO medium = new RoomDTO();
		medium.setRoomCode("MEDIUM");
		medium.setName("중형견 케어룸");
		medium.setSizeType("MEDIUM");
		medium.setMaxWeightKg(10.0);
		medium.setCapacity(4);
		medium.setDescription("활동량이 높은 중형견을 위한 넓은 케어 객실");
		medium.setIsActive(true);
		roomDAO.insertDefaultRoom(medium);
	}

	public RoomDTO createRoom(RoomDTO requestDTO, HttpSession session) {
		ensureAdmin(session);
		validateRoomRequest(requestDTO);

		RoomDTO room = new RoomDTO();
		room.setRoomCode(requestDTO.getRoomCode().trim().toUpperCase());
		room.setName(requestDTO.getName().trim());
		room.setSizeType(requestDTO.getSizeType().trim().toUpperCase());
		room.setMaxWeightKg(requestDTO.getMaxWeightKg());
		room.setCapacity(requestDTO.getCapacity());
		room.setDescription(requestDTO.getDescription() == null ? "" : requestDTO.getDescription().trim());
		room.setIsActive(true);
		roomDAO.insertRoom(room);
		return roomDAO.selectRoomById(room.getId());
	}

	public RoomDTO updateRoom(Long roomId, RoomDTO requestDTO, HttpSession session) {
		ensureAdmin(session);
		RoomDTO saved = roomDAO.selectRoomById(roomId);
		if (saved == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "객실 정보를 찾을 수 없습니다.");
		}
		validateRoomRequest(requestDTO);

		RoomDTO updateTarget = new RoomDTO();
		updateTarget.setId(roomId);
		updateTarget.setRoomCode(requestDTO.getRoomCode().trim().toUpperCase());
		updateTarget.setName(requestDTO.getName().trim());
		updateTarget.setSizeType(requestDTO.getSizeType().trim().toUpperCase());
		updateTarget.setMaxWeightKg(requestDTO.getMaxWeightKg());
		updateTarget.setCapacity(requestDTO.getCapacity());
		updateTarget.setDescription(requestDTO.getDescription() == null ? "" : requestDTO.getDescription().trim());
		updateTarget.setIsActive(requestDTO.getIsActive() == null ? Boolean.TRUE : requestDTO.getIsActive());
		roomDAO.updateRoom(updateTarget);
		return roomDAO.selectRoomById(roomId);
	}

	public void deleteRoom(Long roomId, HttpSession session) {
		ensureAdmin(session);
		RoomDTO saved = roomDAO.selectRoomById(roomId);
		if (saved == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "객실 정보를 찾을 수 없습니다.");
		}
		roomDAO.softDeleteRoom(roomId);
	}

	private int resolveNightlyRate(String sizeType) {
		if ("SMALL".equalsIgnoreCase(sizeType)) {
			return 60000;
		}
		if ("MEDIUM".equalsIgnoreCase(sizeType)) {
			return 90000;
		}
		return 70000;
	}

	private void validateRoomRequest(RoomDTO roomDTO) {
		if (roomDTO == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "객실 정보가 비어 있습니다.");
		}
		if (isBlank(roomDTO.getRoomCode())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "객실 코드는 필수입니다.");
		}
		if (isBlank(roomDTO.getName())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "객실명은 필수입니다.");
		}
		if (isBlank(roomDTO.getSizeType())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "객실 타입은 필수입니다.");
		}
		if (roomDTO.getMaxWeightKg() == null || roomDTO.getMaxWeightKg() <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "최대중량은 0보다 커야 합니다.");
		}
		if (roomDTO.getCapacity() == null || roomDTO.getCapacity() <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "객실 수량은 1 이상이어야 합니다.");
		}
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private void ensureAdmin(HttpSession session) {
		Long loginUserId = (Long) session.getAttribute(LOGIN_USER_ID);
		if (loginUserId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
		}
		UserDTO userDTO = userDAO.selectUserById(loginUserId);
		boolean isAdmin = userDTO != null
			&& userDTO.getEmail() != null
			&& "admin@pethotel.kr".equalsIgnoreCase(userDTO.getEmail().trim());
		if (!isAdmin) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
		}
	}
}
