package com.sharetable.config;

import com.sharetable.service.PresenceService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class WebSocketEventListener {

  private final PresenceService presenceService;

  public WebSocketEventListener(PresenceService presenceService) {
    this.presenceService = presenceService;
  }

  @EventListener
  public void handleSessionDisconnect(SessionDisconnectEvent event) {
    StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
    String sessionId = headerAccessor.getSessionId();
    if (sessionId != null) {
      presenceService.leave(sessionId);
    }
  }
}
