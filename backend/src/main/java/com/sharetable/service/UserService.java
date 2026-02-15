package com.sharetable.service;

import com.sharetable.domain.User;
import com.sharetable.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Finds or creates users by client-provided ID. No authentication - used for audit tracking
 * (createdBy, modifiedBy).
 */
@Service
public class UserService {

  private final UserRepository userRepository;

  public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Finds existing user or creates one if not found. Call with X-User-Id and X-User-Name from
   * client.
   */
  @Transactional
  public User findOrCreate(UUID id, String displayName) {
    return userRepository
        .findById(id)
        .map(
            u -> {
              if (displayName != null && !displayName.isBlank() && !displayName.equals(u.getDisplayName())) {
                u.setDisplayName(displayName);
                userRepository.save(u);
              }
              return u;
            })
        .orElseGet(() -> userRepository.save(new User(id, displayName)));
  }

  public Optional<User> findById(UUID id) {
    return userRepository.findById(id);
  }
}
