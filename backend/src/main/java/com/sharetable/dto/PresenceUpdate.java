package com.sharetable.dto;

import java.util.List;

/** Broadcast to clients when collaborator presence or active edits change. */
public record PresenceUpdate(List<PresenceInfo> viewers, List<ActiveEdit> activeEdits) {

  public PresenceUpdate(List<PresenceInfo> viewers) {
    this(viewers, List.of());
  }

  public record PresenceInfo(String userId, String displayName) {}

  /** A user currently editing a cell. */
  public record ActiveEdit(String userId, String displayName, String rowId, String columnId) {}
}
