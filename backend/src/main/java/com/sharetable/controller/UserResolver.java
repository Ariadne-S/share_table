package com.sharetable.controller;

import com.sharetable.domain.User;
import com.sharetable.service.UserService;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;

/**
 * Resolves User from request headers X-User-Id and X-User-Name. Used for audit tracking without
 * authentication.
 */
@Component
public class UserResolver {

  public static final String HEADER_USER_ID = "X-User-Id";
  public static final String HEADER_USER_NAME = "X-User-Name";

  private final UserService userService;

  public UserResolver(UserService userService) {
    this.userService = userService;
  }

  /**
   * Resolves user from headers. If X-User-Id is present, finds or creates the user. Otherwise
   * returns empty (edits will have no modifiedBy).
   */
  public Optional<User> resolve(UUID userId, String userName) {
    if (userId == null) return Optional.empty();
    return Optional.of(userService.findOrCreate(userId, userName));
  }
}
