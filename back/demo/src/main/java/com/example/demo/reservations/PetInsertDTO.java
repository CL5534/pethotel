package com.example.demo.reservations;

public class PetInsertDTO {

	private Long petId;
	private Long userId;
	private String name;
	private String breed;
	private Double weightKg;
	private Integer age;
	private String notes;

	public Long getPetId() { return petId; }
	public void setPetId(Long petId) { this.petId = petId; }
	public Long getUserId() { return userId; }
	public void setUserId(Long userId) { this.userId = userId; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getBreed() { return breed; }
	public void setBreed(String breed) { this.breed = breed; }
	public Double getWeightKg() { return weightKg; }
	public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
	public Integer getAge() { return age; }
	public void setAge(Integer age) { this.age = age; }
	public String getNotes() { return notes; }
	public void setNotes(String notes) { this.notes = notes; }
}
