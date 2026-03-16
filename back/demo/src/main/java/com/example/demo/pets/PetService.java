package com.example.demo.pets;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpSession;

@Service
public class PetService {

	private static final String LOGIN_USER_ID = "LOGIN_USER_ID";

	private final PetDAO petDAO;

	public PetService(PetDAO petDAO) {
		this.petDAO = petDAO;
	}

	public List<PetDTO> getMyPets(HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		return petDAO.selectPetsByUserId(loginUserId);
	}

	public PetDTO createMyPet(PetDTO petDTO, HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		validatePet(petDTO);

		PetDTO insertTarget = new PetDTO();
		insertTarget.setUserId(loginUserId);
		insertTarget.setName(petDTO.getName().trim());
		insertTarget.setBreed(petDTO.getBreed().trim());
		insertTarget.setWeightKg(petDTO.getWeightKg());
		insertTarget.setBirthDate(petDTO.getBirthDate());
		insertTarget.setNotes(petDTO.getNotes() == null ? "" : petDTO.getNotes().trim());

		petDAO.insertPet(insertTarget);
		return petDAO.selectPetById(insertTarget.getId());
	}

	public PetDTO updateMyPet(Long petId, PetDTO petDTO, HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		PetDTO savedPet = getOwnedPet(petId, loginUserId);
		validatePet(petDTO);

		PetDTO updateTarget = new PetDTO();
		updateTarget.setId(savedPet.getId());
		updateTarget.setUserId(savedPet.getUserId());
		updateTarget.setName(petDTO.getName().trim());
		updateTarget.setBreed(petDTO.getBreed().trim());
		updateTarget.setWeightKg(petDTO.getWeightKg());
		updateTarget.setBirthDate(petDTO.getBirthDate());
		updateTarget.setNotes(petDTO.getNotes() == null ? "" : petDTO.getNotes().trim());

		petDAO.updatePet(updateTarget);
		return petDAO.selectPetById(savedPet.getId());
	}

	public void deleteMyPet(Long petId, HttpSession session) {
		Long loginUserId = getLoginUserId(session);
		PetDTO savedPet = getOwnedPet(petId, loginUserId);

		int reservationCount = petDAO.countReservationsByPetId(savedPet.getId());
		if (reservationCount > 0) {
			throw new ResponseStatusException(
				HttpStatus.CONFLICT,
				"예약 이력이 있는 반려견은 삭제할 수 없습니다. 반려견 정보 수정만 가능합니다."
			);
		}

		petDAO.deletePet(savedPet.getId());
	}

	private PetDTO getOwnedPet(Long petId, Long loginUserId) {
		PetDTO savedPet = petDAO.selectPetById(petId);

		if (savedPet == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet not found.");
		}

		if (!savedPet.getUserId().equals(loginUserId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner can modify pet.");
		}

		return savedPet;
	}

	private Long getLoginUserId(HttpSession session) {
		Long loginUserId = (Long) session.getAttribute(LOGIN_USER_ID);

		if (loginUserId == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login required.");
		}

		return loginUserId;
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}

	private void validatePet(PetDTO petDTO) {
		if (isBlank(petDTO.getName())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required.");
		}

		if (isBlank(petDTO.getBreed())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "breed is required.");
		}
	}
}
