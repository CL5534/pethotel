package com.example.demo.config;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<Map<String, Object>> handleResponseStatusException(
		ResponseStatusException exception,
		HttpServletRequest request
	) {
		HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
		HttpStatus safeStatus = status == null ? HttpStatus.BAD_REQUEST : status;

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("timestamp", OffsetDateTime.now().toString());
		body.put("status", safeStatus.value());
		body.put("error", safeStatus.getReasonPhrase());
		body.put("message", exception.getReason() == null ? "요청 처리에 실패했습니다." : exception.getReason());
		body.put("path", request.getRequestURI());

		return ResponseEntity.status(safeStatus).body(body);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, Object>> handleException(Exception exception, HttpServletRequest request) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("timestamp", OffsetDateTime.now().toString());
		body.put("status", 500);
		body.put("error", "Internal Server Error");
		body.put("message", "서버 내부 오류가 발생했습니다.");
		body.put("path", request.getRequestURI());
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
	}
}
