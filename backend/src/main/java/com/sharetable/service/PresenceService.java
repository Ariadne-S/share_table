package com.sharetable.service;

import com.sharetable.dto.PresenceUpdate;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Tracks which users are viewing each table. Broadcasts presence updates via WebSocket when users
 * join or leave.
 */
@Service
public class PresenceService {

  private final SimpMessagingTemplate messagingTemplate;

  // shareToken -> (sessionId -> PresenceInfo)
  private final Map<UUID, Map<String, PresenceUpdate.PresenceInfo>> viewersByTable =
      new ConcurrentHashMap<>();

  public PresenceService(SimpMessagingTemplate messagingTemplate) {
    this.messagingTemplate = messagingTemplate;
  }

  public void join(UUID shareToken, String sessionId, String userId, String displayName) {
    viewersByTable
        .computeIfAbsent(shareToken, k -> new ConcurrentHashMap<>())
        .put(
            sessionId,
            new PresenceUpdate.PresenceInfo(
                userId, displayName != null ? displayName : "Anonymous"));
    broadcastPresence(shareToken);
  }

  public void leave(String sessionId) {
    for (var entry : viewersByTable.entrySet()) {
      if (entry.getValue().remove(sessionId) != null) {
        broadcastPresence(entry.getKey());
      }
    }
  }

  private void broadcastPresence(UUID shareToken) {
    var viewers =
        viewersByTable.getOrDefault(shareToken, Map.<String, PresenceUpdate.PresenceInfo>of());
    var list =
        viewers.values().stream()
            .distinct()
            .map(v -> new PresenceUpdate.PresenceInfo(v.userId(), v.displayName()))
            .toList();
    messagingTemplate.convertAndSend(
        "/topic/tables/" + shareToken + "/presence", new PresenceUpdate(list));
  }
}
