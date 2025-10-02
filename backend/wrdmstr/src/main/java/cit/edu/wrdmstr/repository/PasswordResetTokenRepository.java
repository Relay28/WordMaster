package cit.edu.wrdmstr.repository;

import cit.edu.wrdmstr.entity.PasswordResetToken;
import cit.edu.wrdmstr.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
    PasswordResetToken findByUserAndToken(UserEntity user, String token);
    void deleteByUser(UserEntity user);
}