package com.example.match_me.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.example.match_me.security.JwtUtil;

/*When you call this in the frontend:
client.activate();
 ↑ The STOMP library automatically sends a CONNECT frame, basically asking 
*/

/* When you call this in the frontend:
stompClient.publish({
    destination: '/app/chat.sendMessage',
    body: JSON.stringify(message)
});
 ↑ The STOMP library automatically sends a SEND frame
*/

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public WebSocketConfig(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    //this is to configure the message routing 
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {

        //these are broadcasting topics (where the server sends messages to multiple clients)
        // Server → Client topics
        config.enableSimpleBroker("/topic");    // ← Where server broadcasts messages
        // Client → Server prefixes (where the client sends messages to the server)
        config.setApplicationDestinationPrefixes("/app"); // ← Prefix for client messages
    }
    //this is to register the stomp endpoints(configuring the infrastructure)
    //ws is an enpoint like i have /api/auth/login
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // This is where clients connect:
        registry.addEndpoint("/ws") //this is theconnection endpoint
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            //this is to intercept the messages that are sent to the server and check if the user is authenticated
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                //this is to get the header of the message
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                //this is to check if the message is a connect message
                //basicaally this should only happen once when the client connects to the server, the next time it will be a SEND message not a CONNECT message
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    //this is to get the token from the header
                    String token = accessor.getFirstNativeHeader("Authorization");
                    //this is to check if the token is null or does not start with Bearer
                    if (token == null || !token.startsWith("Bearer ")) {
                        throw new IllegalArgumentException("JWT token required");
                    }
                    //this is to get the token from the header
                    token = token.substring(7);
                    if (!jwtUtil.validateJwtToken(token)) {
                        throw new IllegalArgumentException("Invalid JWT token");
                    }
                    //this is to get the email from the token
                    String userEmail = jwtUtil.getEmailFromToken(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                    //adding user details to the WebSocket connection itself.
                    accessor.setUser(new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities()));
                }
                
                return message;
            }
        });
    }
}
