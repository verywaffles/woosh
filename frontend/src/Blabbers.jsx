import { useCallback, useEffect, useRef, useState } from "react";

const API_URL = "https://woosh-api.duckdns.org";

function decodeUserId(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Number(payload.userId);
  } catch {
    return 0;
  }
}

export default function Blabbers({ loggedInUser, onLogin }) {
  const token = localStorage.getItem("wooshToken");
  const userId = decodeUserId(token || "");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [createInvites, setCreateInvites] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteUsername, setInviteUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const streamRef = useRef(null);
  const peersRef = useRef(new Map());
  const remoteAudioRef = useRef(new Map());
  const iceQueueRef = useRef(new Map());
  const activeRoomRef = useRef(null);
  const memberIdsRef = useRef(new Set());
  const mutedRef = useRef(false);
  const processingRef = useRef(false);

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}/api/blabbers${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Blabbers request failed.");
    return data;
  }, [token]);

  const loadRooms = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const data = await api("/");
      setRooms(data.blabbers || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api, token]);

  useEffect(() => { loadRooms(); }, [loadRooms]);
  useEffect(() => {
    const timer = window.setInterval(loadRooms, 7000);
    return () => window.clearInterval(timer);
  }, [loadRooms]);

  const sendSignal = useCallback(async (roomId, toUserId, type, payload) => {
    await api(`/${roomId}/signals`, {
      method: "POST",
      body: JSON.stringify({ toUserId, type, payload }),
    });
  }, [api]);

  const ensurePeer = useCallback((peerId) => {
    if (peersRef.current.has(peerId)) return peersRef.current.get(peerId);
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    const stream = streamRef.current;
    if (stream) stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    pc.onicecandidate = (event) => {
      if (event.candidate && activeRoomRef.current) {
        sendSignal(activeRoomRef.current.id, peerId, "ice", event.candidate.toJSON()).catch(console.warn);
      }
    };
    pc.ontrack = (event) => {
      let audio = remoteAudioRef.current.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.playsInline = true;
        remoteAudioRef.current.set(peerId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(pc.connectionState)) {
        pc.close();
        peersRef.current.delete(peerId);
      }
    };
    peersRef.current.set(peerId, pc);
    return pc;
  }, [sendSignal]);

  const handleSignal = useCallback(async (signal) => {
    const pc = ensurePeer(signal.fromUserId);
    if (signal.type === "offer") {
      await pc.setRemoteDescription(signal.payload);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await sendSignal(activeRoomRef.current.id, signal.fromUserId, "answer", pc.localDescription.toJSON());
    } else if (signal.type === "answer") {
      if (pc.signalingState === "have-local-offer") await pc.setRemoteDescription(signal.payload);
    } else if (signal.type === "ice") {
      if (pc.remoteDescription) await pc.addIceCandidate(signal.payload);
      else {
        const queue = iceQueueRef.current.get(signal.fromUserId) || [];
        queue.push(signal.payload);
        iceQueueRef.current.set(signal.fromUserId, queue);
      }
    } else if (signal.type === "renegotiate" && pc.signalingState === "stable") {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal(activeRoomRef.current.id, signal.fromUserId, "offer", pc.localDescription.toJSON());
    }
    if (pc.remoteDescription) {
      const queue = iceQueueRef.current.get(signal.fromUserId) || [];
      for (const candidate of queue) await pc.addIceCandidate(candidate).catch(() => {});
      iceQueueRef.current.delete(signal.fromUserId);
    }
  }, [ensurePeer, sendSignal]);

  const syncMembers = useCallback(async (room) => {
    const data = await api(`/${room.id}/members`);
    const nextMembers = data.members || [];
    setMembers(nextMembers);
    const nextIds = new Set(nextMembers.map((m) => m.id));
    for (const [peerId, pc] of peersRef.current.entries()) {
      if (!nextIds.has(peerId)) {
        pc.close();
        peersRef.current.delete(peerId);
        const audio = remoteAudioRef.current.get(peerId);
        if (audio) { audio.srcObject = null; remoteAudioRef.current.delete(peerId); }
      }
    }
    const previous = memberIdsRef.current;
    memberIdsRef.current = nextIds;
    for (const member of nextMembers) {
      if (member.id === userId || member.id < userId || peersRef.current.has(member.id)) continue;
      const pc = ensurePeer(member.id);
      if (pc.signalingState === "stable") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await sendSignal(room.id, member.id, "offer", pc.localDescription.toJSON());
      }
    }
    for (const member of nextMembers) {
      if (member.id !== userId && !previous.has(member.id) && member.id > userId && peersRef.current.has(member.id)) {
        await sendSignal(room.id, member.id, "renegotiate", {}).catch(() => {});
      }
    }
  }, [api, ensurePeer, sendSignal, userId]);

  const enterRoom = async (room) => {
    if (!loggedInUser || !token) { onLogin(); return; }
    setBusy(true); setError("");
    try {
      await api(`/${room.id}/join`, { method: "POST", body: JSON.stringify({}) });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      stream.getAudioTracks().forEach((track) => { track.enabled = !mutedRef.current; });
      setMicReady(true);
      setActiveRoom(room);
      activeRoomRef.current = room;
      await syncMembers(room);
      await loadRooms();
    } catch (e) {
      setError(e.name === "NotAllowedError" ? "Microphone access was denied. Allow microphone access and try again." : e.message || "Could not join this Blabber.");
      if (room.isMember) await api(`/${room.id}/leave`, { method: "DELETE" }).catch(() => {});
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (!activeRoom) return undefined;
    let cancelled = false;
    const poll = async () => {
      if (processingRef.current || cancelled || !activeRoomRef.current) return;
      processingRef.current = true;
      try {
        const data = await api(`/${activeRoom.id}/signals`);
        for (const signal of data.signals || []) {
          if (cancelled) break;
          try { await handleSignal(signal); } catch (e) { console.warn("Blabber signal error", e); }
        }
        await syncMembers(activeRoom);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally { processingRef.current = false; }
    };
    poll();
    const timer = window.setInterval(poll, 1200);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [activeRoom, api, handleSignal, syncMembers]);

  const leaveRoom = async () => {
    const room = activeRoomRef.current;
    activeRoomRef.current = null;
    setActiveRoom(null); setMembers([]); setMicReady(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();
    remoteAudioRef.current.forEach((audio) => { audio.pause(); audio.srcObject = null; });
    remoteAudioRef.current.clear();
    iceQueueRef.current.clear();
    if (room) await api(`/${room.id}/leave`, { method: "DELETE" }).catch((e) => setError(e.message));
    await loadRooms();
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    peersRef.current.forEach((pc) => pc.close());
    remoteAudioRef.current.forEach((audio) => { audio.pause(); audio.srcObject = null; });
  }, []);

  const createRoom = async (event) => {
    event.preventDefault();
    if (!loggedInUser || !token) { onLogin(); return; }
    setBusy(true); setError("");
    try {
      const invitees = createInvites.split(/[ ,\n]+/).map((name) => name.replace(/^@/, "")).filter(Boolean);
      const data = await api("/", {
        method: "POST",
        body: JSON.stringify({ name: roomName.trim(), visibility, invitees }),
      });
      setRoomName(""); setCreateInvites(""); setShowCreate(false);
      await loadRooms();
      await enterRoom(data.blabber);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const invite = async (event) => {
    event.preventDefault();
    if (!activeRoom || !inviteUsername.trim()) return;
    try {
      const data = await api(`/${activeRoom.id}/invites`, {
        method: "POST",
        body: JSON.stringify({ usernames: inviteUsername.split(/[ ,\n]+/).map((name) => name.replace(/^@/, "")).filter(Boolean) }),
      });
      setError(data.invited.length ? `Invited: ${data.invited.map((name) => "@" + name).join(", ")}` : "No matching users were invited.");
      setInviteUsername("");
      await loadRooms();
    } catch (e) { setError(e.message); }
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !next; });
  };

  if (activeRoom) {
    const currentRoom = rooms.find((room) => room.id === activeRoom.id) || activeRoom;
    return <section className="blabbers-page">
      <div className="blabbers-room-top">
        <button className="blabber-secondary" onClick={leaveRoom}>← Leave room</button>
        <div><span className="blabber-live-dot" /> <strong>{activeRoom.name}</strong> <span className="blabber-visibility">{activeRoom.visibility}</span></div>
      </div>
      <p className="blabber-subtitle">You're in the Blabber. Keep it friendly, keep it loud.</p>
      {error && <div className="blabber-notice" role="status">{error}</div>}
      <div className="blabber-member-grid">
        {members.map((member) => <div className="blabber-member" key={member.id}>
          <div className="blabber-avatar">{(member.displayName || member.username).slice(0, 1).toUpperCase()}</div>
          <strong>{member.displayName || member.username}</strong>
          <span>@{member.username}{member.id === userId ? " · You" : ""}</span>
          {member.id === userId && <small>{muted ? "Microphone muted" : micReady ? "Microphone on" : "Connecting microphone…"}</small>}
        </div>)}
      </div>
      <div className="blabber-controls">
        <button className={muted ? "blabber-danger" : "blabber-primary"} onClick={toggleMute} disabled={!micReady}>{muted ? "Unmute microphone" : "Mute microphone"}</button>
        <button className="blabber-secondary" onClick={leaveRoom}>Leave Blabber</button>
      </div>
      {activeRoom.visibility === "private" && <form className="blabber-invite-form" onSubmit={invite}>
        <label htmlFor="blabber-invite">Invite Woosh users</label>
        <div><input id="blabber-invite" value={inviteUsername} onChange={(e) => setInviteUsername(e.target.value)} placeholder="@username, another_user" /><button type="submit">Invite</button></div>
      </form>}
      <p className="blabber-footnote">Voice is peer-to-peer WebRTC. Microphone permission is required; mute disables your outgoing audio track.</p>
    </section>;
  }

  return <section className="blabbers-page">
    <div className="blabbers-heading"><div><h1>Blabbers</h1><p>Drop in, yap away, leave whenever.</p></div><button className="blabber-primary" onClick={() => loggedInUser ? setShowCreate((v) => !v) : onLogin()}>{showCreate ? "Cancel" : "+ Create a Blabber"}</button></div>
    {error && <div className="blabber-notice" role="status">{error}</div>}
    {showCreate && <form className="blabber-create-card" onSubmit={createRoom}>
      <h2>Start a Blabber</h2>
      <label htmlFor="blabber-name">Room name</label>
      <input id="blabber-name" value={roomName} maxLength={60} onChange={(e) => setRoomName(e.target.value)} placeholder="the yap shack" required />
      <label htmlFor="blabber-visibility">Who can join?</label>
      <select id="blabber-visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="public">Public — anyone can join</option><option value="private">Private — invitation only</option></select>
      {visibility === "private" && <><label htmlFor="blabber-create-invites">Invite usernames now (optional)</label><input id="blabber-create-invites" value={createInvites} onChange={(e) => setCreateInvites(e.target.value)} placeholder="@friend, another_user" /></>}
      <button className="blabber-primary" disabled={busy} type="submit">{busy ? "Starting…" : "Create and join"}</button>
    </form>}
    <div className="blabber-section-title"><h2>Your Blabbers</h2><span>Rooms you're in or invited to</span></div>
    {loading ? <p className="blabber-empty">Loading Blabbers…</p> : rooms.filter((room) => room.isMember || room.invited).length === 0 ? <p className="blabber-empty">You're not in any Blabbers yet. Create one or join a public room below.</p> : <div className="blabber-list">
      {rooms.filter((room) => room.isMember || room.invited).map((room) => <article className="blabber-card" key={room.id}>
        <div><span className="blabber-visibility">{room.visibility}</span><h3>{room.name}</h3><p>Hosted by @{room.ownerUsername} · {room.memberCount} {room.memberCount === 1 ? "person" : "people"}</p></div>
        <button className="blabber-primary" disabled={busy} onClick={() => enterRoom(room)}>{room.isMember ? "Enter" : "Accept invite & join"}</button>
      </article>)}
    </div>}
    <div className="blabber-section-title"><h2>Public Blabbers</h2><span>Open rooms to join</span></div>
    {loading ? <p className="blabber-empty">Loading public rooms…</p> : rooms.filter((room) => room.visibility === "public" && !room.isMember).length === 0 ? <p className="blabber-empty">No public Blabbers to join right now. Start one?</p> : <div className="blabber-list">
      {rooms.filter((room) => room.visibility === "public" && !room.isMember).map((room) => <article className="blabber-card" key={room.id}>
        <div><span className="blabber-visibility">public</span><h3>{room.name}</h3><p>Hosted by @{room.ownerUsername} · {room.memberCount} {room.memberCount === 1 ? "person" : "people"}</p></div>
        <button className="blabber-primary" disabled={busy} onClick={() => enterRoom(room)}>Join</button>
      </article>)}
    </div>}
  </section>;
}
