package com.example.demo.reservations;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.server.ResponseStatusException;

import com.example.demo.pets.PetDAO;
import com.example.demo.pets.PetDTO;
import com.example.demo.rooms.RoomDAO;
import com.example.demo.rooms.RoomDTO;
import com.example.demo.rooms.RoomService;
import com.example.demo.users.UserDAO;
import com.example.demo.users.UserDTO;

import jakarta.servlet.http.HttpSession;

@Service
public class ReservationService {

  private static final String LOGIN_USER_ID = "LOGIN_USER_ID";
  private static final ZoneId KST_ZONE = ZoneId.of("Asia/Seoul");

  private final ReservationDAO reservationDAO;
  private final RoomDAO roomDAO;
  private final RoomService roomService;
  private final PetDAO petDAO;
  private final UserDAO userDAO;

  public ReservationService(
    ReservationDAO reservationDAO,
    RoomDAO roomDAO,
    RoomService roomService,
    PetDAO petDAO,
    UserDAO userDAO
  ) {
    this.reservationDAO = reservationDAO;
    this.roomDAO = roomDAO;
    this.roomService = roomService;
    this.petDAO = petDAO;
    this.userDAO = userDAO;
  }

  public List<ReservationDTO> getReservations() {
    return reservationDAO.selectReservationList();
  }

  public List<ReservationDTO> getMyReservations(HttpSession session) {
    Long loginUserId = getLoginUserId(session);
    return reservationDAO.selectReservationListByUserId(loginUserId);
  }

  @Transactional(isolation = Isolation.SERIALIZABLE)
  public ReservationDTO createReservation(ReservationCreateRequestDTO requestDTO, HttpSession session) {
    validateRequest(requestDTO);
    roomService.ensureDefaultRoomsIfEmpty();
    // Lock room row to prevent overbooking in concurrent requests.
    RoomDTO room = roomDAO.selectRoomByIdForUpdate(requestDTO.getRoomId());
    if (room == null || !Boolean.TRUE.equals(room.getIsActive())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효한 객실이 아닙니다.");
    }

    int nights = (int) ChronoUnit.DAYS.between(requestDTO.getCheckInDate(), requestDTO.getCheckOutDate());
    if (nights <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "체크아웃 날짜는 체크인 날짜보다 뒤여야 합니다.");
    }

    int overlapCount = reservationDAO.countOverlappingReservations(
      room.getId(),
      requestDTO.getCheckInDate(),
      requestDTO.getCheckOutDate()
    );
    if (overlapCount >= room.getCapacity()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "선택한 객실 타입의 잔여 객실이 없습니다.");
    }

    Long userId = getLoginUserId(session);
    PetDTO savedPet = petDAO.selectPetById(requestDTO.getPetId());
    if (savedPet == null || !savedPet.getUserId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "등록된 반려견 정보가 없습니다.");
    }

    ReservationDTO reservationDTO = new ReservationDTO();
    reservationDTO.setReservationCode(generateReservationCode());
    reservationDTO.setUserId(userId);
    reservationDTO.setPetId(savedPet.getId());
    reservationDTO.setRoomId(room.getId());
    reservationDTO.setCheckInDate(requestDTO.getCheckInDate());
    reservationDTO.setCheckOutDate(requestDTO.getCheckOutDate());
    reservationDTO.setVisitTime(requestDTO.getVisitTime());
    reservationDTO.setGuardianName(requestDTO.getGuardianName().trim());
    reservationDTO.setGuardianPhone(requestDTO.getGuardianPhone().trim());
    reservationDTO.setStatus("PAYMENT_PENDING");

    int nightlyRate = resolveNightlyRate(room.getSizeType());
    int baseAmount = nightlyRate * nights;
    int extraAmount = resolveExtraAmount(requestDTO.getVisitTime() != null ? requestDTO.getVisitTime().toString() : null);
    reservationDTO.setBaseAmount(baseAmount);
    reservationDTO.setExtraAmount(extraAmount);
    reservationDTO.setTotalAmount(baseAmount + extraAmount);

    reservationDAO.insertReservation(reservationDTO);
    return reservationDAO.selectReservationByCode(reservationDTO.getReservationCode());
  }

  @Transactional
  public ReservationDTO confirmPayment(String reservationCode) {
    ReservationDTO saved = reservationDAO.selectReservationByCode(reservationCode);
    if (saved == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "예약 정보를 찾을 수 없습니다.");
    }
    if (isEarlyVisitTime(saved.getVisitTime())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "07:00~10:00 예약은 관리자 승인 후 확정됩니다.");
    }

    reservationDAO.updateReservationStatusByCode(reservationCode, "CONFIRMED");
    return reservationDAO.selectReservationByCode(reservationCode);
  }

  @Transactional
  public ReservationDTO adminUpdateReservationStatus(String reservationCode, String status, HttpSession session) {
    ensureAdmin(session);
    ReservationDTO saved = reservationDAO.selectReservationByCode(reservationCode);
    if (saved == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "예약 정보를 찾을 수 없습니다.");
    }
    String nextStatus = status == null ? "" : status.trim().toUpperCase();
    if (
      !"PAYMENT_PENDING".equals(nextStatus)
      && !"CONFIRMED".equals(nextStatus)
      && !"CHECKED_IN".equals(nextStatus)
      && !"CHECKED_OUT".equals(nextStatus)
      && !"CANCELED".equals(nextStatus)
    ) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효하지 않은 상태값입니다.");
    }

    if ("CHECKED_IN".equals(nextStatus) && !"CONFIRMED".equals(saved.getStatus())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "체크인은 예약확정 상태에서만 가능합니다.");
    }
    if ("CHECKED_OUT".equals(nextStatus) && !"CHECKED_IN".equals(saved.getStatus())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "체크아웃은 체크인완료 상태에서만 가능합니다.");
    }

    reservationDAO.updateReservationStatusByCode(reservationCode, nextStatus);
    return reservationDAO.selectReservationByCode(reservationCode);
  }

  @Transactional(isolation = Isolation.SERIALIZABLE)
  public ReservationDTO adminUpdateReservation(String reservationCode, ReservationUpdateRequestDTO requestDTO, HttpSession session) {
    ensureAdmin(session);
    ReservationDTO saved = reservationDAO.selectReservationByCode(reservationCode);
    if (saved == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "예약 정보를 찾을 수 없습니다.");
    }
    return updateReservationInternal(saved, requestDTO, true);
  }

  @Transactional
  public ReservationDTO cancelMyReservation(String reservationCode, HttpSession session) {
    Long loginUserId = getLoginUserId(session);
    ReservationDTO saved = reservationDAO.selectReservationByCodeAndUserId(reservationCode, loginUserId);
    if (saved == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "예약 정보를 찾을 수 없습니다.");
    }

    String status = saved.getStatus();
    if (!"PAYMENT_PENDING".equals(status) && !"CONFIRMED".equals(status)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "현재 상태에서는 예약 취소가 불가능합니다.");
    }
    if (!saved.getCheckInDate().isAfter(todayKst())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "예약 취소는 체크인 이전 상태에서만 가능합니다.");
    }

    reservationDAO.updateReservationStatusByCode(reservationCode, "CANCELED");
    return reservationDAO.selectReservationByCodeAndUserId(reservationCode, loginUserId);
  }

  @Transactional(isolation = Isolation.SERIALIZABLE)
  public ReservationDTO updateMyReservation(String reservationCode, ReservationUpdateRequestDTO requestDTO, HttpSession session) {
    Long loginUserId = getLoginUserId(session);
    ReservationDTO saved = reservationDAO.selectReservationByCodeAndUserId(reservationCode, loginUserId);
    if (saved == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "예약 정보를 찾을 수 없습니다.");
    }

    String status = saved.getStatus();
    if (!"PAYMENT_PENDING".equals(status) && !"CONFIRMED".equals(status)) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "현재 상태에서는 예약 수정이 불가능합니다.");
    }

    LocalDate today = todayKst();
    LocalDate customerModifyDeadline = saved.getCheckInDate().minusDays(3);
    LocalDate adminOnlyDate = saved.getCheckInDate().minusDays(1);

    if (!today.isBefore(adminOnlyDate)) {
      throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "체크인 1일 전(한국시간 00:00) 이후에는 고객 수정이 불가합니다. 관리자에게 문의해 주세요."
      );
    }
    if (today.isAfter(customerModifyDeadline)) {
      throw new ResponseStatusException(
        HttpStatus.CONFLICT,
        "고객 예약 수정은 체크인 3일 전(한국시간 00:00)까지 가능합니다."
      );
    }

    return updateReservationInternal(saved, requestDTO, false);
  }

  private ReservationDTO updateReservationInternal(
    ReservationDTO saved,
    ReservationUpdateRequestDTO requestDTO,
    boolean allowOverride
  ) {
    Long targetRoomId = requestDTO.getRoomId() != null ? requestDTO.getRoomId() : saved.getRoomId();
    LocalDate targetCheckInDate = requestDTO.getCheckInDate() != null ? requestDTO.getCheckInDate() : saved.getCheckInDate();
    LocalDate targetCheckOutDate = requestDTO.getCheckOutDate() != null ? requestDTO.getCheckOutDate() : saved.getCheckOutDate();
    String savedVisitTime = saved.getVisitTime() != null ? saved.getVisitTime().toString() : "10:00";
    String targetVisitTime = requestDTO.getVisitTime() != null ? requestDTO.getVisitTime().toString() : savedVisitTime;
    String targetGuardianName = isBlank(requestDTO.getGuardianName()) ? saved.getGuardianName() : requestDTO.getGuardianName().trim();
    String targetGuardianPhone = isBlank(requestDTO.getGuardianPhone()) ? saved.getGuardianPhone() : requestDTO.getGuardianPhone().trim();
    Long targetPetId = requestDTO.getPetId() != null ? requestDTO.getPetId() : saved.getPetId();

    if (targetCheckInDate == null || targetCheckOutDate == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "체크인/체크아웃 날짜는 필수입니다.");
    }
    if (targetCheckInDate.isBefore(todayKst())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "과거 날짜는 선택할 수 없습니다.");
    }
    int nights = (int) ChronoUnit.DAYS.between(targetCheckInDate, targetCheckOutDate);
    if (nights <= 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "체크아웃 날짜는 체크인 날짜보다 뒤여야 합니다.");
    }
    if (isBlank(targetGuardianName) || isBlank(targetGuardianPhone)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "보호자 이름과 연락처는 필수입니다.");
    }
    if (resolveExtraAmount(targetVisitTime) < 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방문 시간은 07:00~19:00 사이만 가능합니다.");
    }

    RoomDTO room = roomDAO.selectRoomByIdForUpdate(targetRoomId);
    if (room == null || !Boolean.TRUE.equals(room.getIsActive())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "유효한 객실이 아닙니다.");
    }

    if (!(allowOverride && Boolean.TRUE.equals(requestDTO.getOverrideMode()))) {
      int overlapCount = reservationDAO.countOverlappingReservationsExcludingReservation(
        room.getId(),
        targetCheckInDate,
        targetCheckOutDate,
        saved.getReservationCode()
      );
      if (overlapCount >= room.getCapacity()) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "선택한 객실 타입의 잔여 객실이 없습니다.");
      }
    } else if (isBlank(requestDTO.getOverrideReason())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "오버라이드 모드에는 사유 입력이 필수입니다.");
    }

    PetDTO savedPet = petDAO.selectPetById(targetPetId);
    if (savedPet == null || !savedPet.getUserId().equals(saved.getUserId())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "등록된 반려견 정보가 없습니다.");
    }

    int nightlyRate = resolveNightlyRate(room.getSizeType());
    int baseAmount = nightlyRate * nights;
    int extraAmount = resolveExtraAmount(targetVisitTime);

    ReservationDTO updateTarget = new ReservationDTO();
    updateTarget.setReservationCode(saved.getReservationCode());
    updateTarget.setUserId(saved.getUserId());
    updateTarget.setRoomId(room.getId());
    updateTarget.setPetId(savedPet.getId());
    updateTarget.setCheckInDate(targetCheckInDate);
    updateTarget.setCheckOutDate(targetCheckOutDate);
    updateTarget.setVisitTime(requestDTO.getVisitTime() != null ? requestDTO.getVisitTime() : java.time.LocalTime.parse(savedVisitTime));
    updateTarget.setGuardianName(targetGuardianName);
    updateTarget.setGuardianPhone(targetGuardianPhone);
    updateTarget.setBaseAmount(baseAmount);
    updateTarget.setExtraAmount(extraAmount);
    updateTarget.setTotalAmount(baseAmount + extraAmount);

    reservationDAO.updateReservationByCodeAndUserId(updateTarget);
    return reservationDAO.selectReservationByCode(saved.getReservationCode());
  }

  @Transactional
  public void deleteMyReservation(String reservationCode, HttpSession session) {
    Long loginUserId = getLoginUserId(session);
    ReservationDTO saved = reservationDAO.selectReservationByCodeAndUserId(reservationCode, loginUserId);
    if (saved == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "예약 정보를 찾을 수 없습니다.");
    }
    reservationDAO.deleteReservationByCodeAndUserId(reservationCode, loginUserId);
  }

  private void validateRequest(ReservationCreateRequestDTO requestDTO) {
    if (requestDTO.getRoomId() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "객실 선택은 필수입니다.");
    }
    if (requestDTO.getCheckInDate() == null || requestDTO.getCheckOutDate() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "체크인/체크아웃 날짜는 필수입니다.");
    }
    if (requestDTO.getCheckInDate().isBefore(todayKst())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "과거 날짜는 선택할 수 없습니다.");
    }
    if (isBlank(requestDTO.getGuardianName()) || isBlank(requestDTO.getGuardianPhone())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "보호자 이름과 연락처는 필수입니다.");
    }
    if (requestDTO.getPetId() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "반려견 선택은 필수입니다.");
    }

    if (requestDTO.getVisitTime() != null) {
      String visitTime = requestDTO.getVisitTime().toString();
      if (resolveExtraAmount(visitTime) < 0) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "방문 시간은 07:00~19:00 사이만 가능합니다.");
      }
    }
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isEmpty();
  }

  private LocalDate todayKst() {
    return LocalDate.now(KST_ZONE);
  }

  private boolean isEarlyVisitTime(java.time.LocalTime visitTime) {
    if (visitTime == null) return false;
    String value = visitTime.toString();
    return value.compareTo("07:00") >= 0 && value.compareTo("10:00") < 0;
  }

  private void ensureAdmin(HttpSession session) {
    Long loginUserId = getLoginUserId(session);
    UserDTO userDTO = userDAO.selectUserById(loginUserId);
    boolean isAdmin = userDTO != null
      && userDTO.getEmail() != null
      && "admin@pethotel.kr".equalsIgnoreCase(userDTO.getEmail().trim());
    if (!isAdmin) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "관리자 권한이 필요합니다.");
    }
  }

  private Long getLoginUserId(HttpSession session) {
    Long loginUserId = (Long) session.getAttribute(LOGIN_USER_ID);
    if (loginUserId == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
    }
    return loginUserId;
  }

  private String generateReservationCode() {
    return "R-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
  }

  private int resolveNightlyRate(String sizeType) {
    if ("SMALL".equalsIgnoreCase(sizeType)) return 60000;
    if ("MEDIUM".equalsIgnoreCase(sizeType)) return 90000;
    return 70000;
  }

  private int resolveExtraAmount(String visitTime) {
    if (visitTime == null || visitTime.isBlank()) return 0;
    if (visitTime.compareTo("07:00") < 0) return -1;
    if (visitTime.compareTo("08:00") < 0) return 10000;
    if (visitTime.compareTo("10:00") < 0) return 5000;
    if (visitTime.compareTo("19:00") <= 0) return 0;
    return -1;
  }
}
