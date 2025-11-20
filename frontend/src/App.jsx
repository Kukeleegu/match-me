import React, { useState, useEffect, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import FileUploadTest from "./components/FileUploadTest";
import GetPreferencesTest from "./components/GetPreferencesTest";
import FilteredUsers from "./components/FilteredUsers";
import EditPreferences from "./components/EditPreferences";
import MatchesPage from "./components/MatchesPage";
import ChatPage from "./components/ChatPage";
import UserProfilePage from "./components/UserProfilePage";
import ConnectionRequests from "./components/ConnectionRequests";
import HamburgerMenu from "./components/HamburgerMenu";
import MatchNotification from "./components/MatchNotification";
import MessageNotification from "./components/MessageNotification";
import webSocketService from "./services/WebSocketService";

import "./App.css";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [matchNotification, setMatchNotification] = useState(null);
  const [messageNotification, setMessageNotification] = useState(null);
  const [matches, setMatches] = useState([]);
  const [chatIds, setChatIds] = useState({});
  const recentlySeenMessages = useRef(new Set()); // Track recently seen messages

  // Helper: Check if user is logged in
  let token = localStorage.getItem("token");
  let isLoggedIn = !!token;

  // Check if user is in chat window
  const isInChatWindow = location.pathname.startsWith("/chat");

  // Get current chat ID from URL
  const getCurrentChatId = () => {
    if (location.pathname.startsWith("/chat/")) {
      return location.pathname.split("/").pop();
    }
    return null;
  };

  // Clear recently seen messages after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      recentlySeenMessages.current.clear();
    }, 2000); // Clear after 2 seconds

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Effect to track current chat messages as seen
  useEffect(() => {
    const currentChatId = getCurrentChatId();
    if (currentChatId) {
      console.log("[App] Currently viewing chat:", currentChatId);
      // Mark this chat as visited
      // visitedChats.current.add(currentChatId); // This line is removed as per new_code

      // Clear any pending messages for this chat
      // pendingMessages.current.delete(currentChatId); // This line is removed as per new_code
    }
  }, [location.pathname]);

  // Fetch user's matches and initialize WebSocket
  useEffect(() => {
    console.log("[App] useEffect triggered, isLoggedIn:", isLoggedIn);

    const initializeWebSocket = async () => {
      if (!isLoggedIn) {
        console.log(
          "[App] Skipping WebSocket initialization - user not logged in"
        );
        return;
      }

      try {
        console.log("[App] Fetching matches data...");
        // Fetch user's matches
        const matchesResponse = await fetch("/api/likes/enriched-matches", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          console.log("[App] Matches data received:", matchesData);
          setMatches(matchesData);

          // Get chat IDs for each match
          console.log("[App] Fetching chat IDs for matches...");
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
                console.log(
                  `[App] Got chat ID for user ${match.likedId}:`,
                  chatIdData.chatId
                );
              }
            } catch (error) {
              console.error(
                `[App] Error fetching chat ID for user ${match.likedId}:`,
                error
              );
            }
          }
          setChatIds(chatIdMap);
          console.log("[App] All chat IDs fetched:", chatIdMap);

          // Add match notification handler
          console.log("[App] Setting up match notification handler");
          webSocketService.addOnMatchCallback((notification) => {
            console.log(
              "[App] Match callback triggered with notification:",
              notification
            );
            setMatchNotification(notification);
            console.log("[App] matchNotification state set to:", notification);

            // When we get a new match, fetch their chat ID and subscribe
            const fetchNewMatchChatId = async () => {
              try {
                const chatIdResponse = await fetch(
                  `/api/chat/chat-id/${notification.matchedUserId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                if (chatIdResponse.ok) {
                  const chatIdData = await chatIdResponse.json();
                  setChatIds((prev) => ({
                    ...prev,
                    [notification.matchedUserId]: chatIdData.chatId,
                  }));

                  // Subscribe to the new chat
                  webSocketService.subscribeToChat(chatIdData.chatId, {
                    likedId: notification.matchedUserId,
                    likedDisplayName: notification.matchedUserName,
                  });
                }
              } catch (error) {
                console.error(
                  "[App] Error fetching chat ID for new match:",
                  error
                );
              }
            };
            fetchNewMatchChatId();
          });

          // Add message notification handler with chat window check
          console.log("[App] Setting up message notification handler");
          webSocketService.addOnMessageCallback((message) => {
            console.log(
              "[App] Message callback triggered with message:",
              message
            );

            const currentChatId = getCurrentChatId();
            const messageId = `${message.chatId}-${message.sentAt}`;

            // Don't show notification if:
            // 1. We're currently in this chat OR
            // 2. We've recently seen this message
            if (
              currentChatId === message.chatId.toString() ||
              recentlySeenMessages.current.has(messageId)
            ) {
              // Add to recently seen if we're in this chat
              if (currentChatId === message.chatId.toString()) {
                recentlySeenMessages.current.add(messageId);
              }
              return;
            }

            // Create notification object
            const notification = {
              message:
                message.messageContent ||
                `New message from ${message.senderDisplayName}`,
              senderId: message.senderId,
              chatId: message.chatId,
              senderDisplayName: message.senderDisplayName,
              messageId: messageId,
              timestamp: message.sentAt,
            };

            // Show notification
            setMessageNotification(notification);
            console.log(
              "[App] messageNotification state set to:",
              notification
            );
          });

          // Initialize WebSocket connection
          console.log("[App] Initializing WebSocket connection");
          webSocketService.connect(token, matchesData, chatIdMap);
        } else {
          console.error(
            "[App] Failed to fetch matches:",
            await matchesResponse.text()
          );
        }
      } catch (error) {
        console.error("[App] Error in initializeWebSocket:", error);
      }
    };

    initializeWebSocket();

    // Cleanup WebSocket on unmount
    return () => {
      console.log("[App] Cleaning up WebSocket connection");
      webSocketService.disconnect();
    };
  }, [isLoggedIn, isInChatWindow]);

  // Add debugging for notifications
  useEffect(() => {
    console.log("[App] matchNotification state changed to:", matchNotification);
  }, [matchNotification]);

  useEffect(() => {
    console.log(
      "[App] messageNotification state changed to:",
      messageNotification
    );
  }, [messageNotification]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login"); // Redirect to login page after logout
  };

  // Handle closing notification
  const handleCloseNotification = () => {
    if (messageNotification) {
      recentlySeenMessages.current.add(messageNotification.messageId);
    }
    setMessageNotification(null);
  };

  // Handle clicking "View Chat" in notification
  const handleViewChat = (chatId) => {
    if (messageNotification) {
      recentlySeenMessages.current.add(messageNotification.messageId);
    }
  };

  // this will display the login link if the user is not logged in
  // and the profile link and logout button if the user is logged in
  let loggedInLinks;
  if (!isLoggedIn) {
    loggedInLinks = (
      <li>
        <Link to="/login">Login</Link>
      </li>
    );
  } else {
    loggedInLinks = (
      <>
        <li>
          <Link to="/find-users">Find Users</Link>
        </li>
        <li>
          <Link to="/matches">My Matches</Link>
        </li>
        <li>
          <Link to="/connection-requests">Connection Requests</Link>
        </li>
        <li>
          <Link to="/chat">Chat</Link>
        </li>
        <li>
          <Link to="/profile">My Profile</Link>
        </li>
        <li>
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "blue",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </li>
      </>
    );
  }

  return (
    <>
      <HamburgerMenu />
      {matchNotification && (
        <MatchNotification
          notification={matchNotification}
          onClose={() => {
            console.log("[App] Closing match notification");
            setMatchNotification(null);
          }}
        />
      )}
      {messageNotification && (
        <MessageNotification
          notification={messageNotification}
          onClose={handleCloseNotification}
          onViewChat={() => handleViewChat(messageNotification.chatId)}
        />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/test-upload" element={<FileUploadTest />} />
        <Route path="/preferences-test" element={<GetPreferencesTest />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/find-users"
          element={
            <ProtectedRoute>
              <FilteredUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-preferences"
          element={
            <ProtectedRoute>
              <EditPreferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <MatchesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:chatId"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:userId"
          element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connection-requests"
          element={
            <ProtectedRoute>
              <ConnectionRequests />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
