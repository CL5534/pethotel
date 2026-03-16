package com.example.demo.reservations;

import java.time.LocalDate;
import java.time.LocalTime;

public class ReservationCreateRequestDTO {

	private Long roomId;
	private LocalDate checkInDate;
	private LocalDate checkOutDate;
	private LocalTime visitTime;
	private String guardianName;
	private String guardianPhone;
	private Long petId;
	private String petName;
	private String petBreed;
	private Integer petAge;
	private String notes;

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
	public Long getPetId() { return petId; }
	public void setPetId(Long petId) { this.petId = petId; }
	public String getPetName() { return petName; }
	public void setPetName(String petName) { this.petName = petName; }
	public String getPetBreed() { return petBreed; }
	public void setPetBreed(String petBreed) { this.petBreed = petBreed; }
	public Integer getPetAge() { return petAge; }
	public void setPetAge(Integer petAge) { this.petAge = petAge; }
	public String getNotes() { return notes; }
	public void setNotes(String notes) { this.notes = notes; }
}
