import { useEffect, useState } from "react";
import "./index.css";
import wooshIcon from "./assets/woosh.png";

const API_URL = "https://woosh-api.duckdns.org";

function App() {
  const [activePage, setActivePage] = useState("Wooshes");
  const [authPage, setAuthPage] = useState(() =>
    localStorage.getItem("wooshLoggedInUser") ? null : "splash"
  );
  const [showComposer, setShowComposer] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState(
    localStorage.getItem("wooshLoggedInUser")
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [wooshText, setWooshText] = useState("");
  const [wooshImage, setWooshImage] = useState(null);

  const [wooshes, setWooshes] = useState([]);

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

  const [editingProfile, setEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
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

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    return data;
  };

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

      setCurrentProfile({
        ...profile,
        wooshes: data.wooshes || [],
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

  // ============================================================
  // EDIT PROFILE
  // ============================================================

  const startEditingProfile = () => {
    if (!currentProfile) return;

    setEditDisplayName(currentProfile.displayName || "");
    setEditBio(currentProfile.bio || "");
    setEditingProfile(true);
  };

  // ============================================================
  // PROFILE PICTURE UPLOAD
  // ============================================================

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

    if (!wooshText.trim() && !wooshImage) {
      alert("Your Woosh needs some content.");
      return;
    }

    if (!loggedInUser) {
      alert("You need to be logged in to post.");
      return;
    }

    try {
      await apiFetch("/api/wooshes", {
        method: "POST",
        body: JSON.stringify({
          text: wooshText.trim(),
          image: wooshImage,
        }),
      });

      setWooshText("");
      setWooshImage(null);
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
      await apiFetch(`/api/wooshes/${woosh.id}`, { method: "DELETE" });
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

  const addComment = async (wooshId) => {
    const text = commentInputs[wooshId]?.trim();

    if (!loggedInUser) {
      alert("Log in to comment.");
      return;
    }

    if (!text) return;

    try {
      await apiFetch(`/api/wooshes/${wooshId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          text,
        }),
      });

      setCommentInputs((current) => ({
        ...current,
        [wooshId]: "",
      }));

      await loadWooshes();
    } catch (error) {
      console.error("Comment error:", error);
      alert(error.message);
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

  return (
    <div
      className={`${className} profile-picture-placeholder`}
      aria-label={`${profile?.username || "User"} avatar`}
    >
      {initial}
    </div>
  );
};

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
              @{profile.username}
            </span>
          </button>
        </div>

        {woosh.text && (
          <p className="woosh-text">{woosh.text}</p>
        )}

        {woosh.image && (
          <img
            src={woosh.image}
            alt="Woosh attachment"
            className="woosh-image"
          />
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

          {loggedInUser &&
            woosh.username?.toLowerCase() === loggedInUser.toLowerCase() && (
              <button className="delete-post-button" onClick={() => deleteWoosh(woosh)}>
                Delete
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

                  <span className="comment-text">
                    {comment.text}
                  </span>
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

                <button
                  onClick={() =>
                    addComment(woosh.id)
                  }
                >
                  Post
                </button>
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
                        @{message.username}
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
                                @{member.username}
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
                @{otherUser.username}
              </strong>
            </div>
          </button>
        </div>

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
                      <strong>
                        @{otherUser.username}
                      </strong>
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

        <div className="profile-header">
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
              @{currentProfile.username}
            </div>

            {currentProfile.bio && (
              <p className="profile-bio">
                {currentProfile.bio}
              </p>
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
                      @{currentProfile.username}
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
          await apiFetch(`/api/wooshies/${wooshie.id}`, { method: "DELETE" });
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
              <div className="wooshie-meta"><button className="wooshie-author" onClick={() => openProfile(wooshie.username)}><span className="wooshie-avatar">{(wooshie.displayName || wooshie.username || "?").slice(0, 1).toUpperCase()}</span><span><strong>{wooshie.displayName || wooshie.username}</strong><small>@{wooshie.username}</small></span></button><time>{wooshie.createdAt ? new Date(wooshie.createdAt.replace(" ", "T") + "Z").toLocaleDateString() : ""}</time></div>
              <div className="wooshie-video-frame"><video controls playsInline preload="metadata" src={`${API_URL}${wooshie.videoUrl}`} onPlay={() => recordWooshieView(wooshie)}>Your browser does not support HTML video.</video></div>
              {wooshie.caption && <p className="wooshie-caption">{wooshie.caption}</p>}
              <div className="wooshie-actions"><button className={wooshie.likedByMe ? "liked" : ""} onClick={() => toggleWooshieLike(wooshie)}>{wooshie.likedByMe ? "Liked" : "Like"} · {wooshie.likeCount || 0}</button><button onClick={() => setWooshieCommentsOpen((current) => ({ ...current, [wooshie.id]: !wooshieCommentsOpen[wooshie.id] }))}>Comments · {wooshie.commentCount || (wooshie.comments || []).length || 0}</button>{loggedInUser && wooshie.username?.toLowerCase() === loggedInUser.toLowerCase() && <button className="delete-post-button" onClick={() => deleteWooshie(wooshie)}>Delete</button>}<span className="wooshie-view-count">{wooshie.viewCount || 0} views</span></div>
              {wooshieCommentsOpen[wooshie.id] && <div className="wooshie-comments">
                {(wooshie.comments || []).map((comment) => <div className="wooshie-comment" key={comment.id}><strong>@{comment.username}</strong><span>{comment.text}</span></div>)}
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

          {loggedInUser && (
            <button
              className="post-button"
              onClick={() =>
                setShowComposer(true)
              }
            >
              Post
            </button>
          )}
        </div>

        <div className="woosh-feed">
          {loadingWooshes ? (
            <div className="page-placeholder">
              <h2>Loading...</h2>
            </div>
          ) : wooshes.length === 0 ? (
            <div className="page-placeholder">
              <h2>Welcome to WOOSH</h2>

              <p>
                Your feed will appear here.
              </p>
            </div>
          ) : (
            wooshes.map(renderWoosh)
          )}
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

  // ============================================================
  // MAIN APP
  // ============================================================

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img
            src={wooshIcon}
            alt="Woosh"
            className="brand-icon"
          />

          <span className="brand-name">
            woosh
          </span>
        </div>

        <div className="auth-buttons">
          {loggedInUser ? (
            <>
              <button
                className="logged-in-name-button"
                onClick={() =>
                  openProfile(loggedInUser)
                }
              >
                @{loggedInUser}
              </button>

              <button onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  setAuthPage("login")
                }
              >
                Log in
              </button>

              <button
                className="create-account"
                onClick={() =>
                  setAuthPage("create")
                }
              >
                Create account
              </button>
            </>
          )}
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav>
            {[
              "Wooshes",
              "Wooshies",
              "Community",
              "Account",
            ].map((page) => (
              <button
                key={page}
                className={`nav-button ${
                  activePage === page
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  if (
                    page === "Account" &&
                    loggedInUser
                  ) {
                    openProfile(loggedInUser);
                    return;
                  }

                  setActivePage(page);

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
                {page === "Community"
                  ? "Messages"
                  : page}
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