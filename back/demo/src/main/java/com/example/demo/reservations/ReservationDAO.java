package com.example.demo.reservations;

import java.time.LocalDate;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ReservationDAO {

	Long selectFirstUserId();

	int insertPetForReservation(PetInsertDTO petInsertDTO);

	Long selectPetIdByUserAndNameAndBreed(
		@Param("userId") Long userId,
		@Param("name") String name,
		@Param("breed") String breed
	);

	int insertReservation(ReservationDTO reservationDTO);

	List<ReservationDTO> selectReservationList();

	List<ReservationDTO> selectReservationListByUserId(@Param("userId") Long userId);

	ReservationDTO selectReservationByCode(@Param("reservationCode") String reservationCode);

	ReservationDTO selectReservationByCodeAndUserId(
		@Param("reservationCode") String reservationCode,
		@Param("userId") Long userId
	);

	int updateReservationStatusByCode(
		@Param("reservationCode") String reservationCode,
		@Param("status") String status
	);

	int deleteReservationByCodeAndUserId(
		@Param("reservationCode") String reservationCode,
		@Param("userId") Long userId
	);

	int countOverlappingReservations(
		@Param("roomId") Long roomId,
		@Param("checkInDate") LocalDate checkInDate,
		@Param("checkOutDate") LocalDate checkOutDate
	);

	int countOverlappingReservationsExcludingReservation(
		@Param("roomId") Long roomId,
		@Param("checkInDate") LocalDate checkInDate,
		@Param("checkOutDate") LocalDate checkOutDate,
		@Param("reservationCode") String reservationCode
	);

	int updateReservationByCodeAndUserId(ReservationDTO reservationDTO);
}
