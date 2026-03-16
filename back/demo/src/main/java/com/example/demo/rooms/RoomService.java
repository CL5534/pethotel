package com.example.demo.rooms;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class RoomService {

	private final RoomDAO roomDAO;

	public RoomService(RoomDAO roomDAO) {
		this.roomDAO = roomDAO;
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

	private int resolveNightlyRate(String sizeType) {
		if ("SMALL".equalsIgnoreCase(sizeType)) {
			return 60000;
		}
		if ("MEDIUM".equalsIgnoreCase(sizeType)) {
			return 90000;
		}
		return 70000;
	}
}
