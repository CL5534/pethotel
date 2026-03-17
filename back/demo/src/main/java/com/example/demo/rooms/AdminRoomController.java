package com.example.demo.rooms;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/admin/rooms")
public class AdminRoomController {

	private final RoomService roomService;

	public AdminRoomController(RoomService roomService) {
		this.roomService = roomService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public RoomDTO createRoom(@RequestBody RoomDTO roomDTO, HttpSession session) {
		return roomService.createRoom(roomDTO, session);
	}

	@PutMapping("/{roomId}")
	public RoomDTO updateRoom(@PathVariable Long roomId, @RequestBody RoomDTO roomDTO, HttpSession session) {
		return roomService.updateRoom(roomId, roomDTO, session);
	}

	@DeleteMapping("/{roomId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteRoom(@PathVariable Long roomId, HttpSession session) {
		roomService.deleteRoom(roomId, session);
	}
}
