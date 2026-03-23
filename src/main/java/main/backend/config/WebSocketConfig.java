package main.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // prefix สำหรับ broadcast ไปหา client (/topic/game → ทุกคนที่ subscribe)
        config.enableSimpleBroker("/topic");
        // prefix สำหรับ message จาก client มาหา server
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // endpoint ที่ client ใช้ connect
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();  // fallback สำหรับ browser ที่ไม่รองรับ WebSocket
    }
}