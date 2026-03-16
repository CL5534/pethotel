package com.example.demo.reservations;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

	private final ReservationService reservationService;

	public ReservationController(ReservationService reservationService) {
		this.reservationService = reservationService;
	}

	@GetMapping
	public List<ReservationDTO> getReservations() {
		return reservationService.getReservations();
	}

	@GetMapping("/me")
	public List<ReservationDTO> getMyReservations(HttpSession session) {
		return reservationService.getMyReservations(session);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ReservationDTO createReservation(@RequestBody ReservationCreateRequestDTO requestDTO, HttpSession session) {
		return reservationService.createReservation(requestDTO, session);
	}

	@PostMapping("/{reservationCode}/confirm-payment")
	public ReservationDTO confirmPayment(@PathVariable String reservationCode) {
		return reservationService.confirmPayment(reservationCode);
	}

	@PostMapping("/{reservationCode}/cancel")
	public ReservationDTO cancelMyReservation(@PathVariable String reservationCode, HttpSession session) {
		return reservationService.cancelMyReservation(reservationCode, session);
	}

	@DeleteMapping("/{reservationCode}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteMyReservation(@PathVariable String reservationCode, HttpSession session) {
		reservationService.deleteMyReservation(reservationCode, session);
	}
}
