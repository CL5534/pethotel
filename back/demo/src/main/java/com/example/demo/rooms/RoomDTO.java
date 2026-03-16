package com.example.demo.rooms;

public class RoomDTO {

	private Long id;
	private String roomCode;
	private String name;
	private String sizeType;
	private Double maxWeightKg;
	private Integer capacity;
	private String description;
	private Boolean isActive;
	private Integer totalQuantity;
	private Integer reservedQuantity;
	private Integer nightlyRate;

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getRoomCode() { return roomCode; }
	public void setRoomCode(String roomCode) { this.roomCode = roomCode; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getSizeType() { return sizeType; }
	public void setSizeType(String sizeType) { this.sizeType = sizeType; }
	public Double getMaxWeightKg() { return maxWeightKg; }
	public void setMaxWeightKg(Double maxWeightKg) { this.maxWeightKg = maxWeightKg; }
	public Integer getCapacity() { return capacity; }
	public void setCapacity(Integer capacity) { this.capacity = capacity; }
	public String getDescription() { return description; }
	public void setDescription(String description) { this.description = description; }
	public Boolean getIsActive() { return isActive; }
	public void setIsActive(Boolean isActive) { this.isActive = isActive; }
	public Integer getTotalQuantity() { return totalQuantity; }
	public void setTotalQuantity(Integer totalQuantity) { this.totalQuantity = totalQuantity; }
	public Integer getReservedQuantity() { return reservedQuantity; }
	public void setReservedQuantity(Integer reservedQuantity) { this.reservedQuantity = reservedQuantity; }
	public Integer getNightlyRate() { return nightlyRate; }
	public void setNightlyRate(Integer nightlyRate) { this.nightlyRate = nightlyRate; }
}
