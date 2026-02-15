package com.sharetable.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * A user/editor identity. No authentication - the client generates the ID and optionally provides
 * a display name. Used for createdBy/modifiedBy tracking.
 */
@Entity
@jakarta.persistence.Table(name = "app_user")
public class User {

  @Id
  private UUID id;

  @jakarta.persistence.Column(name = "display_name", nullable = false)
  private String displayName;

  @jakarta.persistence.Column(name = "created_at", nullable = false)
  private Instant createdAt;

  protected User() {}

  public User(UUID id, String displayName) {
    this.id = id;
    this.displayName = displayName != null && !displayName.isBlank() ? displayName : "Anonymous";
    this.createdAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public String getDisplayName() {
    return displayName;
  }

  public void setDisplayName(String displayName) {
    this.displayName =
        displayName != null && !displayName.isBlank() ? displayName : "Anonymous";
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
