import { useEffect, useState } from "react";
import "./Explore.css";

const API_URL = "https://woosh-api.duckdns.org";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(String(value).replace(" ", "T") + (String(value).endsWith("Z") ? "" : "Z"));
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function Explore({ apiFetch, openProfile, loggedInUser }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Top");
  const [exploreData, setExploreData] = useState({ hashtags: [], popularWooshes: [], recentUsers: [] });
  const [results, setResults] = useState({ users: [], wooshes: [], hashtags: [] });
  const [searched, setSearched] = useState(false);
  const [loadingExplore, setLoadingExplore] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState("");

  const loadExplore = async () => {
    try {
      setLoadingExplore(true);
      setError("");
      const data = await apiFetch("/api/explore");
      setExploreData({
        hashtags: data.hashtags || [],
        popularWooshes: data.popularWooshes || [],
        recentUsers: data.recentUsers || [],
      });
    } catch (err) {
      setError(err.message || "Could not load Explore.");
    } finally {
      setLoadingExplore(false);
    }
  };

  useEffect(() => { loadExplore(); }, []);

  const runSearch = async (event, nextQuery = query) => {
    if (event) event.preventDefault();
    const cleanQuery = nextQuery.trim();
    setQuery(cleanQuery);
    if (!cleanQuery) {
      setSearched(false);
      setResults({ users: [], wooshes: [], hashtags: [] });
      setError("");
      return;
    }
    try {
      setLoadingSearch(true);
      setSearched(true);
      setError("");
      const data = await apiFetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`);
      setResults({ users: data.users || [], wooshes: data.wooshes || [], hashtags: data.hashtags || [] });
      setActiveTab("Top");
    } catch (err) {
      setError(err.message || "Search failed. Please try again.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const selectHashtag = (tag) => {
    const nextQuery = `#${tag}`;
    setQuery(nextQuery);
    runSearch(null, nextQuery);
  };

  const tabs = ["Top", "People", "Posts", "Tags"];
  const visibleUsers = activeTab === "Top" || activeTab === "People" ? results.users : [];
  const visibleWooshes = activeTab === "Top" || activeTab === "Posts" ? results.wooshes : [];
  const visibleTags = activeTab === "Top" || activeTab === "Tags" ? results.hashtags : [];

  const renderUser = (user) => (
    <button className="explore-user" key={user.id} onClick={() => openProfile(user.username)}>
      <span className="explore-avatar">{(user.displayName || user.username || "?").slice(0, 1).toUpperCase()}</span>
      <span className="explore-user-copy">
        <strong>{user.displayName || user.username}</strong>
        <span>@{user.username}</span>
        {user.bio && <small>{user.bio}</small>}
      </span>
      <span className="explore-user-count">{user.postCount || 0} Wooshes</span>
    </button>
  );

  const renderWoosh = (post) => (
    <article className="explore-post" key={post.id}>
      <button className="explore-post-author" onClick={() => openProfile(post.username)}>
        <span className="explore-avatar">{(post.displayName || post.username || "?").slice(0, 1).toUpperCase()}</span>
        <span><strong>{post.displayName || post.username}</strong><small>@{post.username}</small></span>
      </button>
      <time>{formatDate(post.createdAt)}</time>
      {post.text && <p className="explore-post-text">{post.text.split(/(#[a-zA-Z0-9_]+)/g).map((part, index) => part.startsWith("#") ? <button className="explore-inline-tag" key={index} onClick={() => selectHashtag(part.slice(1))}>{part}</button> : part)}</p>}
      {post.image && <img className="explore-post-image" src={post.image.startsWith("http") ? post.image : `${API_URL}${post.image}`} alt="Post attachment" loading="lazy" />}
      <div className="explore-post-stats"><span>{post.likeCount || 0} likes</span><span>{post.commentCount || 0} comments</span></div>
    </article>
  );

  return (
    <section className="explore-page">
      <div className="explore-heading"><div><p className="explore-eyebrow">DISCOVER WOOSH</p><h1>Explore</h1><p>Find people, posts, and topics worth following.</p></div></div>
      <form className="explore-search" onSubmit={(event) => runSearch(event)}>
        <span aria-hidden="true" className="explore-search-icon">⌕</span>
        <input aria-label="Search Woosh" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, posts, or #hashtags" maxLength={100} />
        {query && <button type="button" className="explore-clear" onClick={() => { setQuery(""); setSearched(false); setResults({ users: [], wooshes: [], hashtags: [] }); }}>Clear</button>}
        <button type="submit" className="explore-search-button" disabled={loadingSearch}>{loadingSearch ? "Searching…" : "Search"}</button>
      </form>
      {error && <p className="explore-error" role="alert">{error}</p>}
      {searched ? (
        <div className="explore-results">
          <div className="explore-results-heading"><h2>Results for <span>{query}</span></h2><span>{results.users.length + results.wooshes.length + results.hashtags.length} results</span></div>
          <div className="explore-tabs" role="tablist" aria-label="Search result types">
            {tabs.map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
          </div>
          {loadingSearch ? <div className="explore-empty">Searching Woosh…</div> : (
            <>
              {visibleTags.length > 0 && <section className="explore-result-section"><h3>Topics</h3>{visibleTags.map((item) => <button className="explore-tag-row" key={item.tag} onClick={() => selectHashtag(item.tag)}><span className="explore-tag-symbol">#</span><span><strong>#{item.tag}</strong><small>{item.postCount} {item.postCount === 1 ? "post" : "posts"}</small></span><span className="explore-chevron">›</span></button>)}</section>}
              {visibleUsers.length > 0 && <section className="explore-result-section"><h3>People</h3>{visibleUsers.map(renderUser)}</section>}
              {visibleWooshes.length > 0 && <section className="explore-result-section"><h3>Posts</h3>{visibleWooshes.map(renderWoosh)}</section>}
              {visibleTags.length + visibleUsers.length + visibleWooshes.length === 0 && <div className="explore-empty"><h3>No results found</h3><p>Try another username, phrase, or hashtag.</p></div>}
            </>
          )}
        </div>
      ) : (
        <>
          <section className="explore-section">
            <div className="explore-section-heading"><div><h2>Trending topics</h2><p>Hashtags showing up across recent Wooshes.</p></div></div>
            {loadingExplore ? <div className="explore-loading">Loading topics…</div> : exploreData.hashtags.length ? <div className="explore-tag-list">{exploreData.hashtags.map((item, index) => <button className="explore-trending-tag" key={item.tag} onClick={() => selectHashtag(item.tag)}><span className="explore-tag-rank">{String(index + 1).padStart(2, "0")}</span><span><strong>#{item.tag}</strong><small>{item.postCount} {item.postCount === 1 ? "post" : "posts"}</small></span><span className="explore-chevron">›</span></button>)}</div> : <div className="explore-empty compact"><h3>No trending topics yet</h3><p>When people use hashtags in Wooshes, they’ll show up here.</p></div>}
          </section>
          <section className="explore-section">
            <div className="explore-section-heading"><div><h2>Popular Wooshes</h2><p>Posts getting attention from the community.</p></div></div>
            {loadingExplore ? <div className="explore-loading">Loading posts…</div> : exploreData.popularWooshes.length ? <div className="explore-post-list">{exploreData.popularWooshes.map(renderWoosh)}</div> : <div className="explore-empty compact"><h3>Nothing here yet</h3><p>Be the first to share something with the community.</p></div>}
          </section>
          <section className="explore-section">
            <div className="explore-section-heading"><div><h2>People to discover</h2><p>Recently joined the Woosh community.</p></div></div>
            {loadingExplore ? <div className="explore-loading">Loading people…</div> : exploreData.recentUsers.filter((user) => user.username?.toLowerCase() !== loggedInUser?.toLowerCase()).length ? <div className="explore-user-list">{exploreData.recentUsers.filter((user) => user.username?.toLowerCase() !== loggedInUser?.toLowerCase()).map(renderUser)}</div> : <div className="explore-empty compact"><h3>No people to show yet</h3><p>Check back as more people join.</p></div>}
          </section>
        </>
      )}
    </section>
  );
}

export default Explore;
