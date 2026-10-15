import { useCallback, useEffect, useState } from "react";

const API_URL = "https://woosh-api.duckdns.org";

export default function MessagingHub() {
  const token = localStorage.getItem("wooshToken");
  const [servers, setServers] = useState([]);
  const [server, setServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [serverName, setServerName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [channelName, setChannelName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [blockUsername, setBlockUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}/api${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data;
  }, [token]);

  const loadServers = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api("/servers");
      setServers(data.servers || []);
    } catch (e) { setError(e.message); }
  }, [api, token]);

  const loadBlocked = useCallback(async () => {
    if (!token) return;
    try {
      const data = await api("/blocks");
      setBlocked(data.blocked || []);
    } catch (e) { setError(e.message); }
  }, [api, token]);

  useEffect(() => { loadServers(); loadBlocked(); }, [loadServers, loadBlocked]);

  const openServer = async (item) => {
    try {
      setError("");
      const data = await api(`/servers/${item.id}`);
      setServer(data.server);
      setChannels(data.channels || []);
      setMembers(data.members || []);
      setChannel(null);
      setMessages([]);
    } catch (e) { setError(e.message); }
  };

  const openChannel = async (item) => {
    try {
      setError("");
      const data = await api(`/channels/${item.id}/messages`);
      setChannel(item);
      setMessages(data.messages || []);
    } catch (e) { setError(e.message); }
  };

  const createServer = async (event) => {
    event.preventDefault();
    try {
      setBusy(true); setError("");
      const data = await api("/servers", {
        method: "POST",
        body: JSON.stringify({ name: serverName, description }),
      });
      setServerName(""); setDescription("");
      await loadServers();
      await openServer(data.server);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const joinServer = async (event) => {
    event.preventDefault();
    try {
      setBusy(true); setError("");
      await api("/servers/join", { method: "POST", body: JSON.stringify({ inviteCode }) });
      setInviteCode(""); await loadServers();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const createChannel = async (event) => {
    event.preventDefault();
    if (!server) return;
    try {
      setBusy(true); setError("");
      const data = await api(`/servers/${server.id}/channels`, {
        method: "POST", body: JSON.stringify({ name: channelName }),
      });
      setChannelName("");
      await openServer(server);
      await openChannel(data.channel);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const send = async (event) => {
    event.preventDefault();
    if (!channel || !messageText.trim()) return;
    try {
      setBusy(true); setError("");
      const data = await api(`/channels/${channel.id}/messages`, {
        method: "POST", body: JSON.stringify({ text: messageText }),
      });
      setMessages((current) => [...current, data.message]);
      setMessageText("");
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const block = async (event) => {
    event.preventDefault();
    try {
      setBusy(true); setError("");
      await api("/blocks", { method: "POST", body: JSON.stringify({ username: blockUsername }) });
      setBlockUsername(""); await loadBlocked();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const unblock = async (user) => {
    try {
      setError("");
      await api(`/blocks/${user.id}`, { method: "DELETE" });
      await loadBlocked();
    } catch (e) { setError(e.message); }
  };

  if (!token) return <section className="dm-section"><h2>Servers and blocked accounts</h2><p>Log in to manage servers and blocked accounts.</p></section>;

  return (
    <section className="dm-section messaging-hub">
      <h2>Servers</h2>
      {error && <p role="alert" className="messaging-error">{error}</p>}
      <div className="messaging-hub-grid">
        <div className="messaging-hub-panel">
          <form onSubmit={createServer} className="messaging-form">
            <input value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="New server name" maxLength={60} required />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" maxLength={240} />
            <button className="post-button" disabled={busy}>Create server</button>
          </form>
          <form onSubmit={joinServer} className="messaging-form">
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Invite code" required />
            <button className="post-button" disabled={busy}>Join</button>
          </form>
          <div className="messaging-server-list">
            {servers.map((item) => <button key={item.id} className={server?.id === item.id ? "messaging-server active" : "messaging-server"} onClick={() => openServer(item)}>
              <strong>{item.name}</strong><span>{item.memberCount} members · {item.channelCount} channels</span>
            </button>)}
            {!servers.length && <p>No servers yet. Create one or join with an invite code.</p>}
          </div>
        </div>
        <div className="messaging-hub-panel">
          {!server ? <div className="dm-empty"><h3>Choose a server</h3><p>Server channels and messages appear here.</p></div> : <>
            <div className="messaging-server-heading"><div><h3>{server.name}</h3><p>{server.description}</p></div><button onClick={() => navigator.clipboard?.writeText(server.inviteCode)} title="Copy invite code">Copy invite</button></div>
            <p className="messaging-invite">Invite code: <code>{server.inviteCode}</code></p>
            <div className="messaging-channel-list">
              {channels.map((item) => <button key={item.id} className={channel?.id === item.id ? "messaging-channel active" : "messaging-channel"} onClick={() => openChannel(item)}># {item.name}</button>)}
            </div>
            {server.ownerId === Number(localStorage.getItem("wooshUserId")) && <form className="messaging-form" onSubmit={createChannel}><input value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="New channel name" maxLength={40} required /><button className="post-button" disabled={busy}>Add channel</button></form>}
            <div className="messaging-chat">
              {channel ? <><h4># {channel.name}</h4><div className="messaging-messages">{messages.map((message) => <article key={message.id}><strong>@{message.username}</strong><p>{message.text}</p><small>{message.createdAt}</small></article>)}</div><form className="messaging-send" onSubmit={send}><input value={messageText} onChange={(e) => setMessageText(e.target.value)} maxLength={5000} placeholder={`Message #${channel.name}`} required /><button className="post-button" disabled={busy}>Send</button></form></> : <p>Select a channel to read and send messages.</p>}
            </div>
            <details className="messaging-members"><summary>Members ({members.length})</summary>{members.map((member) => <p key={member.id}>@{member.username} · {member.role}</p>)}</details>
          </>}
        </div>
      </div>
      <div className="messaging-blocks">
        <h3>Blocked accounts</h3>
        <form className="messaging-form" onSubmit={block}><input value={blockUsername} onChange={(e) => setBlockUsername(e.target.value)} placeholder="Username to block" required /><button className="post-button" disabled={busy}>Block account</button></form>
        {blocked.map((user) => <div className="messaging-blocked-user" key={user.id}><span>@{user.username}</span><button onClick={() => unblock(user)}>Unblock</button></div>)}
        {!blocked.length && <p>You have not blocked anyone.</p>}
      </div>
      <p className="messaging-security-note">Messages are sent over HTTPS and access is checked by the server. This is not end-to-end encryption: the server can process message text.</p>
    </section>
  );
}
