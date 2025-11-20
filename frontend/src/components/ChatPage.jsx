import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import webSocketService from "../services/WebSocketService";
import styles from "./ChatPage.module.css";

const PAGE_SIZE = 20;

// Helper function for consistent timestamp formatting
const formatTimestamp = (date) => {
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleString("et-EE", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error, "date:", date);
    return new Date().toLocaleString("et-EE", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
};

// Helper function to generate a color from a string
const getColorFromName = (name) => {
  const colors = [
    "#FF6B6B", // red
    "#4ECDC4", // teal
    "#45B7D1", // blue
    "#96CEB4", // green
    "#FFEEAD", // yellow
    "#D4A5A5", // pink
    "#9B59B6", // purple
    "#3498DB", // bright blue
    "#E67E22", // orange
    "#1ABC9C", // turquoise
  ];

  // Generate a number from the string
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color
  return colors[Math.abs(hash) % colors.length];
};

// Helper function to get user's initial
const getInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : "?";
};

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [privateMessages, setPrivateMessages] = useState([]);
  const [privateInputMessage, setPrivateInputMessage] = useState("");
  const [sender, setSender] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [matches, setMatches] = useState([]);
  const [chatIds, setChatIds] = useState({});
  const [connected, setConnected] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [matchAvatars, setMatchAvatars] = useState({});
  const [lastMessageTimes, setLastMessageTimes] = useState({});
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // Track who is typing in which chat
  const [isOnline, setIsOnline] = useState(false); // Add state for online status
  const [lastSeen, setLastSeen] = useState(null); // Add state for last seen timestamp
  const typingTimeoutRef = useRef(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Helper function to update last message time for a match
  const updateLastMessageTime = (matchId, timestamp) => {
    setLastMessageTimes((prev) => ({
      ...prev,
      [matchId]: timestamp,
    }));
  };

  // Modified getSortedMatches to only use message times for sorting non-selected matches
  const getSortedMatches = () => {
    return [...matches].sort((a, b) => {
      // Always put selected match first
      if (a.likedId.toString() === selectedMatchId) return -1;
      if (b.likedId.toString() === selectedMatchId) return 1;

      // For other matches, sort only by last message time
      const timeA = lastMessageTimes[a.likedId] || 0;
      const timeB = lastMessageTimes[b.likedId] || 0;
      return timeB - timeA;
    });
  };

  // Load profile picture for a match
  const loadMatchAvatar = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/files/profile-picture/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(
          `Failed to load avatar for user ${userId}:`,
          response.status
        );
        return;
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        console.error(`Received empty blob for user ${userId}`);
        return;
      }

      // Create new URL and update state atomically
      const imageUrl = URL.createObjectURL(blob);
      setMatchAvatars((prev) => {
        // Cleanup old URL if it exists
        const oldUrl = prev[userId];
        if (oldUrl?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(oldUrl);
          } catch (e) {
            console.error("Error revoking old URL:", e);
          }
        }
        return {
          ...prev,
          [userId]: imageUrl,
        };
      });
    } catch (error) {
      console.error(`Error loading avatar for user ${userId}:`, error);
    }
  };

  // Load current user's profile picture
  const loadCurrentUserAvatar = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/files/profile-picture/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to load profile picture:", response.status);
        return;
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        console.error("Received empty blob for profile picture");
        return;
      }

      // Create new URL and update state atomically
      const imageUrl = URL.createObjectURL(blob);
      setCurrentUserAvatar((prev) => {
        // Cleanup old URL if it exists
        if (prev?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(prev);
          } catch (e) {
            console.error("Error revoking old URL:", e);
          }
        }
        return imageUrl;
      });
    } catch (error) {
      console.error("Error loading current user avatar:", error);
    }
  };

  // Cleanup avatars on unmount
  useEffect(() => {
    return () => {
      // Only cleanup on component unmount
      try {
        Object.values(matchAvatars).forEach((url) => {
          if (url?.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
        });
        if (currentUserAvatar?.startsWith("blob:")) {
          URL.revokeObjectURL(currentUserAvatar);
        }
      } catch (e) {
        console.error("Error during cleanup:", e);
      }
    };
  }, []); // Empty dependency array since we only want to cleanup on unmount

  // Fetch current user's information and matches
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setSender("Guest");
          setUserLoading(false);
          return;
        }

        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const username =
            userData.profile?.displayName || userData.email || "User";
          setSender(username);
          setCurrentUserId(userData.id);

          // Load current user's avatar
          if (userData.id) {
            loadCurrentUserAvatar(userData.id);
          }

          // Fetch user's matches
          const matchesResponse = await fetch("/api/likes/enriched-matches", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (matchesResponse.ok) {
            const matchesData = await matchesResponse.json();
            setMatches(matchesData);

            // Load avatars for all matches
            matchesData.forEach((match) => {
              loadMatchAvatar(match.likedId);
            });

            // Get chat IDs for each match
            const chatIdMap = {};
            for (const match of matchesData) {
              try {
                const chatIdResponse = await fetch(
                  `/api/chat/chat-id/${match.likedId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                if (chatIdResponse.ok) {
                  const chatIdData = await chatIdResponse.json();
                  chatIdMap[match.likedId] = chatIdData.chatId;

                  // If we have a chatId from URL, select the corresponding match
                  if (chatId && chatIdData.chatId.toString() === chatId) {
                    setSelectedMatchId(match.likedId.toString());
                  }
                }
              } catch (error) {
                console.error(
                  `Error fetching chat ID for user ${match.likedId}:`,
                  error
                );
              }
            }
            setChatIds(chatIdMap);
          }
        } else {
          setSender("User");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setSender("User");
      } finally {
        setUserLoading(false);
      }
    };

    fetchCurrentUser();
  }, [chatId]);

  // Setup WebSocket connection and handlers
  useEffect(() => {
    if (matches.length > 0 && Object.keys(chatIds).length > 0) {
      console.log("Chat IDs loaded, checking connection state...");
      const token = localStorage.getItem("token");

      // Clear existing callbacks to prevent duplicates
      webSocketService.onConnectCallbacks = [];
      webSocketService.onDisconnectCallbacks = [];

      webSocketService.addOnConnectCallback(() => {
        setConnected(true);
        // Resubscribe to current chat if needed
        if (selectedMatchId) {
          // Unsubscribe from all chats first
          Object.values(chatIds).forEach((chatId) => {
            webSocketService.unsubscribeFromChat(chatId);
          });

          // Subscribe to all chats but only show messages for selected chat
          matches.forEach((match) => {
            const matchChatId = chatIds[match.likedId];
            if (match && matchChatId) {
              webSocketService.subscribeToChat(
                matchChatId,
                match,
                (message) => {
                  // Only add message to chat if it's from the selected match
                  if (match.likedId.toString() === selectedMatchId) {
                    console.log(
                      "Received WebSocket message for current chat:",
                      message
                    );
                    const formattedMessage = {
                      ...message,
                      timestamp: formatTimestamp(message.sentAt),
                      sentAt: new Date(message.sentAt),
                    };
                    // Mark message as seen immediately when received in active chat
                    webSocketService.markMessageAsSeen(
                      matchChatId,
                      message.sentAt
                    );
                    setPrivateMessages((prev) => [...prev, formattedMessage]);
                    // Update last message time for the match
                    updateLastMessageTime(
                      parseInt(selectedMatchId),
                      formattedMessage.sentAt.getTime()
                    );
                    setShouldScrollToBottom(true);
                  }
                }
              );
            }
          });
        }
      });

      webSocketService.addOnDisconnectCallback(() => setConnected(false));

      // Only connect if not already connected
      if (!webSocketService.isConnected()) {
        setTimeout(() => {
          webSocketService.connect(token, matches, chatIds);
        }, 500);
      } else {
        setConnected(true);
      }
    }
  }, [chatIds, matches, selectedMatchId]);

  // Load chat history when match is selected or chatId is provided
  useEffect(() => {
    if (selectedMatchId) {
      loadChatHistory(selectedMatchId);

      // Only setup subscription if we're connected
      if (connected) {
        const match = matches.find(
          (m) => m.likedId.toString() === selectedMatchId
        );
        const matchChatId = chatIds[selectedMatchId];

        if (match && matchChatId) {
          webSocketService.subscribeToChat(matchChatId, match, (message) => {
            // Mark message as seen immediately when received in active chat
            webSocketService.markMessageAsSeen(matchChatId, message.sentAt);
            setPrivateMessages((prev) => [...prev, message]);
            setShouldScrollToBottom(true);
          });
        }
      }
    }
  }, [selectedMatchId, matches, chatIds, connected]);

  // Modified loadChatHistory to mark messages as seen
  const loadChatHistory = async (otherUserId, page = 0, append = false) => {
    try {
      const token = localStorage.getItem("token");
      const container = messagesContainerRef.current;
      let prevScrollHeight = 0;
      if (append && container) {
        prevScrollHeight = container.scrollHeight;
      }

      // Get total pages and most recent messages
      const response = await fetch(
        `/api/chat/history/${otherUserId}?page=${page}&size=${PAGE_SIZE}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const chatHistory = await response.json();
        setTotalPages(chatHistory.totalPages);
        setCurrentPage(chatHistory.currentPage);

        // Transform and sort messages by timestamp
        const displayMessages = (chatHistory.content || [])
          .map((msg) => ({
            sender: msg.senderDisplayName,
            content: msg.messageContent,
            timestamp: formatTimestamp(msg.sentAt),
            sentAt: new Date(msg.sentAt), // Keep the full date for sorting
            chatPartner:
              matches.find((m) => m.likedId.toString() === otherUserId)
                ?.likedDisplayName || "Unknown",
          }))
          .sort((a, b) => a.sentAt - b.sentAt); // Sort chronologically

        // Mark all loaded messages as seen
        const matchChatId = chatIds[otherUserId];
        if (matchChatId) {
          displayMessages.forEach((msg) => {
            webSocketService.markMessageAsSeen(matchChatId, msg.sentAt);
          });
        }

        // Update last message time if we have messages
        if (displayMessages.length > 0) {
          const lastMessage = displayMessages[displayMessages.length - 1];
          updateLastMessageTime(
            parseInt(otherUserId),
            lastMessage.sentAt.getTime()
          );
        }

        if (append) {
          // When loading older messages, add them before current messages
          setPrivateMessages((prev) => [...displayMessages, ...prev]);
          if (container) {
            // Maintain scroll position after prepending
            requestAnimationFrame(() => {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            });
          }
        } else {
          // For initial load or refresh, replace all messages
          setPrivateMessages(displayMessages);
          setShouldScrollToBottom(true);
        }
      } else {
        if (!append) {
          setPrivateMessages([]);
        }
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      if (!append) {
        setPrivateMessages([]);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll: load more messages when scrolling to top
  const handleScroll = () => {
    if (!messagesContainerRef.current || isLoadingMore) return;

    const container = messagesContainerRef.current;
    if (container.scrollTop === 0 && currentPage < totalPages - 1) {
      setIsLoadingMore(true);
      // Load previous page (older messages)
      loadChatHistory(selectedMatchId, currentPage + 1, true);
    }
  };

  // Attach scroll handler to messages container
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [currentPage, totalPages, isLoadingMore, selectedMatchId]);

  // Scroll to bottom when a new message is received or sent
  useEffect(() => {
    if (shouldScrollToBottom && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
      setShouldScrollToBottom(false);
    }
  }, [privateMessages, shouldScrollToBottom]);

  // When a match is selected
  const handleMatchSelection = (matchId) => {
    // Unsubscribe from current chat if any
    if (selectedMatchId && chatIds[selectedMatchId]) {
      webSocketService.unsubscribeFromChat(chatIds[selectedMatchId]);
    }

    setSelectedMatchId(matchId);
    setCurrentPage(0);
    setTotalPages(0);
    setPrivateMessages([]); // Clear messages while loading

    if (matchId) {
      const matchChatId = chatIds[matchId];
      if (matchChatId) {
        navigate(`/chat/${matchChatId}`);
      }
      // Start with page 0 to get most recent messages
      loadChatHistory(matchId, 0, false);

      // Subscribe to the new chat if we're connected
      if (connected) {
        const match = matches.find((m) => m.likedId.toString() === matchId);
        if (match && matchChatId) {
          webSocketService.subscribeToChat(matchChatId, match, (message) => {
            const formattedMessage = {
              ...message,
              timestamp: formatTimestamp(message.sentAt),
              sentAt: new Date(message.sentAt),
            };
            // Mark message as seen immediately when received in active chat
            webSocketService.markMessageAsSeen(matchChatId, message.sentAt);
            setPrivateMessages((prev) => [...prev, formattedMessage]);
            updateLastMessageTime(
              parseInt(matchId),
              formattedMessage.sentAt.getTime()
            );
            setShouldScrollToBottom(true);
          });
        }
      }
    } else {
      navigate("/chat");
    }
  };

  const getSelectedMatchName = () => {
    if (!selectedMatchId) return "";
    const match = matches.find((m) => m.likedId.toString() === selectedMatchId);
    return match?.likedDisplayName || match?.likedEmail || "Unknown";
  };

  // Modified sendPrivateMessage to update last message time immediately
  const sendPrivateMessage = () => {
    if (
      privateInputMessage.trim() &&
      selectedMatchId &&
      webSocketService.isConnected()
    ) {
      const now = new Date();
      const message = {
        sender: sender,
        content: privateInputMessage,
        timestamp: formatTimestamp(now),
        sentAt: now,
      };

      console.log("Sending message:", message);
      webSocketService.sendPrivateMessage(selectedMatchId, message);

      // Update last message time immediately when sending
      updateLastMessageTime(parseInt(selectedMatchId), now.getTime());

      setPrivateInputMessage("");
    }
  };

  const handlePrivateKeyPress = (e) => {
    if (e.key === "Enter") {
      sendPrivateMessage();
    }
  };

  // Add typing indicator handlers
  const handleTypingStart = async () => {
    if (!isTyping && selectedMatchId && chatIds[selectedMatchId]) {
      console.log(
        "[Typing] Starting typing for chat:",
        chatIds[selectedMatchId]
      );
      setIsTyping(true);
      await webSocketService.sendTypingStatus(chatIds[selectedMatchId], true);
    }
  };

  const handleTypingStop = async () => {
    if (isTyping && selectedMatchId && chatIds[selectedMatchId]) {
      console.log(
        "[Typing] Stopping typing for chat:",
        chatIds[selectedMatchId]
      );
      setIsTyping(false);
      await webSocketService.sendTypingStatus(chatIds[selectedMatchId], false);
    }
  };

  // Setup typing indicator timeout
  useEffect(() => {
    console.log("[Typing] Input changed:", privateInputMessage);
    console.log("[Typing] Current chat ID:", chatIds[selectedMatchId]);

    if (privateInputMessage.trim() !== "") {
      handleTypingStart();
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 2000); // Stop typing indicator after 2 seconds of no input
    } else {
      handleTypingStop();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [privateInputMessage, selectedMatchId]);

  // Add typing status subscription
  useEffect(() => {
    console.log("[Typing] Setting up typing subscription:", {
      connected,
      selectedMatchId,
      chatId: chatIds[selectedMatchId],
      currentUserId,
    });

    if (connected && selectedMatchId && chatIds[selectedMatchId]) {
      const chatId = chatIds[selectedMatchId];

      // Subscribe to typing status
      webSocketService.subscribeToTypingStatus(chatId, (status) => {
        console.log(
          "[Typing] Received typing status:",
          status,
          "Current user:",
          currentUserId
        );

        // Make sure we have both user IDs and they're different
        if (status.userId && currentUserId && status.userId !== currentUserId) {
          setTypingUsers((prev) => {
            const newState = {
              ...prev,
              [status.chatId]: status.isTyping,
            };
            console.log(
              "[Typing] Updated typing users state:",
              newState,
              "from other user:",
              status.userId
            );
            return newState;
          });
        } else {
          console.log(
            "[Typing] Ignoring typing status - either from self or missing user ID",
            {
              statusUserId: status.userId,
              currentUserId: currentUserId,
            }
          );
        }
      });

      // Cleanup function to unsubscribe
      return () => {
        console.log(
          "[Typing] Cleaning up typing subscription for chat:",
          chatId
        );
        webSocketService.unsubscribeFromTypingStatus(chatId);
      };
    }
  }, [connected, selectedMatchId, chatIds, currentUserId]);

  // Add a debug effect to monitor typing users state
  useEffect(() => {
    console.log("[Typing] Current typing users state:", typingUsers);
    if (selectedMatchId) {
      console.log(
        "[Typing] Is someone typing in current chat?",
        typingUsers[chatIds[selectedMatchId]] ? "Yes" : "No"
      );
    }
  }, [typingUsers, selectedMatchId, chatIds]);

  // Subscribe to presence updates
  useEffect(() => {
    if (selectedMatchId && matches) {
      const match = matches.find(
        (m) => m.likedId.toString() === selectedMatchId
      );
      if (match) {
        const partnerId = match.likedId.toString();

        // Get initial presence status
        const initialStatus = webSocketService.isUserOnline(partnerId);
        const initialLastSeen = webSocketService.getLastSeen(partnerId);
        setIsOnline(initialStatus);
        setLastSeen(initialLastSeen);

        // Request current presence info
        webSocketService.requestPresence();

        // Subscribe to updates
        const callback = (onlineUsers) => {
          const userData = onlineUsers.get(partnerId);
          if (userData) {
            setIsOnline(userData.online);
            setLastSeen(userData.lastSeen);
          }
        };

        webSocketService.addOnPresenceCallback(callback);

        // Cleanup subscription on unmount or when match changes
        return () => {
          const index = webSocketService.onPresenceCallbacks.indexOf(callback);
          if (index > -1) {
            webSocketService.onPresenceCallbacks.splice(index, 1);
          }
        };
      }
    }
  }, [selectedMatchId, matches]);

  if (userLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.chatBox}>
          <div className={styles.loadingState}>
            Loading your conversations...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.chatBox}>
        <div className={styles.header}>
          <div className={styles.topInfo}>
            <div className={styles.userInfo}>
              <div className={styles.leftInfo}>
                {matches.length > 0 && (
                  <div className={styles.matchCount}>
                    {matches.length} match{matches.length !== 1 ? "es" : ""}{" "}
                    available
                  </div>
                )}
              </div>
              <div
                className={`${styles.connectionStatus} ${
                  connected ? styles.connected : styles.disconnected
                }`}
              >
                {connected ? "✓ Connected" : "⚠ Disconnected"}
              </div>
            </div>
          </div>

          <div className={styles.matchesList}>
            {getSortedMatches().map((match) => (
              <div
                key={match.likedId}
                className={`${styles.matchCard} ${
                  selectedMatchId === match.likedId.toString()
                    ? styles.selected
                    : ""
                }`}
                onClick={() => handleMatchSelection(match.likedId.toString())}
              >
                <div
                  className={styles.avatarContainer}
                  style={
                    !matchAvatars[match.likedId]
                      ? {
                          backgroundColor: getColorFromName(
                            match.likedDisplayName || match.likedEmail
                          ),
                        }
                      : undefined
                  }
                >
                  {matchAvatars[match.likedId] ? (
                    <img
                      src={matchAvatars[match.likedId]}
                      alt={match.likedDisplayName}
                      className={styles.avatarImage}
                    />
                  ) : (
                    getInitial(match.likedDisplayName || match.likedEmail)
                  )}
                </div>
                <div className={styles.matchName}>
                  {match.likedDisplayName || match.likedEmail}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chatContent}>
          {!selectedMatchId ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateIcon}>💬</div>
              <div className={styles.emptyStateText}>
                Select a match to start chatting!
              </div>
              <div className={styles.emptyStateSubtext}>
                Choose someone from your matches above to begin a conversation
              </div>
            </div>
          ) : (
            <>
              {/* Active Profile Header */}
              <div className={styles.activeProfileHeader}>
                <div
                  className={styles.activeProfileAvatar}
                  style={
                    !matchAvatars[selectedMatchId]
                      ? {
                          backgroundColor: getColorFromName(
                            matches.find(
                              (m) => m.likedId.toString() === selectedMatchId
                            )?.likedDisplayName ||
                              matches.find(
                                (m) => m.likedId.toString() === selectedMatchId
                              )?.likedEmail
                          ),
                        }
                      : undefined
                  }
                >
                  {matchAvatars[selectedMatchId] ? (
                    <img
                      src={matchAvatars[selectedMatchId]}
                      alt="Active chat partner"
                      className={styles.avatarImage}
                    />
                  ) : (
                    getInitial(
                      matches.find(
                        (m) => m.likedId.toString() === selectedMatchId
                      )?.likedDisplayName ||
                        matches.find(
                          (m) => m.likedId.toString() === selectedMatchId
                        )?.likedEmail
                    )
                  )}
                </div>
                <div className={styles.activeProfileInfo}>
                  <div className={styles.activeProfileName}>
                    {matches.find(
                      (m) => m.likedId.toString() === selectedMatchId
                    )?.likedDisplayName ||
                      matches.find(
                        (m) => m.likedId.toString() === selectedMatchId
                      )?.likedEmail}
                  </div>
                  <div className={styles.onlineStatus}>
                    <span
                      className={`${styles.statusDot} ${
                        isOnline ? styles.online : styles.offline
                      }`}
                    />
                    <span className={styles.statusText}>
                      {isOnline
                        ? "Online"
                        : lastSeen
                        ? `Last seen ${new Date(lastSeen).toLocaleString(
                            "et-EE",
                            {
                              year: "2-digit",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            }
                          )}`
                        : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                ref={messagesContainerRef}
                className={styles.messagesContainer}
              >
                {privateMessages.length === 0 ? (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>✨</div>
                    <div className={styles.emptyStateText}>
                      Start a conversation with{" "}
                      {matches.find(
                        (m) => m.likedId.toString() === selectedMatchId
                      )?.likedDisplayName || "your match"}
                    </div>
                    <div className={styles.emptyStateSubtext}>
                      Say hello and break the ice!
                    </div>
                  </div>
                ) : (
                  <>
                    {privateMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`${styles.message} ${
                          msg.isCurrentUser || msg.sender === sender
                            ? styles.myMessage
                            : styles.otherMessage
                        }`}
                      >
                        <div
                          className={`${styles.messageContent} ${
                            msg.isCurrentUser || msg.sender === sender
                              ? styles.myMessageContent
                              : styles.otherMessageContent
                          }`}
                        >
                          {msg.content}
                        </div>
                        <div className={styles.messageInfo}>
                          <span className={styles.senderName}>
                            {msg.sender}
                          </span>
                          <span className={styles.timestamp}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                    {/* Typing indicator with debug info */}
                    {typingUsers[chatIds[selectedMatchId]] && (
                      <div
                        className={`${styles.message} ${styles.otherMessage}`}
                      >
                        <div
                          className={`${styles.messageContent} ${styles.typingIndicator}`}
                        >
                          <span className={styles.typingDot}></span>
                          <span className={styles.typingDot}></span>
                          <span className={styles.typingDot}></span>
                        </div>
                        {/* Debug info */}
                        <div style={{ display: "none" }}>
                          {console.log(
                            "[Typing] Rendering typing indicator for chat:",
                            chatIds[selectedMatchId]
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.inputContainer}>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    value={privateInputMessage}
                    onChange={(e) => setPrivateInputMessage(e.target.value)}
                    onKeyPress={handlePrivateKeyPress}
                    placeholder={`Message ${getSelectedMatchName()}...`}
                    className={styles.messageInput}
                    disabled={!connected || !selectedMatchId}
                  />
                  <button
                    onClick={sendPrivateMessage}
                    disabled={
                      !connected ||
                      !privateInputMessage.trim() ||
                      !selectedMatchId
                    }
                    className={styles.sendButton}
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
