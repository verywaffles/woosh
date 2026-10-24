import { useEffect, useState } from "react";
import "./index.css";
import wooshIcon from "./assets/woosh.png";
import Blabbers from "./Blabbers.jsx";
import MessagingHub from "./MessagingHub.jsx";
import Explore from "./Explore.jsx";
import GamesCatalog from "./GamesCatalog.jsx";
import TheWoosh from "./TheWoosh.jsx";
import ProfileStatuses from "./ProfileStatuses.jsx";

const API_URL = "https://woosh-api.duckdns.org";

function App() {
  const [activePage, setActivePage] = useState("Wooshes");
  const [authPage, setAuthPage] = useState(() =>
    localStorage.getItem("wooshLoggedInUser") ? null : "splash"
  );
  const [showComposer, setShowComposer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState(
    localStorage.getItem("wooshLoggedInUser")
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [wooshText, setWooshText] = useState("");
  const [wooshImage, setWooshImage] = useState(null);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [gifSearchInputs, setGifSearchInputs] = useState({});
  const [gifResults, setGifResults] = useState({});
  const [gifPickerOpen, setGifPickerOpen] = useState({});
  const [gifLoading, setGifLoading] = useState({});

  const [wooshes, setWooshes] = useState([]);
  const [feedMode, setFeedMode] = useState("main");
  const [followingWooshes, setFollowingWooshes] = useState([]);
  const [loadingFollowingWooshes, setLoadingFollowingWooshes] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [wooshies, setWooshies] = useState([]);
  const [viewedWooshies, setViewedWooshies] = useState(() => new Set());
  const [loadingWooshies, setLoadingWooshies] = useState(false);
  const [showWooshieComposer, setShowWooshieComposer] = useState(false);
  const [wooshieVideoFile, setWooshieVideoFile] = useState(null);
  const [wooshieCaption, setWooshieCaption] = useState("");
  const [savingWooshie, setSavingWooshie] = useState(false);
  const [wooshieError, setWooshieError] = useState("");
  const [wooshieCommentInputs, setWooshieCommentInputs] = useState({});
  const [wooshieCommentsOpen, setWooshieCommentsOpen] = useState({});
  const [loadingWooshes, setLoadingWooshes] = useState(true);

  const [commentInputs, setCommentInputs] = useState({});
  const [openComments, setOpenComments] = useState({});

  const [currentProfile, setCurrentProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  const [editingProfile, setEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editProfilePicture, setEditProfilePicture] = useState(null);
  const [editProfileBanner, setEditProfileBanner] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // ============================================================
  // DMS
  // ============================================================

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const [newDmUsername, setNewDmUsername] = useState("");
  const [creatingConversation, setCreatingConversation] = useState(false);
  // ============================================================
  // GROUP CHATS
  // ============================================================

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  const [activeGroup, setActiveGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [loadingGroupMessages, setLoadingGroupMessages] =
    useState(false);

  const [groupMessageText, setGroupMessageText] = useState("");
  const [sendingGroupMessage, setSendingGroupMessage] =
    useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupUsers, setNewGroupUsers] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [showGroupSettings, setShowGroupSettings] =
    useState(false);

  const [groupNameInput, setGroupNameInput] = useState("");
  const [groupAddUsername, setGroupAddUsername] =
    useState("");
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const token = localStorage.getItem("wooshToken");
  const isOwner = (loggedInUser || "").toLowerCase() === "waff";
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  // ============================================================
  // API HELPER
  // ============================================================

 const apiFetch = async (endpoint, options = {}) => {
    const headers = {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    const isAuthRequest =
      endpoint.startsWith("/api/auth/login") ||
      endpoint.startsWith("/api/auth/register");

    if (response.status === 401 && token && !isAuthRequest) {
      localStorage.removeItem("wooshToken");
      localStorage.removeItem("wooshLoggedInUser");

      setLoggedInUser(null);
      setAuthPage("login");
      setActivePage("Wooshes");

      throw new Error("Your session expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    return data;
};
  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const loadUnreadNotificationCount = async () => {
    if (!loggedInUser || !token) {
      setUnreadNotificationCount(0);
      return;
    }
    try {
      const data = await apiFetch("/api/notifications/unread-count");
      setUnreadNotificationCount(Number(data.count) || 0);
    } catch (error) {
      console.error("Could not load notification count:", error);
    }
  };

  const loadNotifications = async () => {
    if (!loggedInUser || !token) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return;
    }
    try {
      setLoadingNotifications(true);
      const data = await apiFetch("/api/notifications");
      setNotifications(data.notifications || []);
      setUnreadNotificationCount((data.notifications || []).filter((item) => !item.isRead).length);
    } catch (error) {
      console.error("Could not load notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationRead = async (notification) => {
    if (!notification || notification.isRead) return;
    try {
      await apiFetch(`/api/notifications/${notification.id}/read`, { method: "PATCH" });
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
      setUnreadNotificationCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Could not mark notification read:", error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiFetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadNotificationCount(0);
    } catch (error) {
      alert(error.message || "Could not mark notifications as read.");
    }
  };

  const openNotification = async (notification) => {
    await markNotificationRead(notification);
    if (notification.wooshId) {
      setActivePage("Wooshes");
      setCurrentProfile(null);
      window.history.pushState({}, "", "/");
      await loadWooshes();
    } else if (notification.actorUsername) {
      await openProfile(notification.actorUsername);
    }
  };

  useEffect(() => {
    if (!loggedInUser || !token) {
      setNotifications([]);
      setUnreadNotificationCount(0);
      return undefined;
    }
    loadUnreadNotificationCount();
    const interval = window.setInterval(loadUnreadNotificationCount, 30000);
    return () => window.clearInterval(interval);
  }, [loggedInUser, token]);

  useEffect(() => {
    if (activePage === "Notifications") loadNotifications();
  }, [activePage, loggedInUser, token]);

  // ============================================================
  // LOAD WOOSHES
  // ============================================================

  const loadWooshes = async () => {
    try {
      setLoadingWooshes(true);

      const data = await apiFetch("/api/wooshes");

      setWooshes(data.wooshes || []);
    } catch (error) {
      console.error("Could not load Wooshes:", error);
    } finally {
      setLoadingWooshes(false);
    }
  };

  useEffect(() => {
    loadWooshes();
  }, []);

  const loadFollowingWooshes = async () => {
    if (!token) { setFollowingWooshes([]); return; }
    try {
      setLoadingFollowingWooshes(true);
      const data = await apiFetch("/api/wooshes/following");
      setFollowingWooshes(data.wooshes || []);
    } catch (error) {
      console.error("Could not load Following feed:", error);
    } finally { setLoadingFollowingWooshes(false); }
  };

  useEffect(() => {
    if (loggedInUser && token) loadFollowingWooshes();
    else setFollowingWooshes([]);
  }, [loggedInUser, token]);

  const loadWooshies = async () => {
    try {
      setLoadingWooshies(true);
      const data = await apiFetch("/api/wooshies");
      setWooshies(data.wooshies || []);
      setWooshieError("");
    } catch (error) {
      console.error("Could not load Wooshies:", error);
      setWooshieError(error.message || "Could not load Wooshies.");
    } finally {
      setLoadingWooshies(false);
    }
  };

  useEffect(() => {
    if (activePage === "Wooshies") loadWooshies();
  }, [activePage]);

  useEffect(() => {
    if (authPage !== "splash") return undefined;
    const timeout = window.setTimeout(() => setAuthPage("login"), 1400);
    return () => window.clearTimeout(timeout);
  }, [authPage]);

  // ============================================================
  // LOAD DMS
  // ============================================================

  const loadConversations = async () => {
  if (!loggedInUser || !token) {
    setConversations([]);
    return;
  }

  try {
    setLoadingConversations(true);

    const data = await apiFetch("/api/dms");

    setConversations(data.conversations || []);
  } catch (error) {
    console.error("Could not load conversations:", error);
  } finally {
    setLoadingConversations(false);
  }
};

// ============================================================
// LOAD GROUP CHATS
// ============================================================

const loadGroups = async () => {
  if (!loggedInUser || !token) {
    setGroups([]);
    return;
  }

  try {
    setLoadingGroups(true);

    const data = await apiFetch("/api/groups");

    setGroups(data.groups || []);
  } catch (error) {
    console.error("Could not load groups:", error);
  } finally {
    setLoadingGroups(false);
  }
};

// ============================================================
// OPEN GROUP CHAT
// ============================================================

const openGroup = async (group) => {
  try {
    setActiveGroup(group);
    setActiveConversation(null);
    setMessages([]);
    setShowGroupSettings(false);
    setLoadingGroupMessages(true);
    setGroupMessages([]);

    const data = await apiFetch(
      `/api/groups/${group.id}/messages`
    );

    setGroupMessages(data.messages || []);
  } catch (error) {
    console.error("Could not load group messages:", error);
    alert(error.message || "Could not load group messages.");
  } finally {
    setLoadingGroupMessages(false);
  }
};

// ============================================================
// CREATE GROUP CHAT
// ============================================================

const createGroup = async () => {
  const name = newGroupName.trim();

  const usernames = newGroupUsers
    .split(",")
    .map((username) => username.trim().replace(/^@/, ""))
    .filter(Boolean);

  if (!name) {
    alert("Enter a group name.");
    return;
  }

  if (!loggedInUser) {
    alert("You need to be logged in.");
    return;
  }

  try {
    setCreatingGroup(true);

    const data = await apiFetch("/api/groups", {
      method: "POST",
      body: JSON.stringify({
        name,
        usernames,
      }),
    });

    if (!data.group) {
      throw new Error("Group was not returned.");
    }

    setNewGroupName("");
    setNewGroupUsers("");
    setShowCreateGroup(false);

    await loadGroups();
    await openGroup(data.group);
  } catch (error) {
    console.error("Create group error:", error);
    alert(error.message || "Could not create group.");
  } finally {
    setCreatingGroup(false);
  }
};

// ============================================================
// SEND GROUP MESSAGE
// ============================================================

const sendGroupMessage = async () => {
  const text = groupMessageText.trim();

  if (!text || !activeGroup || sendingGroupMessage) {
    return;
  }

  try {
    setSendingGroupMessage(true);

    const data = await apiFetch(
      `/api/groups/${activeGroup.id}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      }
    );

    if (data.message) {
      setGroupMessages((current) => [
        ...current,
        data.message,
      ]);
    }

    setGroupMessageText("");

    await loadGroups();
  } catch (error) {
    console.error("Send group message error:", error);
    alert(error.message || "Could not send group message.");
  } finally {
    setSendingGroupMessage(false);
  }
};

// ============================================================
// RENAME GROUP
// ============================================================

const renameGroup = async () => {
  const name = groupNameInput.trim();

  if (!activeGroup || !name) {
    return;
  }

  try {
    setUpdatingGroup(true);

    const data = await apiFetch(
      `/api/groups/${activeGroup.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }
    );

    setActiveGroup((current) =>
      current
        ? {
            ...current,
            name: data.name || name,
          }
        : current
    );

    setGroups((current) =>
      current.map((group) =>
        group.id === activeGroup.id
          ? {
              ...group,
              name: data.name || name,
            }
          : group
      )
    );
  } catch (error) {
    console.error("Rename group error:", error);
    alert(error.message || "Could not rename group.");
  } finally {
    setUpdatingGroup(false);
  }
};

// ============================================================
// ADD GROUP MEMBER
// ============================================================

const addGroupMember = async () => {
  const username = groupAddUsername
    .trim()
    .replace(/^@/, "");

  if (!activeGroup || !username) {
    return;
  }

  try {
    setUpdatingGroup(true);

    const data = await apiFetch(
      `/api/groups/${activeGroup.id}/members`,
      {
        method: "POST",
        body: JSON.stringify({ username }),
      }
    );

    if (data.member) {
      setActiveGroup((current) =>
        current
          ? {
              ...current,
              members: [
                ...(current.members || []),
                {
                  ...data.member,
                },
              ],
            }
          : current
      );
    }

    setGroupAddUsername("");

    await loadGroups();
  } catch (error) {
    console.error("Add group member error:", error);
    alert(error.message || "Could not add member.");
  } finally {
    setUpdatingGroup(false);
  }
};

// ============================================================
// REMOVE GROUP MEMBER
// ============================================================

const removeGroupMember = async (userId) => {
  if (!activeGroup) {
    return;
  }

  try {
    setUpdatingGroup(true);

    await apiFetch(
      `/api/groups/${activeGroup.id}/members/${userId}`,
      {
        method: "DELETE",
      }
    );

    setActiveGroup((current) =>
      current
        ? {
            ...current,
            members: (current.members || []).filter(
              (member) => member.id !== userId
            ),
          }
        : current
    );

    await loadGroups();
  } catch (error) {
    console.error("Remove group member error:", error);
    alert(error.message || "Could not remove member.");
  } finally {
    setUpdatingGroup(false);
  }
};

// ============================================================
// LEAVE GROUP
// ============================================================

const leaveGroup = async () => {
  if (!activeGroup) {
    return;
  }

  const confirmed = window.confirm(
    `Leave "${activeGroup.name}"?`
  );

  if (!confirmed) {
    return;
  }

  try {
    setUpdatingGroup(true);

    await apiFetch(
      `/api/groups/${activeGroup.id}/leave`,
      {
        method: "DELETE",
      }
    );

    setActiveGroup(null);
    setGroupMessages([]);
    setShowGroupSettings(false);

    await loadGroups();
  } catch (error) {
    console.error("Leave group error:", error);
    alert(error.message || "Could not leave group.");
  } finally {
    setUpdatingGroup(false);
  }
};
  useEffect(() => {
    if (activePage === "Community" && loggedInUser) {
      loadConversations();
      loadGroups();
    }
  }, [activePage, loggedInUser]);

  // ============================================================
  // OPEN CONVERSATION
  // ============================================================

  const openConversation = async (conversation) => {
    try {
      setNicknameDraft(conversation.otherUser?.nickname || "");
      setActiveConversation(conversation);
      setLoadingMessages(true);
      setMessages([]);

      const data = await apiFetch(
        `/api/dms/${conversation.id}/messages`
      );

      setMessages(data.messages || []);
    } catch (error) {
      console.error("Could not load messages:", error);
      alert(error.message || "Could not load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  // ============================================================
  // CREATE / OPEN DM
  // ============================================================

  const startConversation = async () => {
    const cleanUsername = newDmUsername
      .trim()
      .replace(/^@/, "");

    if (!cleanUsername) {
      alert("Enter a username.");
      return;
    }

    if (!loggedInUser) {
      alert("You need to be logged in to send DMs.");
      return;
    }

    try {
  setCreatingConversation(true);

  const data = await apiFetch("/api/dms", {
    method: "POST",
    body: JSON.stringify({
      username: cleanUsername,
    }),
  });

      const conversation = data.conversation;

      if (!conversation) {
        throw new Error("Conversation was not returned.");
      }

      setNewDmUsername("");

      await loadConversations();

      setNicknameDraft(conversation.otherUser?.nickname || "");
      setActiveConversation(conversation);

      const messagesData = await apiFetch(
        `/api/dms/${conversation.id}/messages`
      );

      setMessages(messagesData.messages || []);
    } catch (error) {
      console.error("Could not start conversation:", error);
      alert(error.message || "Could not start conversation.");
    } finally {
      setCreatingConversation(false);
    }
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const sendMessage = async () => {
    const text = messageText.trim();

    if (!text) return;

    if (!activeConversation) {
      return;
    }

    if (sendingMessage) {
      return;
    }

    try {
      setSendingMessage(true);

      const data = await apiFetch(
        `/api/dms/${activeConversation.id}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            text,
          }),
        }
      );

      if (data.message) {
        setMessages((current) => [
          ...current,
          data.message,
        ]);
      }

      setMessageText("");

      await loadConversations();
    } catch (error) {
      console.error("Send message error:", error);
      alert(error.message || "Could not send message.");
    } finally {
      setSendingMessage(false);
    }
  };

  const saveDmNickname = async () => {
    if (!activeConversation || !token) return;
    try {
      setSavingNickname(true);
      const data = await apiFetch(`/api/dms/${activeConversation.id}/nickname`, { method: "PATCH", body: JSON.stringify({ nickname: nicknameDraft.trim() }) });
      const nickname = data.nickname || "";
      setActiveConversation((current) => current ? { ...current, otherUser: { ...(current.otherUser || {}), nickname } } : current);
      setConversations((current) => current.map((item) => item.id === activeConversation.id ? { ...item, otherUser: { ...(item.otherUser || {}), nickname } } : item));
    } catch (error) { alert(error.message || "Could not save nickname."); }
    finally { setSavingNickname(false); }
  };

  // ============================================================
  // BACK TO CONVERSATIONS
  // ============================================================

  const closeConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setMessageText("");
  };

  // ============================================================
  // AUTH - CREATE ACCOUNT
  // ============================================================

  const handleCreateAccount = async (event) => {
    event.preventDefault();

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      alert("Please enter a username and password.");
      return;
    }

    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: cleanUsername,
          displayName: displayName.trim(),
          password,
        }),
      });

      localStorage.setItem("wooshToken", data.token);
      localStorage.setItem(
        "wooshLoggedInUser",
        data.user.username
      );

      setLoggedInUser(data.user.username);

      setAuthPage(null);
      setUsername("");
      setPassword("");
      setDisplayName("");

      alert(`Welcome to WOOSH, @${data.user.username}!`);

      await loadWooshes();
    } catch (error) {
      console.error("Registration error:", error);
      alert(error.message);
    }
  };

  // ============================================================
  // AUTH - LOGIN
  // ============================================================

  const handleLogin = async (event) => {
    event.preventDefault();

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      alert("Please enter a username and password.");
      return;
    }

    try {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: cleanUsername,
          password,
        }),
      });

      localStorage.setItem("wooshToken", data.token);
      localStorage.setItem(
        "wooshLoggedInUser",
        data.user.username
      );

      setLoggedInUser(data.user.username);

      setAuthPage(null);
      setUsername("");
      setPassword("");
      setDisplayName("");

      alert(`Welcome back, @${data.user.username}!`);

      await loadWooshes();
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("wooshLoggedInUser");
    localStorage.removeItem("wooshToken");

    setLoggedInUser(null);
    setActivePage("Wooshes");
    setCurrentProfile(null);
    setEditingProfile(false);

    setConversations([]);
    setActiveConversation(null);
    setMessages([]);
    setGroups([]);
    setActiveGroup(null);
    setGroupMessages([]);
    setShowCreateGroup(false);
    setShowGroupSettings(false);
  };

  // ============================================================
  // PROFILE
  // ============================================================

  const loadProfile = async (profileUsername) => {
    try {
      setProfileLoading(true);

      const data = await apiFetch(
        `/api/users/${encodeURIComponent(profileUsername)}`
      );

      const profile = data.user || data.profile || null;

      if (!profile) {
        throw new Error("Profile not found.");
      }

      const followData = token
        ? await apiFetch(`/api/users/${encodeURIComponent(profileUsername)}/follow-status`).catch(() => ({}))
        : {};
      setCurrentProfile({
        ...profile,
        wooshes: data.wooshes || [],
        followersCount: profile.followersCount ?? 0,
        followingCount: profile.followingCount ?? 0,
        isFollowing: Boolean(followData.isFollowing),
      });

      setEditingProfile(false);
      setActivePage("Profile");

      return profile;
    } catch (error) {
      console.error("Could not load profile:", error);
      alert(error.message || "Could not load profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const openProfile = async (profileUsername) => {
    if (!profileUsername) return;

    const cleanUsername = profileUsername
      .replace(/^@/, "")
      .trim();

    if (!cleanUsername) return;

    window.history.pushState(
      {},
      "",
      `/@${encodeURIComponent(cleanUsername)}`
    );

    await loadProfile(cleanUsername);
  };

  const closeProfile = () => {
    window.history.pushState({}, "", "/");

    setCurrentProfile(null);
    setActivePage("Wooshes");
  };

  const toggleFollow = async () => {
    if (!token) {
      setAuthPage("login");
      return;
    }
    if (!currentProfile || !loggedInUser || followBusy) return;
    try {
      setFollowBusy(true);
      const method = currentProfile.isFollowing ? "DELETE" : "POST";
      const result = await apiFetch(
        `/api/users/${encodeURIComponent(currentProfile.username)}/follow`,
        { method }
      );
      setCurrentProfile((current) => ({
        ...current,
        isFollowing: Boolean(result.isFollowing),
        followersCount: result.followersCount ?? current.followersCount,
      }));
    } catch (error) {
      alert(error.message || "Could not update follow.");
    } finally {
      setFollowBusy(false);
    }
  };

  // ============================================================
  // EDIT PROFILE
  // ============================================================

  const startEditingProfile = () => {
    if (!currentProfile) return;

    setEditDisplayName(currentProfile.displayName || "");
    setEditBio(currentProfile.bio || "");
    setEditProfilePicture(
      currentProfile.profilePicture || currentProfile.profile_picture || null
    );
    setEditProfileBanner(
      currentProfile.profileBanner || currentProfile.profile_banner || null
    );
    setEditingProfile(true);
  };

  const optimizeProfileImage = (file, maxDimension, quality = 0.84) =>
    new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith("image/")) {
        reject(new Error("Choose an image file."));
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        reject(new Error("Choose an image smaller than 8 MB."));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read that image."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("That image could not be opened."));
        image.onload = () => {
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Your browser could not process that image."));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const handleProfileImageChange = async (event, imageType) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const optimized = await optimizeProfileImage(
        file,
        imageType === "banner" ? 1600 : 512,
        imageType === "banner" ? 0.82 : 0.86
      );
      if (imageType === "banner") {
        setEditProfileBanner(optimized);
      } else {
        setEditProfilePicture(optimized);
      }
    } catch (error) {
      alert(error.message || "Could not use that image.");
    }
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const saveProfile = async () => {
    if (!currentProfile) return;

    try {
      setSavingProfile(true);

      const data = await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: editDisplayName.trim(),
          bio: editBio.trim(),
          profilePicture: editProfilePicture,
          profileBanner: editProfileBanner,
        }),
      });

      const updatedUser = data.user || data.profile;

      setCurrentProfile((current) => ({
        ...current,
        ...updatedUser,
      }));

      setEditingProfile(false);

      localStorage.setItem(
        "wooshLoggedInUser",
        updatedUser.username
      );

      alert("Profile updated!");
    } catch (error) {
      console.error("Profile update error:", error);
      alert(error.message || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ============================================================
  // WOOSH IMAGE UPLOAD
  // ============================================================

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setWooshImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  // ============================================================
  // CREATE WOOSH
  // ============================================================

  const handleCreateWoosh = async (event) => {
    event.preventDefault();

    if (!wooshText.trim() && !wooshImage && !(pollEnabled && pollQuestion.trim())) {
      alert("Your Woosh needs some content.");
      return;
    }

    if (!loggedInUser) {
      alert("You need to be logged in to post.");
      return;
    }
    if (pollEnabled) {
      const options = pollOptions
        .map((option) => option.trim())
        .filter(Boolean);

      if (
        !pollQuestion.trim() ||
        options.length < 2 ||
        options.length > 4 ||
        new Set(options.map((option) => option.toLowerCase())).size !== options.length
      ) {
        alert("Enter a question and 2–4 different poll options.");
        return;
      }
    }
    try {
      await apiFetch("/api/wooshes", {
        method: "POST",
        body: JSON.stringify({
          text: wooshText.trim(),
          image: wooshImage,
          poll: pollEnabled ? { question: pollQuestion, options: pollOptions.filter((option) => option.trim()) } : null,
        }),
      });

      setWooshText("");
      setWooshImage(null);
      setPollEnabled(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setShowComposer(false);

      await loadWooshes();

      if (
        currentProfile &&
        currentProfile.username.toLowerCase() ===
          loggedInUser.toLowerCase()
      ) {
        await loadProfile(loggedInUser);
      }
    } catch (error) {
      console.error("Create Woosh error:", error);
      alert(error.message);
    }
  };

  const deleteWoosh = async (woosh) => {
    if (!loggedInUser || !token) {
      setAuthPage("login");
      return;
    }

    if (!window.confirm("Delete this Woosh? This cannot be undone.")) return;

    try {
      await apiFetch(isOwner && woosh.username?.toLowerCase() !== loggedInUser.toLowerCase() ? `/api/admin/wooshes/${woosh.id}` : `/api/wooshes/${woosh.id}`, { method: "DELETE" });
      setWooshes((current) => current.filter((item) => item.id !== woosh.id));
      if (currentProfile) await loadProfile(currentProfile.username);
    } catch (error) {
      console.error("Delete Woosh error:", error);
      alert(error.message || "Could not delete Woosh.");
    }
  };

  // ============================================================
  // LIKE
  // ============================================================

  const toggleLike = async (wooshId) => {
    if (!loggedInUser) {
      alert("Log in to like a Woosh.");
      return;
    }

    try {
      await apiFetch(`/api/wooshes/${wooshId}/like`, {
        method: "POST",
      });

      await loadWooshes();
    } catch (error) {
      console.error("Like error:", error);
      alert(error.message);
    }
  };

  // ============================================================
  // COMMENTS
  // ============================================================

  const toggleComments = (wooshId) => {
    setOpenComments((current) => ({
      ...current,
      [wooshId]: !current[wooshId],
    }));
  };

  const handleCommentChange = (wooshId, value) => {
    setCommentInputs((current) => ({
      ...current,
      [wooshId]: value,
    }));
  };

  const addComment = async (wooshId, gifUrl = null) => {
    const text = commentInputs[wooshId]?.trim();

    if (!loggedInUser) {
      alert("Log in to comment.");
      return;
    }

    if (!text && !gifUrl) return;

    try {
      await apiFetch(`/api/wooshes/${wooshId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text, gifUrl }),
      });

      setCommentInputs((current) => ({
        ...current,
        [wooshId]: "",
      }));

      setGifPickerOpen((current) => ({ ...current, [wooshId]: false }));
      setGifResults((current) => ({ ...current, [wooshId]: [] }));
      await loadWooshes();
    } catch (error) {
      console.error("Comment error:", error);
      alert(error.message);
    }
  };


  const searchGifs = async (wooshId) => {
    const query = (gifSearchInputs[wooshId] || "").trim();
    if (!query) return;
    setGifLoading((current) => ({ ...current, [wooshId]: true }));
    try {
      const data = await apiFetch(`/api/giphy/search?q=${encodeURIComponent(query)}`);
      setGifResults((current) => ({ ...current, [wooshId]: data.gifs || [] }));
    } catch (error) {
      alert(error.message || "GIF search is not available right now.");
    } finally {
      setGifLoading((current) => ({ ...current, [wooshId]: false }));
    }
  };

  const voteInPoll = async (wooshId, optionId) => {
    if (!loggedInUser) { setAuthPage("login"); return; }
    try {
      await apiFetch(`/api/wooshes/${wooshId}/poll/vote`, {
        method: "POST",
        body: JSON.stringify({ optionId }),
      });
      await loadWooshes();
    } catch (error) {
      alert(error.message || "Could not save your vote.");
      await loadWooshes();
    }
  };

  // ============================================================
  // REWOOSH
  // ============================================================

  const rewoosh = async (woosh) => {
    if (!loggedInUser) {
      alert("Log in to Rewoosh.");
      return;
    }

    try {
      await apiFetch(`/api/wooshes/${woosh.id}/rewoosh`, {
        method: "POST",
      });

      await loadWooshes();
    } catch (error) {
      console.error("Rewoosh error:", error);
      alert(error.message);
    }
  };

  // ============================================================
  // AVATAR
  // ============================================================

  const renderAvatar = (
    profile,
    className = "profile-picture"
  ) => {
    const initial =
      profile?.username?.trim()?.charAt(0)?.toUpperCase() || "?";
    const picture =
      profile?.profilePicture || profile?.profile_picture || null;

    if (picture) {
      return (
        <img
          className={`${className} profile-picture-image`}
          src={picture}
          alt={`@${profile?.username || "user"} avatar`}
          loading="lazy"
        />
      );
    }

    return (
      <div
        className={`${className} profile-picture-placeholder`}
        aria-label={`${profile?.username || "User"} avatar`}
      >
        {initial}
      </div>
    );
  };

  const ownerBadge = (username) =>
    (username || "").toLowerCase() === "waff" ? <span className="owner-badge">Owner</span> : null;

  // ============================================================
  // RENDER WOOSH
  // ============================================================

  const renderWoosh = (woosh) => {
    const liked =
      loggedInUser &&
      (woosh.likes || []).includes(loggedInUser);

    const profile = {
      username: woosh.rewooshedFromUsername || woosh.username,
      displayName:
        woosh.rewooshedFromDisplayName ||
        woosh.displayName ||
        woosh.display_name ||
        woosh.rewooshedFromUsername ||
        woosh.username,
      profilePicture:
        woosh.rewooshedFromProfilePicture ||
        woosh.profilePicture ||
        woosh.profile_picture ||
        null,
    };

    return (
      <article className="woosh-card" key={woosh.id}>
        {woosh.rewooshedFromId && (
          <div className="rewoosh-label">
            Rewooshed by{" "}
            <button
              className="rewoosh-attribution"
              onClick={() => openProfile(woosh.username)}
            >
              @{woosh.username}
            </button>
          </div>
        )}

        <div className="woosh-user">
          <button
            className="woosh-user-button"
            onClick={() => openProfile(profile.username)}
          >
            {renderAvatar(profile, "woosh-avatar")}

            <span className="woosh-username">
              @{profile.username} {ownerBadge(profile.username)}
            </span>
          </button>
        </div>

        {woosh.text && (
          <p className="woosh-text">{woosh.text}</p>
        )}

        {woosh.image && (
          <img src={woosh.image} alt="Woosh attachment" className="woosh-image" />
        )}

        {woosh.poll && (
          <section className="woosh-poll">
            <h3>{woosh.poll.question}</h3>
            {woosh.poll.options.map((option) => {
              const total = woosh.poll.totalVotes || 0;
              const percent = total ? Math.round((option.votes / total) * 100) : 0;
              return <div className="poll-option-row" key={option.id}>
                <button className="poll-option-button" onClick={() => voteInPoll(woosh.id, option.id)}>
                  <span>{option.text}</span><strong>{percent}%</strong>
                </button>
                <div className="poll-result-track"><span style={{ width: `${percent}%` }} /></div>
              </div>;
            })}
            <p className="poll-total">{woosh.poll.totalVotes} vote{woosh.poll.totalVotes === 1 ? "" : "s"} · one vote per account</p>
          </section>
        )}

        <div className="woosh-actions">
          <button
            className={liked ? "liked" : ""}
            onClick={() => toggleLike(woosh.id)}
          >
            Like{" "}
            {woosh.likes?.length > 0 &&
              woosh.likes.length}
          </button>

          <button
            onClick={() => toggleComments(woosh.id)}
          >
            Comment{" "}
            {woosh.comments?.length > 0 &&
              woosh.comments.length}
          </button>

          <button onClick={() => rewoosh(woosh)}>
            Rewoosh{" "}
            {woosh.rewooshes?.length > 0 &&
              woosh.rewooshes.length}
          </button>

          {loggedInUser && (isOwner || woosh.username?.toLowerCase() === loggedInUser.toLowerCase()) && (
              <button className="delete-post-button" onClick={() => deleteWoosh(woosh)}>
                {isOwner && woosh.username?.toLowerCase() !== loggedInUser.toLowerCase() ? "Owner delete" : "Delete"}
              </button>
            )}
        </div>

        {openComments[woosh.id] && (
          <div className="comments-section">
            {(woosh.comments || []).map((comment) => {
              const commentProfile = {
                username: comment.username,
                profilePicture:
                  comment.profilePicture ||
                  comment.profile_picture ||
                  null,
              };

              return (
                <div
                  className="comment"
                  key={comment.id}
                >
                  <button
                    className="comment-user"
                    onClick={() =>
                      openProfile(
                        commentProfile.username
                      )
                    }
                  >
                    {renderAvatar(
                      commentProfile,
                      "comment-avatar"
                    )}

                    <span>
                      @{commentProfile.username}
                    </span>
                  </button>

                  {comment.text && <span className="comment-text">{comment.text}</span>}
                  {comment.gifUrl && <img className="comment-gif" src={comment.gifUrl} alt="GIF comment" loading="lazy" />}
                </div>
              );
            })}

            {loggedInUser && (
              <div className="comment-input">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={
                    commentInputs[woosh.id] || ""
                  }
                  onChange={(event) =>
                    handleCommentChange(
                      woosh.id,
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addComment(woosh.id);
                    }
                  }}
                />

                <button onClick={() => addComment(woosh.id)}>Post</button>
                <button type="button" className="gif-picker-toggle" onClick={() => setGifPickerOpen((current) => ({ ...current, [woosh.id]: !current[woosh.id] }))}>GIF</button>
              </div>
            )}
            {loggedInUser && gifPickerOpen[woosh.id] && (
              <div className="gif-picker">
                <p className="giphy-attribution">Powered by GIPHY</p>
                <form onSubmit={(event) => { event.preventDefault(); searchGifs(woosh.id); }}>
                  <input value={gifSearchInputs[woosh.id] || ""} placeholder="Search GIPHY..." onChange={(event) => setGifSearchInputs((current) => ({ ...current, [woosh.id]: event.target.value }))} />
                  <button type="submit" disabled={gifLoading[woosh.id]}>{gifLoading[woosh.id] ? "Searching..." : "Search"}</button>
                </form>
                <div className="gif-results">
                  {(gifResults[woosh.id] || []).map((gif) => <button type="button" key={gif.id} onClick={() => addComment(woosh.id, gif.url)} title={gif.alt}><img src={gif.preview} alt={gif.alt} loading="lazy" /></button>)}
                </div>
              </div>
            )}
          </div>
        )}
      </article>
    );
  };

  // ============================================================
  // DMS PAGE
  // ============================================================

  const renderDmsPage = () => {
  if (!loggedInUser) {
    return (
      <>
        <h1>Messages</h1>

        <div className="page-placeholder">
          <h2>Log in to use Messages</h2>

          <p>
            You need an account to send and receive
            direct messages and group messages.
          </p>

          <button
            className="post-button"
            onClick={() => setAuthPage("login")}
          >
            Log in
          </button>
        </div>
      </>
    );
  }

  // ==========================================================
  // ACTIVE GROUP CHAT
  // ==========================================================

  if (activeGroup) {
    const currentMember = activeGroup.members?.find(
      (member) =>
        member.username?.toLowerCase() ===
        loggedInUser?.toLowerCase()
    );

    const isGroupOwner =
      currentMember?.id === activeGroup.createdBy;

    return (
      <div className="dm-page">
        <div className="dm-chat-header group-chat-header">
          <button
            className="dm-back-button"
            onClick={() => {
              setActiveGroup(null);
              setGroupMessages([]);
              setShowGroupSettings(false);
            }}
          >
            ←
          </button>

          <div className="dm-user-header">
            <div
  className="group-avatar"
  style={{ color: "#ffffff" }}
>
              {activeGroup.name
                ?.charAt(0)
                ?.toUpperCase() || "G"}
            </div>

            <div>
              <strong style={{ color: "#ffffff" }}>
  {activeGroup.name}
</strong>

              <div
  className="group-member-count"
  style={{ color: "#ffffff", opacity: 0.85 }}
>
                {activeGroup.members?.length || 0}{" "}
                {(activeGroup.members?.length || 0) === 1
                  ? "member"
                  : "members"}
              </div>
            </div>
          </div>

          <button
  className="group-settings-button"
  style={{
    color: "#ffffff",
    borderColor: "#ffffff",
  }}
  onClick={() => {
    setGroupNameInput(activeGroup.name || "");
    setGroupAddUsername("");
    setShowGroupSettings(true);
  }}
  title="Group settings"
>
  ⚙
</button>
        </div>

        <div className="dm-messages">
          {loadingGroupMessages ? (
            <div className="dm-empty">
              Loading messages...
            </div>
          ) : groupMessages.length === 0 ? (
            <div className="dm-empty">
              <h3>Start the conversation</h3>

              <p>
                Send the first message in{" "}
                <strong>{activeGroup.name}</strong>.
              </p>
            </div>
          ) : (
            groupMessages.map((message) => {
              const isMine =
                message.username?.toLowerCase() ===
                loggedInUser.toLowerCase();

              return (
                <div
                  key={message.id}
                  className={`dm-message-row ${
                    isMine ? "mine" : "theirs"
                  }`}
                >
                  {!isMine &&
                    renderAvatar(
                      {
                        username: message.username,
                        profilePicture:
                          message.profilePicture ||
                          message.profile_picture ||
                          null,
                      },
                      "dm-message-avatar"
                    )}

                  <div>
                    {!isMine && (
                      <div className="group-message-sender">
                        @{message.username} {ownerBadge(message.username)}
                      </div>
                    )}

                    <div
                      className={`dm-message ${
                        isMine ? "mine" : "theirs"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="dm-input-area">
          <input
            type="text"
            placeholder={`Message ${activeGroup.name}`}
            value={groupMessageText}
            onChange={(event) =>
              setGroupMessageText(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                sendGroupMessage();
              }
            }}
          />

          <button
            className="post-button"
            onClick={sendGroupMessage}
            disabled={
              sendingGroupMessage ||
              !groupMessageText.trim()
            }
          >
            {sendingGroupMessage ? "..." : "Send"}
          </button>
        </div>

        {/* ====================================================
            GROUP SETTINGS
        ==================================================== */}

        {showGroupSettings && (
          <div
  style={{
    position: "fixed",
    inset: 0,
    zIndex: 999999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "rgba(0, 0, 0, 0.65)",
  }}
  onClick={() => setShowGroupSettings(false)}
>
            <div
  style={{
    width: "min(500px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: 28,
    border: "2px solid #808080",
    borderRadius: 16,
    background: "#ffffff",
color: "#111111",
    boxShadow: "var(--shadow)",
  }}
  onClick={(event) => event.stopPropagation()}
>
              <div className="group-modal-header">
                <h2>Group Settings</h2>

                <button
                  className="group-modal-close"
                  onClick={() =>
                    setShowGroupSettings(false)
                  }
                >
                  Exit
                </button>
              </div>

              {/* Rename */}
              {isGroupOwner && (
                <div className="group-setting-section">
                  <h3>Group name</h3>

                  <div className="group-setting-row">
                    <input
                      type="text"
                      value={groupNameInput}
                      onChange={(event) =>
                        setGroupNameInput(
                          event.target.value
                        )
                      }
                      placeholder="Group name"
                    />

                    <button
                      className="post-button"
                      onClick={renameGroup}
                      disabled={
                        updatingGroup ||
                        !groupNameInput.trim() ||
                        groupNameInput.trim() ===
                          activeGroup.name
                      }
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {/* Add member */}
              <div className="group-setting-section">
                <h3>Add people</h3>

                <div className="group-setting-row">
                  <input
                    type="text"
                    value={groupAddUsername}
                    onChange={(event) =>
                      setGroupAddUsername(
                        event.target.value
                      )
                    }
                    placeholder="Enter username..."
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addGroupMember();
                      }
                    }}
                  />

                  <button
                    className="post-button"
                    onClick={addGroupMember}
                    disabled={
                      updatingGroup ||
                      !groupAddUsername.trim()
                    }
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Members */}
              <div className="group-setting-section">
                <h3>
                  Members (
                  {activeGroup.members?.length || 0})
                </h3>

                <div className="group-members-list">
                  {(activeGroup.members || []).map(
                    (member) => {
                      const memberIsOwner =
                        member.id ===
                        activeGroup.createdBy;

                      const isCurrentUser =
                        member.username?.toLowerCase() ===
                        loggedInUser?.toLowerCase();

                      return (
                        <div
                          className="group-member-row"
                          key={member.id}
                        >
                          <div className="group-member-info">
                            {renderAvatar(
                              {
                                username:
                                  member.username,
                                profilePicture:
                                  member.profilePicture ||
                                  member.profile_picture ||
                                  null,
                              },
                              "group-member-avatar"
                            )}

                            <div>
                              <strong>
                                @{member.username} {ownerBadge(member.username)}
                              </strong>

                              {memberIsOwner && (
                                <span className="group-owner-label">
                                  Owner
                                </span>
                              )}
                            </div>
                          </div>

                          {isGroupOwner &&
                            !memberIsOwner &&
                            !isCurrentUser && (
                              <button
                                className="group-remove-button"
                                onClick={() =>
                                  removeGroupMember(
                                    member.id
                                  )
                                }
                                disabled={updatingGroup}
                              >
                                Remove
                              </button>
                            )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Leave */}
              <div className="group-danger-section">
                <button
                  className="group-leave-button"
                  onClick={leaveGroup}
                  disabled={updatingGroup}
                >
                  Leave Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================
  // ACTIVE DM
  // ==========================================================

  if (activeConversation) {
    const otherUser =
      activeConversation.otherUser ||
      activeConversation.user || {
        username:
          activeConversation.otherUsername ||
          activeConversation.username ||
          "User",
        displayName:
          activeConversation.otherDisplayName ||
          activeConversation.displayName ||
          "",
        profilePicture:
          activeConversation.otherProfilePicture ||
          activeConversation.profilePicture ||
          null,
      };

    return (
      <div className="dm-page">
        <div className="dm-chat-header">
          <button
            className="dm-back-button"
            onClick={closeConversation}
          >
            ←
          </button>

          <button
            className="dm-user-header"
            onClick={() =>
              openProfile(otherUser.username)
            }
          >
            {renderAvatar(
              otherUser,
              "dm-header-avatar"
            )}

            <div>
              <strong>
                {otherUser.nickname || `@${otherUser.username}`} {ownerBadge(otherUser.username)}
              </strong>
              {otherUser.nickname && <small className="dm-real-username">@{otherUser.username}</small>}
            </div>
          </button>
        </div>

        <form className="dm-nickname-editor" onSubmit={(event) => { event.preventDefault(); saveDmNickname(); }}>
          <input aria-label="Nickname for this DM" value={nicknameDraft} onChange={(event) => setNicknameDraft(event.target.value)} maxLength={40} placeholder="Set a nickname (only you see it)" />
          <button type="submit" disabled={savingNickname}>{savingNickname ? "Saving..." : "Save nickname"}</button>
          {activeConversation.otherUser?.nickname && <button type="button" onClick={() => { setNicknameDraft(""); apiFetch(`/api/dms/${activeConversation.id}/nickname`, { method: "PATCH", body: JSON.stringify({ nickname: "" }) }).then(() => { setActiveConversation((current) => current ? { ...current, otherUser: { ...(current.otherUser || {}), nickname: "" } } : current); setConversations((current) => current.map((item) => item.id === activeConversation.id ? { ...item, otherUser: { ...(item.otherUser || {}), nickname: "" } } : item)); }).catch((error) => alert(error.message)); }}>Reset</button>}
        </form>
        <div className="dm-messages">
          {loadingMessages ? (
            <div className="dm-empty">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="dm-empty">
              <h3>Start the conversation</h3>

              <p>
                Send a message to{" "}
                <strong>
                  @{otherUser.username}
                </strong>
                .
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMine =
                message.username?.toLowerCase() ===
                loggedInUser.toLowerCase();

              return (
                <div
                  key={message.id}
                  className={`dm-message-row ${
                    isMine ? "mine" : "theirs"
                  }`}
                >
                  {!isMine &&
                    renderAvatar(
                      {
                        username: message.username,
                        profilePicture:
                          message.profilePicture ||
                          message.profile_picture ||
                          null,
                      },
                      "dm-message-avatar"
                    )}

                  <div
                    className={`dm-message ${
                      isMine ? "mine" : "theirs"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="dm-input-area">
          <input
            type="text"
            placeholder={`Message @${otherUser.username}`}
            value={messageText}
            onChange={(event) =>
              setMessageText(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                sendMessage();
              }
            }}
          />

          <button
            className="post-button"
            onClick={sendMessage}
            disabled={
              sendingMessage ||
              !messageText.trim()
            }
          >
            {sendingMessage ? "..." : "Send"}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MESSAGES + GROUP CHATS LIST
  // ==========================================================

  return (
    <div className="dm-page">
      <div className="dm-title-row">
        <h1>Messages</h1>

        <button
          className="post-button"
          onClick={() => {
            setNewGroupName("");
            setNewGroupUsers("");
            setShowCreateGroup(true);
          }}
        >
          Create Group
        </button>
      </div>

      <MessagingHub />

      {/* ======================================================
          DIRECT MESSAGES
      ====================================================== */}

      <div className="dm-section">
        <h2>Direct Messages</h2>

        <div className="new-dm-box">
          <input
            type="text"
            placeholder="Enter a username..."
            value={newDmUsername}
            onChange={(event) =>
              setNewDmUsername(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                startConversation();
              }
            }}
          />

          <button
            className="post-button"
            onClick={startConversation}
            disabled={
              creatingConversation ||
              !newDmUsername.trim()
            }
          >
            {creatingConversation
              ? "Opening..."
              : "Message"}
          </button>
        </div>

        <div className="dm-conversations">
          {loadingConversations ? (
            <div className="dm-empty">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="dm-empty">
              <p>No direct messages yet.</p>
            </div>
          ) : (
            conversations.map((conversation) => {
              const otherUser =
                conversation.otherUser || {
                  username:
                    conversation.otherUsername ||
                    conversation.username ||
                    "User",
                  displayName:
                    conversation.otherDisplayName ||
                    conversation.displayName ||
                    "",
                  profilePicture:
                    conversation.otherProfilePicture ||
                    conversation.profilePicture ||
                    null,
                };

              const lastMessage =
                conversation.lastMessage;

              return (
                <button
                  className="dm-conversation"
                  key={conversation.id}
                  onClick={() =>
                    openConversation(conversation)
                  }
                >
                  {renderAvatar(
                    otherUser,
                    "dm-conversation-avatar"
                  )}

                  <div className="dm-conversation-info">
                    <div className="dm-conversation-name">
                      <strong>{otherUser.nickname || `@${otherUser.username}`} {ownerBadge(otherUser.username)}</strong>
                      {otherUser.nickname && <small className="dm-real-username">@{otherUser.username}</small>}
                    </div>

                    {lastMessage && (
                      <div className="dm-last-message">
                        {lastMessage.text}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================
          GROUP CHATS
      ====================================================== */}

      <div className="dm-section group-section">
        <div className="group-section-header">
          <h2>Group Chats</h2>

          <button
            className="group-create-button"
            onClick={() => {
              setNewGroupName("");
              setNewGroupUsers("");
              setShowCreateGroup(true);
            }}
          >
            + New Group
          </button>
        </div>

        <div className="dm-conversations">
          {loadingGroups ? (
            <div className="dm-empty">
              Loading groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="dm-empty">
              <p>No group chats yet.</p>

              <button
                className="post-button"
                onClick={() =>
                  setShowCreateGroup(true)
                }
              >
                Create your first group
              </button>
            </div>
          ) : (
            groups.map((group) => (
              <button
                className="dm-conversation group-conversation"
                key={group.id}
                onClick={() => openGroup(group)}
              >
                <div
  className="group-avatar"
  style={{ color: "#ffffff" }}
>
                  {group.name
                    ?.charAt(0)
                    ?.toUpperCase() || "G"}
                </div>

                <div className="dm-conversation-info">
                  <div className="dm-conversation-name">
                    <strong>{group.name}</strong>
                  </div>

                  <div className="dm-last-message">
                    {group.lastMessage?.text ||
                      `${group.members?.length || 0} ${
                        (group.members?.length || 0) ===
                        1
                          ? "member"
                          : "members"
                      }`}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ======================================================
          CREATE GROUP MODAL
      ====================================================== */}

           {showCreateGroup && (
        <div
  style={{
    position: "fixed",
    inset: 0,
    zIndex: 999999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "rgba(0, 0, 0, 0.65)",
  }}
  onClick={() => setShowCreateGroup(false)}
>
          <div
  style={{
    width: "min(500px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
    padding: 28,
    border: "1px solid #ccc",
    borderRadius: 16,
    background: "#fff",
    color: "#111",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
  }}
  onClick={(event) => event.stopPropagation()}
>
            <div className="group-modal-header">
              <h2>Create Group</h2>

              <button
                className="group-modal-close"
                onClick={() => setShowCreateGroup(false)}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="group-setting-section">
              <h3>Group name</h3>

              <input
                type="text"
                placeholder="Enter a group name..."
                value={newGroupName}
                onChange={(event) =>
                  setNewGroupName(event.target.value)
                }
                autoFocus
              />
            </div>

            <div className="group-setting-section">
              <h3>Add people</h3>

              <input
                type="text"
                placeholder="username1, username2, username3"
                value={newGroupUsers}
                onChange={(event) =>
                  setNewGroupUsers(event.target.value)
                }
              />

              <p className="group-input-hint">
                Enter usernames separated by commas.
              </p>
            </div>

            <button
              className="post-button group-submit-button"
              onClick={createGroup}
              disabled={
                creatingGroup || !newGroupName.trim()
              }
              type="button"
            >
              {creatingGroup
                ? "Creating..."
                : "Create Group"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
  // ============================================================
  // PROFILE PAGE
  // ============================================================

  const renderProfilePage = () => {
    if (profileLoading) {
      return (
        <div className="page-placeholder">
          <h2>Loading profile...</h2>
        </div>
      );
    }

    if (!currentProfile) {
      return (
        <div className="page-placeholder">
          <h2>Profile not found</h2>

          <button onClick={closeProfile}>
            Back to Wooshes
          </button>
        </div>
      );
    }

    const isOwnProfile =
      loggedInUser &&
      currentProfile.username?.toLowerCase() ===
        loggedInUser.toLowerCase();

    return (
      <>
        <button
          className="profile-back-button"
          onClick={closeProfile}
        >
          ← Back
        </button>

        {(currentProfile.profileBanner || currentProfile.profile_banner) && (
          <div className="profile-banner">
            <img
              src={currentProfile.profileBanner || currentProfile.profile_banner}
              alt={`@${currentProfile.username} profile banner`}
            />
          </div>
        )}

        <div className={`profile-header ${currentProfile.profileBanner || currentProfile.profile_banner ? "has-profile-banner" : ""}`}>
          <div className="profile-avatar-large">
            {renderAvatar(
              currentProfile,
              "profile-picture-large"
            )}
          </div>

          <div className="profile-info">
            <h1>
              {currentProfile.displayName ||
                currentProfile.username}
            </h1>

            <div className="profile-username">
              @{currentProfile.username} {ownerBadge(currentProfile.username)}
            </div>
            {isOwner && !isOwnProfile && <button className="owner-danger-button" onClick={async () => {
              if (!window.confirm(`Permanently delete @${currentProfile.username} and their content? This cannot be undone.`)) return;
              try { await apiFetch(`/api/admin/users/${currentProfile.id}`, { method: "DELETE" }); setWooshes((items) => items.filter((item) => item.username?.toLowerCase() !== currentProfile.username.toLowerCase())); setWooshies((items) => items.filter((item) => item.username?.toLowerCase() !== currentProfile.username.toLowerCase())); closeProfile(); alert("Account deleted."); }
              catch (error) { alert(error.message || "Could not delete account."); }
            }}>Delete account (Owner)</button>}

            {currentProfile.bio && (
              <p className="profile-bio">
                {currentProfile.bio}
              </p>
            )}

            <div className="profile-follow-stats" style={{ display: "flex", gap: "48px" }}>
              <span><strong>{currentProfile.followingCount ?? 0}</strong> Following</span>
              <span><strong>{currentProfile.followersCount ?? 0}</strong> Followers</span>
            </div>

            {loggedInUser && !isOwnProfile && (
              <button
                className="edit-profile-button"
                onClick={toggleFollow}
                disabled={followBusy}
              >
                {followBusy ? "Please wait..." : currentProfile.isFollowing ? "Following" : "Follow"}
              </button>
            )}

            {isOwnProfile && !editingProfile && (
              <button
                className="edit-profile-button"
                onClick={startEditingProfile}
              >
                Edit profile
              </button>
            )}
          </div>
        </div>

        {editingProfile && (
          <div className="profile-edit-card">
            <h2>Edit profile</h2>

            <input
              type="text"
              placeholder="Display name"
              value={editDisplayName}
              maxLength={50}
              onChange={(event) =>
                setEditDisplayName(
                  event.target.value
                )
              }
            />

            <textarea
              placeholder="Write a bio..."
              value={editBio}
              maxLength={160}
              onChange={(event) =>
                setEditBio(event.target.value)
              }
            />

            <div className="profile-image-editors">
              <div className="profile-image-editor">
                <strong>Profile picture</strong>
                <div className="profile-picture-editor">
                  {editProfilePicture ? (
                    <img
                      className="profile-picture-preview"
                      src={editProfilePicture}
                      alt="Profile picture preview"
                    />
                  ) : (
                    <div className="profile-picture-preview profile-picture-placeholder">
                      {currentProfile.username?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="profile-image-controls">
                    <label className="profile-file-label">
                      Choose picture
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleProfileImageChange(event, "picture")}
                      />
                    </label>
                    {editProfilePicture && (
                      <button
                        type="button"
                        className="profile-remove-image"
                        onClick={() => setEditProfilePicture(null)}
                      >
                        Remove picture
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="profile-image-editor">
                <strong>Profile banner</strong>
                {editProfileBanner ? (
                  <img
                    className="profile-banner-preview"
                    src={editProfileBanner}
                    alt="Profile banner preview"
                  />
                ) : (
                  <div className="profile-banner-preview profile-banner-preview-empty">
                    No banner selected
                  </div>
                )}
                <div className="profile-image-controls">
                  <label className="profile-file-label">
                    Choose banner
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleProfileImageChange(event, "banner")}
                    />
                  </label>
                  {editProfileBanner && (
                    <button
                      type="button"
                      className="profile-remove-image"
                      onClick={() => setEditProfileBanner(null)}
                    >
                      Remove banner
                    </button>
                  )}
                </div>
              </div>
              <p className="profile-image-help">
                Images are automatically resized. Your avatar keeps the same dimensions as the letter avatar.
              </p>
            </div>

            <div className="profile-edit-actions">
              <button
                onClick={() =>
                  setEditingProfile(false)
                }
                disabled={savingProfile}
              >
                Cancel
              </button>

              <button
                className="post-button"
                onClick={saveProfile}
                disabled={savingProfile}
              >
                {savingProfile
                  ? "Saving..."
                  : "Save profile"}
              </button>
            </div>
          </div>
        )}

        <ProfileStatuses
          currentProfile={currentProfile}
          loggedInUser={loggedInUser}
          apiFetch={apiFetch}
          profileWooshes={currentProfile.wooshes || []}
        />

        <div className="profile-wooshes">
          <h2>Wooshes</h2>

          {(!currentProfile.wooshes ||
            currentProfile.wooshes.length === 0) ? (
            <div className="page-placeholder">
              <h3>No Wooshes yet</h3>

              <p>
                {isOwnProfile
                  ? "Your Wooshes will appear here."
                  : "This user hasn't posted anything yet."}
              </p>
            </div>
          ) : (
            currentProfile.wooshes.map((woosh) => (
              <article
                className="woosh-card"
                key={woosh.id}
              >
                <div className="woosh-user">
                  <button
                    className="woosh-user-button"
                    onClick={() =>
                      openProfile(
                        currentProfile.username
                      )
                    }
                  >
                    {renderAvatar(
                      currentProfile,
                      "woosh-avatar"
                    )}

                    <span className="woosh-username">
                      @{currentProfile.username} {ownerBadge(currentProfile.username)}
                    </span>
                  </button>
                </div>

                {woosh.text && (
                  <p className="woosh-text">
                    {woosh.text}
                  </p>
                )}

                {woosh.image && (
                  <img
                    src={woosh.image}
                    alt="Woosh attachment"
                    className="woosh-image"
                  />
                )}

                {isOwnProfile && (
                  <button className="delete-post-button" onClick={() => deleteWoosh(woosh)}>
                    Delete Woosh
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </>
    );
  };

  // ============================================================
  // MAIN PAGES
  // ============================================================

  const recordWooshieView = async (wooshie) => {
    if (!loggedInUser || !token || viewedWooshies.has(wooshie.id)) return;
    setViewedWooshies((current) => new Set(current).add(wooshie.id));
    try {
      const data = await apiFetch(`/api/wooshies/${wooshie.id}/view`, { method: "POST" });
      setWooshies((current) => current.map((item) => item.id === wooshie.id ? { ...item, viewCount: data.viewCount } : item));
    } catch (error) {
      console.warn("Could not record Wooshie view:", error);
      setViewedWooshies((current) => { const next = new Set(current); next.delete(wooshie.id); return next; });
    }
  };
      const renderPage = () => {
    if (activePage === "Explore") {
      return <Explore apiFetch={apiFetch} openProfile={openProfile} loggedInUser={loggedInUser} />;
    }

    if (activePage === "TheWoosh") {
      return (
        <TheWoosh
          loggedInUser={loggedInUser}
          token={token}
          onLogin={() => setAuthPage("login")}
          onOpenProfile={openProfile}
        />
      );
    }
    if (activePage === "Minigames") {
      return <GamesCatalog />;
    }

    if (activePage === "Blabbers") {
      return <Blabbers loggedInUser={loggedInUser} onLogin={() => setAuthPage("login")} />;
    }

    if (activePage === "Profile") {
      return renderProfilePage();
    }

    if (activePage === "Wooshies") {
      const submitWooshie = async (event) => {
        event.preventDefault();
        if (!loggedInUser || !token) { setAuthPage("login"); return; }
        if (!wooshieVideoFile) { setWooshieError("Choose a video file first."); return; }
        try {
          setSavingWooshie(true); setWooshieError("");
          const formData = new FormData();
          formData.append("video", wooshieVideoFile);
          formData.append("caption", wooshieCaption.trim());
          await apiFetch("/api/wooshies", { method: "POST", body: formData });
          setWooshieVideoFile(null); setWooshieCaption(""); setShowWooshieComposer(false);
          await loadWooshies();
        } catch (error) { setWooshieError(error.message || "Could not post Wooshie."); }
        finally { setSavingWooshie(false); }
      };
      const deleteWooshie = async (wooshie) => {
        if (!loggedInUser || !token) { setAuthPage("login"); return; }
        if (!window.confirm("Delete this Wooshie? This cannot be undone.")) return;
        try {
          await apiFetch(isOwner && wooshie.username?.toLowerCase() !== loggedInUser.toLowerCase() ? `/api/admin/wooshies/${wooshie.id}` : `/api/wooshies/${wooshie.id}`, { method: "DELETE" });
          setWooshies((current) => current.filter((item) => item.id !== wooshie.id));
        } catch (error) {
          setWooshieError(error.message || "Could not delete Wooshie.");
        }
      };
      const toggleWooshieLike = async (wooshie) => {
        if (!loggedInUser || !token) { setAuthPage("login"); return; }
        try {
          const data = await apiFetch(`/api/wooshies/${wooshie.id}/like`, { method: "POST" });
          setWooshies((current) => current.map((item) => item.id === wooshie.id ? { ...item, likedByMe: data.liked, likeCount: data.likeCount } : item));
        } catch (error) { setWooshieError(error.message || "Could not update like."); }
      };
      const submitWooshieComment = async (event, wooshie) => {
        event.preventDefault();
        const text = (wooshieCommentInputs[wooshie.id] || "").trim();
        if (!text) return;
        if (!loggedInUser || !token) { setAuthPage("login"); return; }
        try {
          const data = await apiFetch(`/api/wooshies/${wooshie.id}/comments`, { method: "POST", body: JSON.stringify({ text }) });
          setWooshies((current) => current.map((item) => item.id === wooshie.id ? { ...item, comments: [...(item.comments || []), data.comment], commentCount: (item.commentCount || 0) + 1 } : item));
          setWooshieCommentInputs((current) => ({ ...current, [wooshie.id]: "" }));
          setWooshieCommentsOpen((current) => ({ ...current, [wooshie.id]: true }));
        } catch (error) { setWooshieError(error.message || "Could not post comment."); }
      };
      return (
        <section className="wooshies-page">
          <div className="wooshies-header"><div><h1>Wooshies</h1><p>Short videos from the WOOSH community.</p></div>
            <button className="post-button" onClick={() => { if (!loggedInUser) { setAuthPage("login"); return; } setShowWooshieComposer(true); setWooshieError(""); }}>Create Wooshie</button>
          </div>
          {showWooshieComposer && <form className="wooshie-composer" onSubmit={submitWooshie}>
            <div className="wooshie-composer-heading"><h2>Create a Wooshie</h2><button type="button" onClick={() => { setShowWooshieComposer(false); setWooshieVideoFile(null); }}>Cancel</button></div>
            <label>Video file<input type="file" accept="video/mp4,video/webm,video/quicktime,video/ogg" onChange={(event) => {
              const file = event.target.files?.[0] || null;
              setWooshieVideoFile(null);
              if (!file) return;
              const url = URL.createObjectURL(file);
              const video = document.createElement("video");
              video.preload = "metadata";
              video.onloadedmetadata = () => {
                URL.revokeObjectURL(url);
                if (!Number.isFinite(video.duration) || video.duration <= 0) {
                  setWooshieError("Could not read this video's duration.");
                  event.target.value = "";
                } else {
                  setWooshieError("");
                  setWooshieVideoFile(file);
                }
              };
              video.onerror = () => {
                URL.revokeObjectURL(url);
                setWooshieError("Could not read this video's duration.");
                event.target.value = "";
              };
              video.src = url;
            }} required /></label>
            {wooshieVideoFile && <p className="wooshie-help">Selected: {wooshieVideoFile.name} · {(wooshieVideoFile.size / (1024 * 1024)).toFixed(1)} MB</p>}
            <label>Caption<textarea value={wooshieCaption} onChange={(event) => setWooshieCaption(event.target.value)} placeholder="Write a caption..." maxLength={500} /></label>
            <p className="wooshie-help">MP4, WebM, iPhone MOV, and OGG up to 100 MB. Longer videos are automatically trimmed to their first 15 seconds.</p>
            {wooshieError && <p className="wooshie-error" role="alert">{wooshieError}</p>}
            <button className="post-button" type="submit" disabled={savingWooshie}>{savingWooshie ? "Uploading..." : "Upload and publish"}</button>
          </form>}
          {wooshieError && !showWooshieComposer && <p className="wooshie-error" role="alert">{wooshieError}</p>}
          <div className="wooshie-feed">{loadingWooshies ? <div className="page-placeholder"><h2>Loading Wooshies...</h2></div> : wooshies.length === 0 ? <div className="page-placeholder"><h2>No Wooshies yet</h2><p>Be the first to share a short video.</p></div> : wooshies.map((wooshie) => (
            <article className="wooshie-card" key={wooshie.id}>
              <div className="wooshie-meta"><button className="wooshie-author" onClick={() => openProfile(wooshie.username)}>{renderAvatar({ username: wooshie.username, displayName: wooshie.displayName, profilePicture: wooshie.profilePicture || wooshie.profile_picture }, "wooshie-avatar")}<span><strong>{wooshie.displayName || wooshie.username} {ownerBadge(wooshie.username)}</strong><small>@{wooshie.username}</small></span></button><time>{wooshie.createdAt ? new Date(wooshie.createdAt.replace(" ", "T") + "Z").toLocaleDateString() : ""}</time></div>
              <div className="wooshie-video-frame"><video controls playsInline preload="metadata" src={`${API_URL}${wooshie.videoUrl}`} onPlay={() => recordWooshieView(wooshie)}>Your browser does not support HTML video.</video></div>
              {wooshie.caption && <p className="wooshie-caption">{wooshie.caption}</p>}
              <div className="wooshie-actions"><button className={wooshie.likedByMe ? "liked" : ""} onClick={() => toggleWooshieLike(wooshie)}>{wooshie.likedByMe ? "Liked" : "Like"} · {wooshie.likeCount || 0}</button><button onClick={() => setWooshieCommentsOpen((current) => ({ ...current, [wooshie.id]: !wooshieCommentsOpen[wooshie.id] }))}>Comments · {wooshie.commentCount || (wooshie.comments || []).length || 0}</button>{loggedInUser && (isOwner || wooshie.username?.toLowerCase() === loggedInUser.toLowerCase()) && <button className="delete-post-button" onClick={() => deleteWooshie(wooshie)}>{isOwner && wooshie.username?.toLowerCase() !== loggedInUser.toLowerCase() ? "Owner delete" : "Delete"}</button>}<span className="wooshie-view-count">{wooshie.viewCount || 0} views</span></div>
              {wooshieCommentsOpen[wooshie.id] && <div className="wooshie-comments">
                {(wooshie.comments || []).map((comment) => <div className="wooshie-comment" key={comment.id}><strong>@{comment.username} {ownerBadge(comment.username)}</strong><span>{comment.text}</span></div>)}
                {!(wooshie.comments || []).length && <p className="wooshie-help">No comments yet. Start the conversation.</p>}
                <form className="wooshie-comment-form" onSubmit={(event) => submitWooshieComment(event, wooshie)}><input value={wooshieCommentInputs[wooshie.id] || ""} onChange={(event) => setWooshieCommentInputs((current) => ({ ...current, [wooshie.id]: event.target.value }))} placeholder="Add a comment..." maxLength={1000} required /><button className="post-button" type="submit">Comment</button></form>
              </div>}
            </article>
          ))}</div>
        </section>
      );
    }
    if (activePage === "Community") {
      return renderDmsPage();
    }

    if (activePage === "Notifications") {
      const notificationText = (notification) => {
        const actor = notification.actorDisplayName || notification.actorUsername || "Someone";
        if (notification.type === "follow") return <><strong>{actor}</strong> followed you.</>;
        if (notification.type === "like") return <><strong>{actor}</strong> liked your Woosh.</>;
        return <><strong>{actor}</strong> commented on your Woosh.</>;
      };

      return (
        <section className="notifications-page">
          <header className="notifications-header">
            <div>
              <h1>Notifications</h1>
              <p>Updates about your Wooshes and your community.</p>
            </div>
            <button className="post-button" onClick={markAllNotificationsRead} disabled={!unreadNotificationCount}>
              Mark all as read
            </button>
          </header>
          {loadingNotifications ? (
            <div className="notification-empty">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty"><h2>You're all caught up.</h2><p>When someone follows you, likes a Woosh, or comments, you'll see it here.</p></div>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <button key={notification.id} className={`notification-item ${notification.isRead ? "" : "unread"}`} onClick={() => openNotification(notification)}>
                  <span className="notification-avatar">{(notification.actorUsername || "?").slice(0, 1).toUpperCase()}</span>
                  <span className="notification-copy">
                    <span>{notificationText(notification)}</span>
                    {notification.wooshText && <span className="notification-preview">{notification.wooshText}</span>}
                    <time>{new Date(notification.createdAt.includes("T") ? notification.createdAt : notification.createdAt.replace(" ", "T") + "Z").toLocaleString()}</time>
                  </span>
                  {!notification.isRead && <span className="notification-unread-dot" aria-label="Unread" />}
                </button>
              ))}
            </div>
          )}
        </section>
      );
    }

    if (activePage === "Settings") {
      return (
        <section className="settings-page">
          <header className="settings-page-header">
            <h1>Settings</h1>
            <p>Learn more about Woosh.</p>
          </header>

          <section className="settings-section">
            <div className="settings-section-heading">
              <h2>About Woosh</h2>
              <p>A little about the place we're building.</p>
            </div>

            <div className="about-hero">
              <img src={wooshIcon} alt="Woosh logo" />
              <div>
                <h3>woosh</h3>
                <p>A place to share what's happening, keep up with people, and stay connected.</p>
              </div>
            </div>

            <div className="about-detail">
              <h3>Our idea</h3>
              <p>Woosh brings posts, short videos, and conversations together in one place. Share your thoughts, discover what others are posting, and connect with people in your community.</p>
            </div>

            <div className="about-detail">
              <h3>Made to grow</h3>
              <p>Woosh is an evolving project. Features and details may change as it grows, and feedback helps shape what comes next.</p>
            </div>

            <div className="settings-section">
  <h2>Credits</h2>
  <p>
    Woosh is made possible by the people who help build, improve,
    and test the platform. Thank you to everyone who has contributed.
  </p>

  <div className="about-detail">
    <h3>Founder</h3>
    <p>@waff — Founder and super cool guy</p>
  </div>

  <div className="about-detail">
    <h3>Development</h3>
    <p> @xEntityx404— Developer</p>
  </div>

  <div className="about-detail">
    <h3>Beta Testers</h3>
    <p>@Hello/@Oreo — Beta Tester</p>
    <p>@JacobyLivingston23— Beta Tester</p>
    <p>@MadeOfGlass10 — Beta Tester</p>
    <p>@Armore_7 — Beta Tester</p>
    <p>@Scipes — Beta Tester</p>
    <p>@NotLockedIn — Beta Tester</p>
  </div>
</div>

            <div className="about-footer">
              <span>woosh</span>
              <span>Built for sharing and connecting.</span>
            </div>
          </section>
        </section>
      );
    }

    if (activePage === "Account") {
      if (loggedInUser) {
        return (
          <>
            <h1>Account</h1>

            <div className="page-placeholder">
              <h2>@{loggedInUser}</h2>

              <p>
                View and edit your profile here.
              </p>

              <button
                className="post-button"
                onClick={() =>
                  openProfile(loggedInUser)
                }
              >
                View profile
              </button>
            </div>
          </>
        );
      }

      return (
        <>
          <h1>Account</h1>

          <div className="page-placeholder">
            <h2>You're not logged in</h2>

            <p>
              Log in or create an account to view
              your profile.
            </p>

            <button
              onClick={() =>
                setAuthPage("login")
              }
            >
              Log in
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="wooshes-header">
          <h1>Wooshes</h1>
          {loggedInUser && <button className="post-button" onClick={() => setShowComposer(true)}>Post</button>}
        </div>
        <div className="feed-tabs" role="tablist" aria-label="Woosh feed">
          <button type="button" role="tab" aria-selected={feedMode === "main"} className={feedMode === "main" ? "feed-tab active" : "feed-tab"} onClick={() => setFeedMode("main")}>Main</button>
          <button type="button" role="tab" aria-selected={feedMode === "following"} className={feedMode === "following" ? "feed-tab active" : "feed-tab"} onClick={() => {
            if (!loggedInUser || !token) { setAuthPage("login"); return; }
            setFeedMode("following");
            loadFollowingWooshes();
          }}>Following</button>
        </div>
        <div className="woosh-feed">
          {(feedMode === "main" ? loadingWooshes : loadingFollowingWooshes) ? (
            <div className="page-placeholder"><h2>Loading...</h2></div>
          ) : (feedMode === "main" ? wooshes : followingWooshes).length === 0 ? (
            <div className="page-placeholder">
              <h2>{feedMode === "main" ? "Welcome to WOOSH" : "Your Following feed is quiet"}</h2>
              <p>{feedMode === "main" ? "Your feed will appear here." : "Follow some accounts to see their latest Wooshes here."}</p>
            </div>
          ) : (feedMode === "main" ? wooshes : followingWooshes).map(renderWoosh)}
        </div>
      </>
    );
  };

  // ============================================================
  // ONBOARDING + AUTH SCREENS
  // ============================================================

  const continueAsGuest = () => setAuthPage(null);

  if (authPage === "splash") {
    return (
      <div className="onboarding-page splash-page">
        <button className="guest-link" onClick={continueAsGuest}>Continue as guest</button>
        <div className="splash-brand" aria-label="Woosh">
          <img src={wooshIcon} alt="" />
          <span>Woosh</span>
        </div>
      </div>
    );
  }

  if (authPage === "login") {
    return (
      <div className="onboarding-page">
        <button className="guest-link" onClick={continueAsGuest}>Continue as guest</button>
        <div className="onboarding-brand">
          <img src={wooshIcon} alt="Woosh" />
          <span>Woosh</span>
        </div>
        <section className="auth-card onboarding-card">
          <h1>Welcome to Woosh</h1>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="Username" autoComplete="username" value={username}
              onChange={(event) => setUsername(event.target.value)} />
            <input type="password" placeholder="Password" autoComplete="current-password" value={password}
              onChange={(event) => setPassword(event.target.value)} />
            <button type="submit" className="auth-submit">Log in</button>
          </form>
          <p className="auth-prompt">New to Woosh?{" "}
            <button className="auth-inline-link" onClick={() => {
              setAuthPage("create"); setUsername(""); setPassword(""); setDisplayName("");
            }}>Sign up!</button>
          </p>
        </section>
      </div>
    );
  }

  if (authPage === "create") {
    return (
      <div className="onboarding-page">
        <button className="guest-link" onClick={continueAsGuest}>Continue as guest</button>
        <div className="onboarding-brand">
          <img src={wooshIcon} alt="Woosh" />
          <span>Woosh</span>
        </div>
        <section className="auth-card onboarding-card">
          <h1>Create your account</h1>
          <form onSubmit={handleCreateAccount}>
            <input type="text" placeholder="Username" autoComplete="username" value={username}
              onChange={(event) => setUsername(event.target.value)} />
            <input type="text" placeholder="Display name (optional)" autoComplete="nickname" value={displayName}
              onChange={(event) => setDisplayName(event.target.value)} />
            <input type="password" placeholder="Password" autoComplete="new-password" value={password}
              onChange={(event) => setPassword(event.target.value)} />
            <button type="submit" className="auth-submit">Sign up</button>
          </form>
          <p className="auth-prompt">Already have an account?{" "}
            <button className="auth-inline-link" onClick={() => {
              setAuthPage("login"); setUsername(""); setPassword(""); setDisplayName("");
            }}>Log in</button>
          </p>
        </section>
      </div>
    );
  }


  // MAIN APP RESTORED
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src={wooshIcon} alt="Woosh" className="brand-icon" />
          <span className="brand-name">woosh</span>
        </div>
        <button type="button" className="mobile-menu-toggle"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="woosh-mobile-navigation"
          onClick={() => setMobileMenuOpen(open => !open)}>
          {mobileMenuOpen ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
        <div className="auth-buttons">
          {loggedInUser ? <>
            <button className="logged-in-name-button" onClick={() => openProfile(loggedInUser)}>@{loggedInUser}</button>
            <button onClick={handleLogout}>Log out</button>
          </> : <>
            <button onClick={() => setAuthPage("login")}>Log in</button>
            <button className="create-account" onClick={() => setAuthPage("create")}>Create account</button>
          </>}
        </div>
      </header>
      {mobileMenuOpen && <button type="button" className="mobile-menu-overlay"
        aria-label="Close navigation menu" onClick={() => setMobileMenuOpen(false)} />}
      <div className="layout">
        <aside id="woosh-mobile-navigation"
          className={`sidebar ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
          <nav>
            {[
              { page: "TheWoosh", label: "THE WOOSH", symbol: "woosh" },
              { page: "Wooshes", label: "Wooshes", symbol: "feed" },
              { page: "Explore", label: "Explore", symbol: "explore" },
              { page: "Wooshies", label: "Wooshies", symbol: "video" },
              { page: "Blabbers", label: "Blabbers", symbol: "voice" },
              { page: "Community", label: "Messages", symbol: "messages" },
              { page: "Minigames", label: "Minigames", symbol: "game" },
              { page: "Notifications", label: "Notifications", symbol: "notifications" },
              { page: "Account", label: "Account", symbol: "account" },
              { page: "Settings", label: "Settings", symbol: "settings" },
            ].map(({ page, label, symbol }) => (
              <button
                key={page}
                type="button"
                className={`nav-button ${activePage === page ? "active" : ""}`}
                onClick={() => {
                  if (page === "Account" && loggedInUser) {
                    openProfile(loggedInUser);
                    setMobileMenuOpen(false);
                    return;
                  }

                  setActivePage(page);
                  setMobileMenuOpen(false);

                  if (page === "Community") {
                    setActiveConversation(null);
                    setMessages([]);
                    setActiveGroup(null);
                    setGroupMessages([]);
                    setShowGroupSettings(false);
                    loadConversations();
                    loadGroups();
                  }
                }}
              >
                <svg
                  className="nav-symbol"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  {symbol === "woosh" && (
                    <path
                      d="M3 6h5l2 12 2-9 2 9 2-12h5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {symbol === "feed" && (
                    <>
                      <rect x="3.5" y="4" width="17" height="4" rx="1.5" />
                      <rect x="3.5" y="10" width="17" height="4" rx="1.5" />
                      <rect x="3.5" y="16" width="11" height="4" rx="1.5" />
                    </>
                  )}
                  {symbol === "explore" && (
                    <>
                      <circle cx="12" cy="12" r="9" />
                      <path d="m15.5 8.5-2 5-5 2 2-5z" />
                    </>
                  )}
                  {symbol === "video" && (
                    <>
                      <rect x="3" y="4.5" width="18" height="15" rx="3" />
                      <path className="nav-symbol-cutout" d="M10 8.5 16 12l-6 3.5z" />
                    </>
                  )}
                  {symbol === "voice" && (
                    <path
                      d="M3 13h3l2-6 3 11 3-14 3 9h4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {symbol === "messages" && (
                    <>
                      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h8A2.5 2.5 0 0 1 17 5.5v5a2.5 2.5 0 0 1-2.5 2.5H9l-4 3v-3.3a2.4 2.4 0 0 1-1-2z" />
                      <path d="M9 15h5.5a2.5 2.5 0 0 0 2.5-2.5V9h1.5A2.5 2.5 0 0 1 21 11.5v5a2.5 2.5 0 0 1-2.5 2.5H16l-3.5 2v-2H11A2 2 0 0 1 9 17z" />
                    </>
                  )}
                  {symbol === "game" && (
                    <>
                      <rect x="3" y="6" width="18" height="12" rx="3" />
                      <path d="M7 12h4M9 10v4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="16" cy="11" r="1" />
                      <circle cx="18" cy="14" r="1" />
                    </>
                  )}
                  {symbol === "notifications" && (
                    <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
                  )}
                  {symbol === "account" && (
                    <>
                      <circle cx="12" cy="8" r="3.3" />
                      <path d="M4.5 20a7.5 7.5 0 0 1 15 0z" />
                    </>
                  )}
                  {symbol === "settings" && (
                    <>
                      <circle cx="12" cy="12" r="3" />
                      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2z" />
                    </>
                  )}
                </svg>

                <span className="nav-label">{label}</span>

                {page === "Notifications" && unreadNotificationCount > 0 && (
                  <span className="nav-notification-count">
                    {unreadNotificationCount > 99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <main className="main-content">
          {renderPage()}
        </main>
      </div>

      {/* ========================================================
          COMPOSER
      ======================================================== */}

      {showComposer && (
        <div
          className="composer-overlay"
          onClick={() =>
            setShowComposer(false)
          }
        >
          <div
            className="composer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="composer-header">
              <h2>Create Woosh</h2>

              <button
                className="composer-close"
                onClick={() =>
                  setShowComposer(false)
                }
              >
                Exit
              </button>
            </div>

            <form onSubmit={handleCreateWoosh}>
              <textarea
                placeholder="What's happening?"
                value={wooshText}
                onChange={(event) =>
                  setWooshText(event.target.value)
                }
                autoFocus
              />

              {wooshImage && (
                <div className="image-preview">
                  <img
                    src={wooshImage}
                    alt="Preview"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setWooshImage(null)
                    }
                  >
                    Remove image
                  </button>
                </div>
              )}

              <div className="poll-composer">
                <label><input type="checkbox" checked={pollEnabled} onChange={(event) => setPollEnabled(event.target.checked)} /> Add a poll</label>
                {pollEnabled && <>
                  <input className="poll-question-input" value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="Ask a question..." maxLength={240} />
                  {pollOptions.map((option, index) => <input key={index} value={option} maxLength={100} placeholder={`Option ${index + 1}`} onChange={(event) => setPollOptions((current) => current.map((value, i) => i === index ? event.target.value : value))} />)}
                  {pollOptions.length < 4 && <button type="button" onClick={() => setPollOptions((current) => [...current, ""])}>Add option</button>}
                  {pollOptions.length > 2 && <button type="button" onClick={() => setPollOptions((current) => current.slice(0, -1))}>Remove option</button>}
                </>}
              </div>
              <div className="composer-footer">
                <label className="file-button">
                  Add image

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    hidden
                  />
                </label>

                <button
                  type="submit"
                  className="post-button"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;