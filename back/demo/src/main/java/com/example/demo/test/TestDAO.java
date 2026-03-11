package com.example.demo.test;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TestDAO {

	List<TestDTO> selectTestList();

	int insertTest(TestDTO testDTO);

}
