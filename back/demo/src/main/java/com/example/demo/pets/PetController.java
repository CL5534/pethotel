package com.example.demo.pets;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/pets")
public class PetController {

	private final PetService petService;

	public PetController(PetService petService) {
		this.petService = petService;
	}

	@GetMapping("/me")
	public List<PetDTO> getMyPets(HttpSession session) {
		return petService.getMyPets(session);
	}

	@PostMapping
	public PetDTO createMyPet(@RequestBody PetDTO petDTO, HttpSession session) {
		return petService.createMyPet(petDTO, session);
	}

	@PutMapping("/{petId}")
	public PetDTO updateMyPet(@PathVariable Long petId, @RequestBody PetDTO petDTO, HttpSession session) {
		return petService.updateMyPet(petId, petDTO, session);
	}

	@DeleteMapping("/{petId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteMyPet(@PathVariable Long petId, HttpSession session) {
		petService.deleteMyPet(petId, session);
	}
}
