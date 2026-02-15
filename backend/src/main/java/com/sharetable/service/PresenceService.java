package com.sharetable.service;

import com.sharetable.dto.PresenceUpdate;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Tracks which users are viewing each table and which cells they are editing. Broadcasts presence
 * updates via WebSocket when users join, leave, or change editing state.
 */
@Service
public class PresenceService {

  private final SimpMessagingTemplate messagingTemplate;

  // shareToken -> (sessionId -> PresenceInfo)
  private final Map<UUID, Map<String, PresenceUpdate.PresenceInfo>> viewersByTable =
      new ConcurrentHashMap<>();

  // shareToken -> (sessionId -> ActiveEdit)
  private final Map<UUID, Map<String, PresenceUpdate.ActiveEdit>> activeEditsByTable =
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
    for (var entry : activeEditsByTable.entrySet()) {
      if (entry.getValue().remove(sessionId) != null) {
        broadcastPresence(entry.getKey());
      }
    }
  }

  public void setEditing(
      UUID shareToken,
      String sessionId,
      String userId,
      String displayName,
      String rowId,
      String columnId) {
    var edits = activeEditsByTable.computeIfAbsent(shareToken, k -> new ConcurrentHashMap<>());
    if (rowId != null && !rowId.isBlank() && columnId != null && !columnId.isBlank()) {
      edits.put(
          sessionId,
          new PresenceUpdate.ActiveEdit(
              userId, displayName != null ? displayName : "Anonymous", rowId, columnId));
    } else {
      edits.remove(sessionId);
    }
    broadcastPresence(shareToken);
  }

  private void broadcastPresence(UUID shareToken) {
    var viewers =
        viewersByTable.getOrDefault(shareToken, Map.<String, PresenceUpdate.PresenceInfo>of());
    var viewerList =
        viewers.values().stream()
            .distinct()
            .map(v -> new PresenceUpdate.PresenceInfo(v.userId(), v.displayName()))
            .toList();
    var edits =
        activeEditsByTable.getOrDefault(shareToken, Map.<String, PresenceUpdate.ActiveEdit>of());
    var editList =
        edits.values().stream()
            .map(
                e ->
                    new PresenceUpdate.ActiveEdit(
                        e.userId(), e.displayName(), e.rowId(), e.columnId()))
            .toList();
    messagingTemplate.convertAndSend(
        "/topic/tables/" + shareToken + "/presence", new PresenceUpdate(viewerList, editList));
  }
}
