package com.example.demo.test;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

	private final TestService testService;

	public TestController(TestService testService) {
		this.testService = testService;
	}

	@GetMapping
	public List<TestDTO> getTestList() {
		return testService.getTestList();
	}

	@PostMapping
	public TestDTO addTest(@RequestBody TestDTO testDTO) {
		testService.addTest(testDTO);
		return testDTO;
	}

}
