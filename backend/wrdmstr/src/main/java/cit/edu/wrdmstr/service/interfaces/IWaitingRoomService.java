package cit.edu.wrdmstr.service.interfaces;

import cit.edu.wrdmstr.dto.UserDto;
import cit.edu.wrdmstr.entity.GameSessionEntity;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface IWaitingRoomService {
    void joinWaitingRoom(Long contentId, Long userId, String userName);
    void removeFromWaitingRoom(Long contentId, Long userId);
    List<UserDto> getWaitingStudents(Long contentId);
    List<GameSessionEntity> startGameWithWaitingStudents(Long contentId, Authentication auth);
}