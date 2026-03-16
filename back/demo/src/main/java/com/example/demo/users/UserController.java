package com.example.demo.users;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@PostMapping("/signup")
	@ResponseStatus(HttpStatus.CREATED)
	public UserDTO signUp(@RequestBody UserDTO userDTO) {
		return userService.signUp(userDTO);
	}

	@PostMapping("/login")
	public UserDTO login(@RequestBody UserDTO userDTO, HttpSession session) {
		return userService.login(userDTO, session);
	}

	@GetMapping("/me")
	public UserDTO getCurrentUser(HttpSession session) {
		return userService.getCurrentUser(session);
	}

	@PutMapping("/me")
	public UserDTO updateCurrentUser(@RequestBody UserDTO userDTO, HttpSession session) {
		return userService.updateCurrentUser(userDTO, session);
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logout(HttpSession session) {
		userService.logout(session);
	}

}
