package com.example.demo.rooms;

import java.time.LocalDate;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RoomDAO {

	int countRooms();

	int insertDefaultRoom(RoomDTO room);

	List<RoomDTO> selectActiveRooms();

	RoomDTO selectRoomById(@Param("roomId") Long roomId);

	RoomDTO selectRoomByIdForUpdate(@Param("roomId") Long roomId);

	int insertRoom(RoomDTO room);

	int updateRoom(RoomDTO room);

	int softDeleteRoom(@Param("roomId") Long roomId);

	int countReservedByRoom(
		@Param("roomId") Long roomId,
		@Param("checkInDate") LocalDate checkInDate,
		@Param("checkOutDate") LocalDate checkOutDate
	);
}
