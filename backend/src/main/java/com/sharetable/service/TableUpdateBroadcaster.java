package com.sharetable.service;

import com.sharetable.domain.Table;
import com.sharetable.dto.TableResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

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
