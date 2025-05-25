package cit.edu.wrdmstr.service.interfaces;

import cit.edu.wrdmstr.dto.UserProfileDto;
import cit.edu.wrdmstr.dto.UserProfileUpdateDto;
import cit.edu.wrdmstr.dto.UserSetupDto;
import cit.edu.wrdmstr.entity.UserEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface IProfileService {
    UserProfileDto getAuthenticatedUserProfile(Authentication authentication);
    UserEntity updateAuthenticatedUserProfile(Authentication authentication, UserProfileUpdateDto updateDto);
    String uploadProfilePicture(Authentication authentication, MultipartFile file) throws IOException;
    String deactivateAuthenticatedUser(Authentication authentication);
    UserEntity setupUserProfile(Authentication authentication, UserSetupDto setupDto);
    boolean isSetupNeeded(Authentication authentication);
}