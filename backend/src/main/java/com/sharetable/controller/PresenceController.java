package com.sharetable.controller;

import com.sharetable.service.PresenceService;
import java.util.Map;
import java.util.UUID;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.Headers;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

/** Handles STOMP messages for collaborator presence (join, leave, editing). */
@Controller
public class PresenceController {

  private final PresenceService presenceService;

  public PresenceController(PresenceService presenceService) {
    this.presenceService = presenceService;
  }

  @MessageMapping("/presence/join/{shareToken}")
  public void join(
      @DestinationVariable UUID shareToken,
      @Headers Map<String, Object> headers,
      Map<String, String> payload) {
    String sessionId = (String) headers.get("simpSessionId");
    String userId = payload != null ? payload.get("userId") : null;
    String displayName = payload != null ? payload.get("displayName") : null;
    presenceService.join(shareToken, sessionId, userId != null ? userId : "anon", displayName);
  }

  @MessageMapping("/presence/editing/{shareToken}")
  public void editing(
      @DestinationVariable UUID shareToken,
      @Headers Map<String, Object> headers,
      Map<String, String> payload) {
    String sessionId = (String) headers.get("simpSessionId");
    String userId = payload != null ? payload.get("userId") : null;
    String displayName = payload != null ? payload.get("displayName") : null;
    String rowId = payload != null ? payload.get("rowId") : null;
    String columnId = payload != null ? payload.get("columnId") : null;
    presenceService.setEditing(
        shareToken, sessionId, userId != null ? userId : "anon", displayName, rowId, columnId);
  }
}
