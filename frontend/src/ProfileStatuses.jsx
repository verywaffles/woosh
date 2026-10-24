import { useEffect, useState } from "react";

const API_URL = "https://woosh-api.duckdns.org";

function formatExpiry(value) {
  if (!value) return "";
  const normalized = value.includes("T") ? value : value.replace(" ", "T") + "Z";
  const remaining = new Date(normalized).getTime() - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) return "Expiring soon";
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return hours ? `Expires in ${hours}h` : `Expires in ${Math.max(1, minutes)}m`;
}

export default function ProfileStatuses({
  currentProfile,
  loggedInUser,
  apiFetch,
  profileWooshes = [],
}) {
  const [winds, setWinds] = useState([]);
  const [drops, setDrops] = useState([]);
  const [pinnedWooshes, setPinnedWooshes] = useState([]);
  const [dropText, setDropText] = useState("");
  const [windFile, setWindFile] = useState(null);
  const [selectedWoosh, setSelectedWoosh] = useState("");
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [savingWind, setSavingWind] = useState(false);
  const [savingDrop, setSavingDrop] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [statusError, setStatusError] = useState("");

  const username = currentProfile?.username || "";
  const isOwnProfile = Boolean(
    loggedInUser && username &&
    loggedInUser.toLowerCase() === username.toLowerCase()
  );
  const pinnedIds = new Set(pinnedWooshes.map((woosh) => Number(woosh.id)));
  const pinnableWooshes = profileWooshes.filter((woosh) => !pinnedIds.has(Number(woosh.id)));

  const loadStatuses = async () => {
    if (!username) return;
    setLoadingStatuses(true);
    try {
      const [statusData, pinnedData] = await Promise.all([
        apiFetch(`/api/users/${encodeURIComponent(username)}/statuses`),
        apiFetch(`/api/users/${encodeURIComponent(username)}/pinned-wooshes`),
      ]);
      setWinds(statusData.winds || []);
      setDrops(statusData.drops || []);
      setPinnedWooshes(pinnedData.wooshes || []);
    } catch (error) {
      setStatusError(error.message || "Could not load profile statuses.");
    } finally {
      setLoadingStatuses(false);
    }
  };

  useEffect(() => {
    setWinds([]);
    setDrops([]);
    setPinnedWooshes([]);
    setStatusError("");
    loadStatuses();
    // The profile username is the resource identity; apiFetch is supplied by the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const handleWindFile = async (event) => {
    const file = event.target.files?.[0];
    setWindFile(null);
    setStatusError("");
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setStatusError("Choose a video file for your Wind.");
      event.target.value = "";
      return;
    }
    if (file.size > 35 * 1024 * 1024) {
      setStatusError("Wind videos must be 35 MB or smaller.");
      event.target.value = "";
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    try {
      const duration = await new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => resolve(video.duration);
        video.onerror = () => reject(new Error("Could not read this video's duration."));
        video.src = objectUrl;
      });
      if (!Number.isFinite(duration) || duration <= 0 || duration > 7) {
        setStatusError("Winds must be 7 seconds or shorter.");
        event.target.value = "";
        return;
      }
      setWindFile(file);
    } catch (error) {
      setStatusError(error.message || "Could not read this video's duration.");
      event.target.value = "";
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const postWind = async (event) => {
    event.preventDefault();
    if (!windFile) {
      setStatusError("Choose a video that is 7 seconds or shorter.");
      return;
    }
    setSavingWind(true);
    setStatusError("");
    try {
      const form = new FormData();
      form.append("video", windFile);
      await apiFetch("/api/winds", { method: "POST", body: form });
      setWindFile(null);
      const input = event.currentTarget.querySelector('input[type="file"]');
      if (input) input.value = "";
      await loadStatuses();
    } catch (error) {
      setStatusError(error.message || "Could not post your Wind.");
    } finally {
      setSavingWind(false);
    }
  };

  const postDrop = async (event) => {
    event.preventDefault();
    const text = dropText.trim();
    if (!text) return;
    setSavingDrop(true);
    setStatusError("");
    try {
      await apiFetch("/api/drops", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setDropText("");
      await loadStatuses();
    } catch (error) {
      setStatusError(error.message || "Could not post your Drop.");
    } finally {
      setSavingDrop(false);
    }
  };

  const deleteStatus = async (type, id) => {
    setStatusError("");
    try {
      await apiFetch(`/api/${type}/${id}`, { method: "DELETE" });
      if (type === "winds") setWinds((items) => items.filter((item) => item.id !== id));
      else setDrops((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      setStatusError(error.message || "Could not delete status.");
    }
  };

  const pinWoosh = async (event) => {
    event.preventDefault();
    if (!selectedWoosh) return;
    setSavingPin(true);
    setStatusError("");
    try {
      await apiFetch(`/api/pinned-wooshes/${selectedWoosh}`, { method: "POST" });
      setSelectedWoosh("");
      await loadStatuses();
    } catch (error) {
      setStatusError(error.message || "Could not pin that Woosh.");
    } finally {
      setSavingPin(false);
    }
  };

  const unpinWoosh = async (id) => {
    setStatusError("");
    try {
      await apiFetch(`/api/pinned-wooshes/${id}`, { method: "DELETE" });
      setPinnedWooshes((items) => items.filter((item) => Number(item.id) !== Number(id)));
    } catch (error) {
      setStatusError(error.message || "Could not unpin that Woosh.");
    }
  };

  return (
    <section className="profile-statuses">
      <div className="profile-statuses-heading">
        <div>
          <p className="profile-section-eyebrow">PROFILE UPDATES</p>
          <h2>Status</h2>
        </div>
        {loadingStatuses && <span className="profile-status-muted">Refreshing…</span>}
      </div>

      {statusError && <p className="profile-status-error" role="alert">{statusError}</p>}

      {isOwnProfile && (
        <div className="profile-status-composers">
          <form className="profile-status-composer profile-drop-composer" onSubmit={postDrop}>
            <div className="profile-status-composer-title">
              <span className="profile-status-icon profile-drop-icon">D</span>
              <div><strong>Drop</strong><small>Quick note · disappears after 24 hours</small></div>
            </div>
            <textarea
              value={dropText}
              onChange={(event) => setDropText(event.target.value.slice(0, 80))}
              maxLength={80}
              rows={2}
              placeholder="What's on your mind?"
              aria-label="Drop text"
            />
            <div className="profile-status-composer-footer">
              <span>{dropText.length}/80</span>
              <button type="submit" disabled={!dropText.trim() || savingDrop}>{savingDrop ? "Posting…" : "Post Drop"}</button>
            </div>
          </form>

          <form className="profile-status-composer profile-wind-composer" onSubmit={postWind}>
            <div className="profile-status-composer-title">
              <span className="profile-status-icon profile-wind-icon">↝</span>
              <div><strong>Wind</strong><small>Video up to 7 seconds · disappears after 12 hours</small></div>
            </div>
            <label className="profile-status-file">
              <input type="file" accept="video/mp4,video/webm,video/quicktime,video/ogg,video/x-m4v,video/3gpp" onChange={handleWindFile} />
              <span>{windFile ? windFile.name : "Choose a short video"}</span>
            </label>
            <div className="profile-status-composer-footer">
              <span>{windFile ? "Ready to upload" : "MP4, MOV, or WebM · max 35 MB"}</span>
              <button type="submit" disabled={!windFile || savingWind}>{savingWind ? "Uploading…" : "Post Wind"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="profile-status-grid">
        <section className="profile-status-lane">
          <div className="profile-status-lane-heading">
            <span className="profile-status-icon profile-wind-icon">↝</span>
            <h3>Winds</h3>
            <span className="profile-status-count">{winds.length}</span>
          </div>
          {winds.length === 0 ? (
            <p className="profile-status-empty">{isOwnProfile ? "Share a short video to start your Winds." : "No active Winds."}</p>
          ) : winds.map((wind) => (
            <article className="profile-wind-card" key={wind.id}>
              <video src={wind.videoUrl?.startsWith("http") ? wind.videoUrl : API_URL + wind.videoUrl} controls playsInline preload="metadata" />
              <div className="profile-status-card-footer">
                <span>{formatExpiry(wind.expiresAt)}</span>
                {isOwnProfile && <button type="button" onClick={() => deleteStatus("winds", wind.id)}>Delete</button>}
              </div>
            </article>
          ))}
        </section>

        <section className="profile-status-lane">
          <div className="profile-status-lane-heading">
            <span className="profile-status-icon profile-drop-icon">D</span>
            <h3>Drops</h3>
            <span className="profile-status-count">{drops.length}</span>
          </div>
          {drops.length === 0 ? (
            <p className="profile-status-empty">{isOwnProfile ? "Post a quick note for people to see." : "No active Drops."}</p>
          ) : drops.map((drop) => (
            <article className="profile-drop-card" key={drop.id}>
              <p>{drop.text}</p>
              <div className="profile-status-card-footer">
                <span>{formatExpiry(drop.expiresAt)}</span>
                {isOwnProfile && <button type="button" onClick={() => deleteStatus("drops", drop.id)}>Delete</button>}
              </div>
            </article>
          ))}
        </section>
      </div>

      <section className="profile-pinned-section">
        <div className="profile-statuses-heading">
          <div>
            <p className="profile-section-eyebrow">FEATURED POSTS</p>
            <h2>Pinned Wooshes <span className="profile-status-count">{pinnedWooshes.length}/3</span></h2>
          </div>
        </div>

        {isOwnProfile && pinnedWooshes.length < 3 && pinnableWooshes.length > 0 && (
          <form className="profile-pin-form" onSubmit={pinWoosh}>
            <select aria-label="Choose a Woosh to pin" value={selectedWoosh} onChange={(event) => setSelectedWoosh(event.target.value)}>
              <option value="">Choose one of your Wooshes…</option>
              {pinnableWooshes.map((woosh) => (
                <option key={woosh.id} value={woosh.id}>{(woosh.text || "Media Woosh").slice(0, 70)}</option>
              ))}
            </select>
            <button type="submit" disabled={!selectedWoosh || savingPin}>{savingPin ? "Pinning…" : "Pin Woosh"}</button>
          </form>
        )}

        {pinnedWooshes.length === 0 ? (
          <p className="profile-status-empty">{isOwnProfile ? "Pin up to 3 of your Wooshes here." : "No pinned Wooshes yet."}</p>
        ) : (
          <div className="profile-pinned-grid">
            {pinnedWooshes.map((woosh) => (
              <article className="profile-pinned-card" key={woosh.id}>
                <div className="profile-pinned-card-label"><span>PINNED</span>{isOwnProfile && <button type="button" onClick={() => unpinWoosh(woosh.id)}>Unpin</button>}</div>
                {woosh.text && <p>{woosh.text}</p>}
                {woosh.image && <img src={woosh.image} alt="Pinned Woosh attachment" />}
                <small>@{woosh.username}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
