package com.sharetable.dto;

import java.util.List;

/** Broadcast to clients when collaborator presence changes. */
public record PresenceUpdate(List<PresenceInfo> viewers) {

  public record PresenceInfo(String userId, String displayName) {}
}
