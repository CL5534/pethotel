package com.example.demo.reservations;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class ReservationDTO {

	private Long id;
	private String reservationCode;
	private Long userId;
	private Long petId;
	private Long roomId;
	private LocalDate checkInDate;
	private LocalDate checkOutDate;
	private LocalTime visitTime;
	private String guardianName;
	private String guardianPhone;
	private String status;
	private Integer baseAmount;
	private Integer extraAmount;
	private Integer totalAmount;
	private LocalDateTime createdAt;
	private String roomName;
	private String petName;

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getReservationCode() { return reservationCode; }
	public void setReservationCode(String reservationCode) { this.reservationCode = reservationCode; }
	public Long getUserId() { return userId; }
	public void setUserId(Long userId) { this.userId = userId; }
	public Long getPetId() { return petId; }
	public void setPetId(Long petId) { this.petId = petId; }
	public Long getRoomId() { return roomId; }
	public void setRoomId(Long roomId) { this.roomId = roomId; }
	public LocalDate getCheckInDate() { return checkInDate; }
	public void setCheckInDate(LocalDate checkInDate) { this.checkInDate = checkInDate; }
	public LocalDate getCheckOutDate() { return checkOutDate; }
	public void setCheckOutDate(LocalDate checkOutDate) { this.checkOutDate = checkOutDate; }
	public LocalTime getVisitTime() { return visitTime; }
	public void setVisitTime(LocalTime visitTime) { this.visitTime = visitTime; }
	public String getGuardianName() { return guardianName; }
	public void setGuardianName(String guardianName) { this.guardianName = guardianName; }
	public String getGuardianPhone() { return guardianPhone; }
	public void setGuardianPhone(String guardianPhone) { this.guardianPhone = guardianPhone; }
	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }
	public Integer getBaseAmount() { return baseAmount; }
	public void setBaseAmount(Integer baseAmount) { this.baseAmount = baseAmount; }
	public Integer getExtraAmount() { return extraAmount; }
	public void setExtraAmount(Integer extraAmount) { this.extraAmount = extraAmount; }
	public Integer getTotalAmount() { return totalAmount; }
	public void setTotalAmount(Integer totalAmount) { this.totalAmount = totalAmount; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
	public String getRoomName() { return roomName; }
	public void setRoomName(String roomName) { this.roomName = roomName; }
	public String getPetName() { return petName; }
	public void setPetName(String petName) { this.petName = petName; }
}
