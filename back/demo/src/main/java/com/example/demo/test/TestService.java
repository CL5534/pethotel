package com.example.demo.test;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class TestService {

	private final TestDAO testDAO;

	public TestService(TestDAO testDAO) {
		this.testDAO = testDAO;
	}

	public List<TestDTO> getTestList() {
		return testDAO.selectTestList();
	}

	public void addTest(TestDTO testDTO) {
		testDAO.insertTest(testDTO);
	}

}
