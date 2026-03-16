package com.example.demo.pets;

import java.time.LocalDate;

public class PetDTO {

	private Long id;
	private Long userId;
	private String name;
	private String breed;
	private Double weightKg;
	private LocalDate birthDate;
	private String notes;

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Long getUserId() { return userId; }
	public void setUserId(Long userId) { this.userId = userId; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getBreed() { return breed; }
	public void setBreed(String breed) { this.breed = breed; }
	public Double getWeightKg() { return weightKg; }
	public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
	public LocalDate getBirthDate() { return birthDate; }
	public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }
	public String getNotes() { return notes; }
	public void setNotes(String notes) { this.notes = notes; }
}
