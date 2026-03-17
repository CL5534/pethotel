package com.example.demo.reservations;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/admin/reservations")
public class AdminReservationController {

	private final ReservationService reservationService;

	public AdminReservationController(ReservationService reservationService) {
		this.reservationService = reservationService;
	}

	@PostMapping("/{reservationCode}/status")
	public ReservationDTO updateReservationStatus(
		@PathVariable String reservationCode,
		@RequestBody AdminReservationStatusRequestDTO requestDTO,
		HttpSession session
	) {
		return reservationService.adminUpdateReservationStatus(reservationCode, requestDTO.getStatus(), session);
	}

	@PutMapping("/{reservationCode}")
	public ReservationDTO updateReservation(
		@PathVariable String reservationCode,
		@RequestBody ReservationUpdateRequestDTO requestDTO,
		HttpSession session
	) {
		return reservationService.adminUpdateReservation(reservationCode, requestDTO, session);
	}
}
