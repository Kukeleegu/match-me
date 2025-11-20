import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// Global flag to prevent multiple connections across component re-mounts
let globalConnectionAttempted = false;

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnecting = false;
    this.subscriptions = new Map();
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onMatchCallbacks = [];
    this.onMessageCallbacks = [];
    this.seenMessages = new Map(); // Track seen messages by chat
    this.typingSubscriptions = new Map(); // Track typing status subscriptions
    this.currentUserId = null; // Cache the current user ID
    this.onlineUsers = new Map();
    this.onPresenceCallbacks = [];
    this.presenceInterval = null;
    console.log("[WebSocket] Service initialized");
  }

  addOnConnectCallback(callback) {
    console.log("[WebSocket] Adding connect callback");
    this.onConnectCallbacks.push(callback);
  }

  addOnDisconnectCallback(callback) {
    console.log("[WebSocket] Adding disconnect callback");
    this.onDisconnectCallbacks.push(callback);
  }

  addOnMatchCallback(callback) {
    console.log("[WebSocket] Adding match callback");
    this.onMatchCallbacks.push(callback);
    console.log(
      "[WebSocket] Current match callbacks count:",
      this.onMatchCallbacks.length
    );
  }

  addOnMessageCallback(callback) {
    console.log("[WebSocket] Adding message callback");
    this.onMessageCallbacks.push(callback);
    console.log(
      "[WebSocket] Current message callbacks count:",
      this.onMessageCallbacks.length
    );
  }

  addOnPresenceCallback(callback) {
    console.log("[WebSocket] Adding presence callback");
    this.onPresenceCallbacks.push(callback);
  }

  connect(token, matches, chatIds) {
    console.log("[WebSocket] Connect called with:", {
      hasToken: !!token,
      matchesCount: matches?.length,
      chatIdsCount: Object.keys(chatIds || {}).length,
    });

    // Reset global flag if we're disconnected
    if (this.stompClient && !this.stompClient.connected) {
      console.log(
        "[WebSocket] Resetting connection flag due to disconnected state"
      );
      globalConnectionAttempted = false;
    }

    if (globalConnectionAttempted || this.isConnecting) {
      console.log(
        "[WebSocket] Connection already attempted or in progress, checking connection state..."
      );
      // If we have a client but it's not connected, force a reconnect
      if (this.stompClient && !this.stompClient.connected) {
        console.log(
          "[WebSocket] Client exists but not connected, forcing reconnect"
        );
        this.disconnect();
        globalConnectionAttempted = false;
      } else {
        return;
      }
    }

    if (!token) {
      console.log("[WebSocket] No token found - cannot connect to chat");
      return;
    }

    console.log("[WebSocket] Starting connection with JWT authentication...");
    globalConnectionAttempted = true;
    this.isConnecting = true;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log("[WebSocket] Connected:", frame);
      this.isConnecting = false;

      console.log(
        "[WebSocket] Executing connect callbacks:",
        this.onConnectCallbacks.length
      );
      this.onConnectCallbacks.forEach((callback) => callback());

      // Subscribe to match notifications
      const userEmail = this.getEmailFromToken(token);
      if (userEmail) {
        console.log(
          "[WebSocket] Subscribing to match notifications for user:",
          userEmail
        );
        this.subscribeToMatches(userEmail);
      } else {
        console.error("[WebSocket] Could not extract email from token");
      }

      // Subscribe to chats
      if (matches && matches.length > 0) {
        console.log("[WebSocket] Setting up chat subscriptions for matches");
        matches.forEach((match) => {
          const otherUserId = match.likedId;
          const chatId = chatIds[otherUserId];

          if (chatId) {
            console.log(
              `[WebSocket] Subscribing to chat for match ${otherUserId} with chatId ${chatId}`
            );
            this.subscribeToChat(chatId, match);
          } else {
            console.log(
              `[WebSocket] No chat ID for user ${otherUserId}, skipping subscription`
            );
          }
        });
      }

      // Subscribe to presence updates
      this.subscribeToPresence();

      // Send initial presence and setup periodic updates
      this.sendPresence();
      this.startPresenceUpdates();
    };

    client.onStompError = (frame) => {
      console.error("[WebSocket] STOMP error:", frame);
      this.isConnecting = false;
      this.onDisconnectCallbacks.forEach((callback) => callback());
      globalConnectionAttempted = false;
    };

    client.onDisconnect = () => {
      console.log("[WebSocket] Disconnected");
      this.isConnecting = false;
      this.stopPresenceUpdates();
      this.onDisconnectCallbacks.forEach((callback) => callback());
      globalConnectionAttempted = false;
    };

    console.log("[WebSocket] Activating client");
    client.activate();
    this.stompClient = client;
  }

  subscribeToChat(chatId, match, onMessageReceived) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.log("[WebSocket] Cannot subscribe - client not connected");
      return;
    }

    // If already subscribed to this chat, update the callback
    if (this.subscriptions.has(chatId)) {
      console.log(
        `[WebSocket] Already subscribed to chat ${chatId}, updating callback`
      );
      const subscription = this.subscriptions.get(chatId);
      subscription.messageCallback = onMessageReceived || null;
      return;
    }

    const topicName = `/topic/chat/${chatId}`;
    console.log("[WebSocket] Subscribing to private chat:", topicName);

    const subscription = this.stompClient.subscribe(topicName, (message) => {
      console.log("[WebSocket] Raw chat message received:", message);
      try {
        const receivedMessage = JSON.parse(message.body);
        console.log("[WebSocket] Parsed chat message:", receivedMessage);

        // Create message ID
        const messageId = `${chatId}-${receivedMessage.sentAt}`;
        const chatMessages = this.seenMessages.get(chatId) || new Set();

        // Handle regular message display in chat if callback exists
        const storedCallback = subscription.messageCallback;
        if (storedCallback) {
          // If we have a callback, this is the active chat, so mark message as seen
          if (!this.seenMessages.has(chatId)) {
            this.seenMessages.set(chatId, new Set());
          }
          this.seenMessages.get(chatId).add(messageId);

          storedCallback({
            ...receivedMessage,
            chatPartner: match.likedDisplayName || match.likedEmail,
            timestamp: new Date(receivedMessage.sentAt).toLocaleString(
              "et-EE",
              {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }
            ),
          });
        }

        // Send notification if message hasn't been seen and this isn't the active chat
        if (!chatMessages.has(messageId) && !storedCallback) {
          console.log(
            "[WebSocket] Executing message callbacks:",
            this.onMessageCallbacks.length
          );
          this.onMessageCallbacks.forEach((callback) => {
            try {
              callback({
                ...receivedMessage,
                chatId: chatId,
                senderDisplayName: match.likedDisplayName || "User",
                senderId: match.likedId,
              });
              console.log("[WebSocket] Message callback executed successfully");
            } catch (callbackError) {
              console.error(
                "[WebSocket] Error in message callback:",
                callbackError
              );
            }
          });
        } else {
          console.log(
            "[WebSocket] Message already seen or in active chat, skipping notification:",
            messageId
          );
        }
      } catch (error) {
        console.error("[WebSocket] Error processing chat message:", error);
        console.log("[WebSocket] Raw message body:", message.body);
      }
    });

    // Store the message callback with the subscription
    subscription.messageCallback = onMessageReceived || null;
    this.subscriptions.set(chatId, subscription);
  }

  subscribeToMatches(userEmail) {
    console.log("[WebSocket] subscribeToMatches called for user:", userEmail);

    if (!this.stompClient || !this.stompClient.connected) {
      console.log(
        "[WebSocket] Cannot subscribe to matches - client not connected"
      );
      return;
    }

    const topicName = `/topic/matches/${userEmail}`;
    console.log(
      "[WebSocket] Subscribing to match notifications topic:",
      topicName
    );

    try {
      const subscription = this.stompClient.subscribe(topicName, (message) => {
        console.log("[WebSocket] Raw match message received:", message);
        try {
          const matchNotification = JSON.parse(message.body);
          console.log(
            "[WebSocket] Parsed match notification:",
            matchNotification
          );
          console.log(
            "[WebSocket] Executing match callbacks:",
            this.onMatchCallbacks.length
          );
          this.onMatchCallbacks.forEach((callback) => {
            try {
              callback(matchNotification);
              console.log("[WebSocket] Match callback executed successfully");
            } catch (callbackError) {
              console.error(
                "[WebSocket] Error in match callback:",
                callbackError
              );
            }
          });
        } catch (parseError) {
          console.error(
            "[WebSocket] Error parsing match notification:",
            parseError
          );
          console.log("[WebSocket] Raw message body:", message.body);
        }
      });

      this.subscriptions.set("matches", subscription);
      console.log("[WebSocket] Match subscription successful");
    } catch (error) {
      console.error("[WebSocket] Error setting up match subscription:", error);
    }
  }

  subscribeToPresence() {
    if (!this.stompClient || !this.stompClient.connected) {
      console.log(
        "[WebSocket] Cannot subscribe to presence - client not connected"
      );
      return;
    }

    const subscription = this.stompClient.subscribe(
      "/topic/presence",
      (message) => {
        try {
          const presenceData = JSON.parse(message.body);
          // Only log presence updates for status changes
          if (
            this.onlineUsers.get(presenceData.user)?.online !==
            presenceData.online
          ) {
            console.log(
              "[WebSocket] User status changed:",
              presenceData.user,
              presenceData.online ? "online" : "offline"
            );
          }

          this.onlineUsers.set(presenceData.user, {
            online: presenceData.online,
            lastSeen: presenceData.timestamp,
          });

          // Notify all callbacks about the updated online users map
          this.onPresenceCallbacks.forEach((callback) => {
            try {
              callback(this.onlineUsers);
            } catch (error) {
              console.error("[WebSocket] Error in presence callback:", error);
            }
          });
        } catch (error) {
          console.error("[WebSocket] Error handling presence update:", error);
        }
      }
    );

    return subscription;
  }

  sendPresence() {
    if (!this.stompClient?.connected) return;

    this.stompClient.publish({
      destination: "/app/presence",
    });
  }

  requestPresence() {
    if (!this.stompClient?.connected) return;

    this.stompClient.publish({
      destination: "/app/presence/request",
    });
  }

  getEmailFromToken(token) {
    try {
      console.log("[WebSocket] Extracting email from token");
      const payload = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payload));
      // The email is stored in the 'sub' (subject) claim of the JWT
      const email = decodedPayload.sub;
      console.log("[WebSocket] Extracted email:", email);

      if (!email) {
        console.error(
          "[WebSocket] No email found in token. Token payload:",
          decodedPayload
        );
        return null;
      }

      return email;
    } catch (error) {
      console.error("[WebSocket] Error extracting email from token:", error);
      console.log("[WebSocket] Token:", token);
      return null;
    }
  }

  sendPrivateMessage(matchId, message) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.log("Cannot send message - client not connected");
      return;
    }

    this.stompClient.publish({
      destination: `/app/chat.private/${matchId}`,
      body: JSON.stringify(message),
    });
  }

  markMessageAsSeen(chatId, timestamp) {
    console.log("[WebSocket] Marking message as seen:", chatId, timestamp);
    const messageId = `${chatId}-${timestamp}`;
    if (!this.seenMessages.has(chatId)) {
      this.seenMessages.set(chatId, new Set());
    }
    this.seenMessages.get(chatId).add(messageId);
  }

  // Add method to fetch current user ID
  async getCurrentUserId() {
    if (this.currentUserId) {
      return this.currentUserId;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        this.currentUserId = userData.id;
        return userData.id;
      } else {
        console.error("[WebSocket] Failed to fetch current user ID");
        return null;
      }
    } catch (error) {
      console.error("[WebSocket] Error fetching current user ID:", error);
      return null;
    }
  }

  async sendTypingStatus(chatId, isTyping) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.log(
        "[WebSocket] Cannot send typing status - client not connected"
      );
      return;
    }

    console.log(
      `[WebSocket] Sending typing status for chat ${chatId}: ${isTyping}`
    );
    try {
      const userId = await this.getCurrentUserId();

      if (!userId) {
        console.error("[WebSocket] Could not get current user ID");
        return;
      }

      const payload = { chatId, isTyping, userId };
      console.log("[WebSocket] Typing status payload:", payload);

      const destination = `/app/chat/${chatId}/typing`;
      console.log(`[WebSocket] Sending to destination: ${destination}`);

      this.stompClient.publish({
        destination: destination,
        body: JSON.stringify(payload),
      });

      console.log("[WebSocket] Typing status sent successfully");
    } catch (error) {
      console.error("[WebSocket] Error sending typing status:", error);
      console.error("[WebSocket] Error details:", {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  subscribeToTypingStatus(chatId, callback) {
    if (!this.stompClient || !this.stompClient.connected) {
      console.log(
        "[WebSocket] Cannot subscribe to typing status - client not connected"
      );
      return;
    }

    const destination = `/topic/chat/${chatId}/typing`;
    console.log(`[WebSocket] Subscribing to typing status at: ${destination}`);

    // Unsubscribe from previous subscription if it exists
    if (this.typingSubscriptions.has(chatId)) {
      console.log(
        `[WebSocket] Unsubscribing from previous typing status for chat ${chatId}`
      );
      this.typingSubscriptions.get(chatId).unsubscribe();
      this.typingSubscriptions.delete(chatId);
    }

    try {
      const subscription = this.stompClient.subscribe(
        destination,
        (message) => {
          console.log(`[WebSocket] Raw typing status received:`, message);
          try {
            const status = JSON.parse(message.body);
            console.log(`[WebSocket] Parsed typing status:`, status);
            callback(status);
          } catch (error) {
            console.error("[WebSocket] Error parsing typing status:", error);
          }
        }
      );

      this.typingSubscriptions.set(chatId, subscription);
      console.log(
        `[WebSocket] Successfully subscribed to typing status for chat ${chatId}`
      );
    } catch (error) {
      console.error(
        `[WebSocket] Error subscribing to typing status for chat ${chatId}:`,
        error
      );
    }
  }

  unsubscribeFromTypingStatus(chatId) {
    console.log(
      `[WebSocket] Unsubscribing from typing status for chat ${chatId}`
    );
    if (this.typingSubscriptions.has(chatId)) {
      try {
        this.typingSubscriptions.get(chatId).unsubscribe();
        this.typingSubscriptions.delete(chatId);
        console.log(
          `[WebSocket] Successfully unsubscribed from typing status for chat ${chatId}`
        );
      } catch (error) {
        console.error(
          `[WebSocket] Error unsubscribing from typing status for chat ${chatId}:`,
          error
        );
      }
    }
  }

  startPresenceUpdates() {
    if (this.stompClient?.connected) {
      this.sendPresence();
      // Request immediate update of all users' presence
      this.requestPresence();
    }

    this.presenceInterval = setInterval(() => {
      if (this.stompClient?.connected) {
        this.sendPresence();
        this.checkStaleUsers();
      }
    }, 5000);
  }

  checkStaleUsers() {
    const now = Date.now();
    this.onlineUsers.forEach((userData, userEmail) => {
      const lastHeartbeat = userData.lastSeen;
      const isStale = now - lastHeartbeat > 45000; // 45 seconds

      if (userData.online && isStale) {
        this.onlineUsers.set(userEmail, {
          ...userData,
          online: false,
        });

        // Notify callbacks of status change
        this.onPresenceCallbacks.forEach((callback) => {
          callback(this.onlineUsers);
        });
      }
    });
  }

  stopPresenceUpdates() {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
  }

  disconnect() {
    console.log("[WebSocket] Disconnecting...");
    this.isConnecting = false;
    this.stopPresenceUpdates();
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.deactivate();
    }
    this.subscriptions.clear();
    this.seenMessages.clear(); // Clear seen messages on disconnect
    this.typingSubscriptions.clear(); // Clear typing subscriptions
    this.onlineUsers.clear(); // Clear online users on disconnect
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onMatchCallbacks = [];
    this.onMessageCallbacks = [];
    this.onPresenceCallbacks = []; // Clear presence callbacks on disconnect
    globalConnectionAttempted = false;
    console.log("[WebSocket] Cleanup complete");
  }

  isConnected() {
    return this.stompClient && this.stompClient.connected;
  }

  unsubscribeFromChat(chatId) {
    console.log("[WebSocket] Starting unsubscribe process for chat:", chatId);

    // Unsubscribe from chat messages
    if (this.subscriptions.has(chatId)) {
      try {
        const subscription = this.subscriptions.get(chatId);
        // Only remove the callback, keep the subscription active
        subscription.messageCallback = null;
        console.log("[WebSocket] Removed message callback for chat:", chatId);
      } catch (error) {
        console.error(
          "[WebSocket] Error removing message callback from chat:",
          error
        );
      }
    } else {
      console.log(
        "[WebSocket] No message subscription found for chat:",
        chatId
      );
    }

    // Unsubscribe from typing status
    if (this.typingSubscriptions.has(chatId)) {
      console.log(
        `[WebSocket] Found typing subscription for chat ${chatId}, cleaning up...`
      );
      try {
        this.typingSubscriptions.get(chatId).unsubscribe();
        this.typingSubscriptions.delete(chatId);
        console.log(
          "[WebSocket] Successfully unsubscribed from typing status for chat:",
          chatId
        );
      } catch (error) {
        console.error(
          "[WebSocket] Error unsubscribing from typing status:",
          error
        );
      }
    } else {
      console.log("[WebSocket] No typing subscription found for chat:", chatId);
    }
  }

  isUserOnline(userId) {
    const userData = this.onlineUsers.get(userId);
    if (!userData) return false;

    // Consider user offline if no heartbeat in last 5 seconds
    const now = Date.now();
    const lastHeartbeat = userData.lastSeen;
    const isStale = now - lastHeartbeat > 5000; // 5 seconds

    return userData.online && !isStale;
  }

  getLastSeen(userId) {
    const userData = this.onlineUsers.get(userId);
    if (!userData) return null;
    return userData.lastSeen;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

// Export the singleton instance as the default export
export { webSocketService as default };
