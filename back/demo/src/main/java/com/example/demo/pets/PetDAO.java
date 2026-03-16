package com.example.demo.pets;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PetDAO {

	List<PetDTO> selectPetsByUserId(@Param("userId") Long userId);

	PetDTO selectPetById(@Param("petId") Long petId);

	int insertPet(PetDTO petDTO);

	int updatePet(PetDTO petDTO);

	int deletePet(@Param("petId") Long petId);

	int countReservationsByPetId(@Param("petId") Long petId);
}
