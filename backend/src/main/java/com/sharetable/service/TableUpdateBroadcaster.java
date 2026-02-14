package com.sharetable.service;

import com.sharetable.domain.Table;
import com.sharetable.dto.TableResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Broadcasts table updates to WebSocket subscribers. Sends full TableResponse
 * to /topic/tables/{shareToken} so all connected clients receive real-time updates.
 */
@Service
public class TableUpdateBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public TableUpdateBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastTableUpdate(UUID shareToken, Table table) {
        String destination = "/topic/tables/" + shareToken;
        messagingTemplate.convertAndSend(destination, TableResponse.from(table));
    }
}
