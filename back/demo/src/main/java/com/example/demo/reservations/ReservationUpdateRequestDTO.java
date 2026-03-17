package com.example.demo.reservations;

import java.time.LocalDate;
import java.time.LocalTime;

public class ReservationUpdateRequestDTO {

	private Long roomId;
	private Long petId;
	private LocalDate checkInDate;
	private LocalDate checkOutDate;
	private LocalTime visitTime;
	private String guardianName;
	private String guardianPhone;
	private Boolean overrideMode;
	private String overrideReason;

	public Long getRoomId() { return roomId; }
	public void setRoomId(Long roomId) { this.roomId = roomId; }
	public Long getPetId() { return petId; }
	public void setPetId(Long petId) { this.petId = petId; }
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
	public Boolean getOverrideMode() { return overrideMode; }
	public void setOverrideMode(Boolean overrideMode) { this.overrideMode = overrideMode; }
	public String getOverrideReason() { return overrideReason; }
	public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }
}
