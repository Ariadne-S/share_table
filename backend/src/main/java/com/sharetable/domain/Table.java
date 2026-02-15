package com.sharetable.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A shared table that can be edited collaboratively via a shareable link. Contains ordered columns
 * (schema) and rows (data). Supports soft delete.
 */
@Entity(name = "ShareTable")
@jakarta.persistence.Table(name = "share_table")
public class Table {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @jakarta.persistence.Column(name = "share_token", nullable = false, unique = true)
  private UUID shareToken;

  @jakarta.persistence.Column(nullable = false)
  private String name;

  @jakarta.persistence.Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by_id")
  private User createdBy;

  @jakarta.persistence.Column(name = "modified_at")
  private Instant modifiedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "modified_by_id")
  private User modifiedBy;

  @jakarta.persistence.Column(name = "deleted_at")
  private Instant deletedAt;

  @OneToMany(
      mappedBy = "table",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  @OrderBy("ord ASC")
  private List<Column> columns = new ArrayList<>();

  @OneToMany(
      mappedBy = "table",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.LAZY)
  @OrderBy("ord ASC")
  private List<Row> rows = new ArrayList<>();

  protected Table() {}

  public Table(String name) {
    this.shareToken = UUID.randomUUID();
    this.name = name;
    this.createdAt = Instant.now();
  }

  public UUID getId() {
    return id;
  }

  public UUID getShareToken() {
    return shareToken;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public User getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(User createdBy) {
    this.createdBy = createdBy;
  }

  public Instant getModifiedAt() {
    return modifiedAt;
  }

  public void setModifiedAt(Instant modifiedAt) {
    this.modifiedAt = modifiedAt;
  }

  public User getModifiedBy() {
    return modifiedBy;
  }

  public void setModifiedBy(User modifiedBy) {
    this.modifiedBy = modifiedBy;
  }

  /** Call when table is modified; sets modifiedAt and modifiedBy. */
  public void markModified(User user) {
    this.modifiedAt = Instant.now();
    this.modifiedBy = user;
  }

  public Instant getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(Instant deletedAt) {
    this.deletedAt = deletedAt;
  }

  public boolean isDeleted() {
    return deletedAt != null;
  }

  public List<Column> getColumns() {
    return columns;
  }

  public List<Row> getRows() {
    return rows;
  }
}
