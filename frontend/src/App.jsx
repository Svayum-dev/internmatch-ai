
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileUser,
  LayoutDashboard,
  MapPin,
  Search,
  Settings,
  Sparkles,
  Target,
  Upload,
  RefreshCw,
  AlertCircle,
  Globe,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const platforms = [
  { id: "remotive", label: "Remotive", kind: "live" },
  { id: "internshala", label: "Internshala", kind: "external" },
  { id: "indeed", label: "Indeed", kind: "external" },
];

function App() {
  const [query, setQuery] = useState("machine learning internship");
  const [search, setSearch] = useState("machine learning internship");
  const [activePlatform, setActivePlatform] = useState("remotive");
  const [jobs, setJobs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [resumeName, setResumeName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchJobs(term) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/jobs?q=${encodeURIComponent(term)}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`Job search failed (HTTP ${response.status}).`);
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setSearch(term);
      setApiStatus("Connected");
    } catch (err) {
      setJobs([]);
      setError(
        err.message === "Failed to fetch"
          ? "Cannot reach the backend. Check that FastAPI is running."
          : err.message
      );
      setApiStatus("Offline");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((response) => {
        if (!response.ok) throw new Error("Backend unavailable");
        return response.json();
      })
      .then((data) =>
        setApiStatus(data.status === "healthy" ? "Connected" : "Unavailable")
      )
      .catch(() => setApiStatus("Offline"));

    fetchJobs("machine learning internship");
  }, []);

  function handleSearch(event) {
    event.preventDefault();

    const term = query.trim();
    if (term.length < 2) {
      setError("Enter at least two characters.");
      return;
    }

    setSearch(term);

    if (activePlatform === "remotive") {
      fetchJobs(term);
    } else {
      setError("");
    }
  }

  function getExternalSearchUrl(platform) {
    const term = encodeURIComponent(search || query || "internship");

    if (platform === "internshala") {
      return `https://internshala.com/internships/keywords-${encodeURIComponent(search || query || "internship").replace(/%20/g, "-")}/`;
    }

    return `https://in.indeed.com/jobs?q=${term}&l=India`;
  }

  function toggleSaved(id) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((jobId) => jobId !== id)
        : [...current, id]
    );
  }

  const externalPlatform = activePlatform !== "remotive";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-mark"><Target size={23} /></span>
          <span>
            <strong>InternMatch AI</strong>
            <small>AI CAREER STUDIO</small>
          </span>
        </a>

        <p className="workspace-label">WORKSPACE</p>

        <nav className="side-nav">
          <button className="nav-item active" type="button">
            <LayoutDashboard size={18} /> Overview
          </button>
          <button
            className="nav-item"
            type="button"
            onClick={() =>
              document.querySelector(".jobs-section")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Search size={18} /> Find opportunities
          </button>
          <button className="nav-item" type="button">
            <FileUser size={18} /> Resume analysis
          </button>
          <button
            className="nav-item"
            type="button"
            onClick={() =>
              document.querySelector(".jobs-section")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <BriefcaseBusiness size={18} /> Saved jobs
            {saved.length > 0 && <span className="nav-count">{saved.length}</span>}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="profile-avatar">IM</div>
            <div className="profile-text">
              <strong>Your profile</strong>
              <span>Build your career</span>
            </div>
            <Settings size={17} />
          </div>
          <div className="sidebar-help">
            <CheckCircle2 size={16} /> Multi-platform search · v0.3
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs">Workspace / <strong>Overview</strong></div>
          <div className="topbar-actions">
            <span className={`connection ${apiStatus === "Connected" ? "connected" : ""}`}>
              <span className="status-dot" /> API {apiStatus}
            </span>
            <button className="icon-button" aria-label="Notifications" type="button">
              <Bell size={19} />
            </button>
            <div className="top-avatar">IM</div>
          </div>
        </header>

        <div className="content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <Sparkles size={15} /> YOUR AI CAREER ASSISTANT
              </div>
              <h1>Find work that fits <span>your potential.</span></h1>
              <p className="subtitle">
                Search opportunities across multiple job platforms from one workspace.
              </p>
            </div>

            <label className="resume-button">
              <Upload size={17} />
              {resumeName ? "Resume selected" : "Choose resume"}
              <input
                type="file"
                accept=".pdf"
                onChange={(event) =>
                  setResumeName(event.target.files?.[0]?.name || "")
                }
              />
            </label>
          </section>

          <form className="search-panel" onSubmit={handleSearch}>
            <div className="search-field">
              <Search size={20} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search internships, Python, AI, data science..."
              />
            </div>
            <div className="search-divider" />
            <div className="location-field">
              <MapPin size={18} /> India / Remote
            </div>
            <button className="search-button" type="submit" disabled={loading}>
              {loading && activePlatform === "remotive" ? "Searching..." : "Search jobs"}
              {loading && activePlatform === "remotive"
                ? <RefreshCw size={17} />
                : <ArrowRight size={17} />}
            </button>
          </form>

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span>Remotive results</span><BriefcaseBusiness size={19} />
              </div>
              <strong>{loading ? "…" : jobs.length}</strong>
              <small>Live API results for the current query</small>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Active platform</span><Globe size={19} />
              </div>
              <strong className="profile-status">
                {platforms.find((p) => p.id === activePlatform)?.label}
              </strong>
              <small>Selected source</small>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Saved jobs</span><Bookmark size={19} />
              </div>
              <strong>{saved.length}</strong>
              <small>Saved in this session</small>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Resume status</span><FileUser size={19} />
              </div>
              <strong className="profile-status">
                {resumeName ? "Selected" : "Not uploaded"}
              </strong>
              <small>{resumeName || "Choose a PDF resume"}</small>
            </article>
          </section>

          <section className="jobs-section">
            <div className="section-heading">
              <div>
                <h2>Explore job platforms</h2>
                <p>Choose a source to search internships and jobs.</p>
              </div>
              <span className="demo-pill">3 PLATFORMS</span>
            </div>

            <div className="platform-tabs" role="tablist" aria-label="Job platforms">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  role="tab"
                  aria-selected={activePlatform === platform.id}
                  className={`platform-tab ${activePlatform === platform.id ? "active" : ""}`}
                  onClick={() => {
                    setActivePlatform(platform.id);
                    setError("");
                  }}
                >
                  {platform.label}
                  <span className="platform-mode">
                    {platform.kind === "live" ? "Live API" : "Website search"}
                  </span>
                </button>
              ))}
            </div>

            {externalPlatform ? (
              <div className="platform-search-card">
                <div className="platform-icon"><Globe size={25} /></div>
                <div className="platform-search-content">
                  <h3>Search {platforms.find((p) => p.id === activePlatform)?.label}</h3>
                  <p>
                    Your search is <strong>{search || query || "internship"}</strong>.
                    Open the platform to browse its current listings and apply there.
                    Results are provided by the platform itself; InternMatch AI does not
                    scrape or copy its listings.
                  </p>
                  <a
                    className="apply-button"
                    href={getExternalSearchUrl(activePlatform)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open {platforms.find((p) => p.id === activePlatform)?.label} search
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ) : (
              <>
                <p className="source-label">
                  Remotive public API · Remote listings only · Original source links are included
                </p>

                {error && (
                  <div className="empty-state">
                    <AlertCircle size={28} />
                    <h3>Couldn't load jobs</h3>
                    <p>{error}</p>
                    <button
                      className="search-button"
                      type="button"
                      onClick={() => fetchJobs(search || "internship")}
                    >
                      Try again <RefreshCw size={16} />
                    </button>
                  </div>
                )}

                {loading && (
                  <div className="empty-state">
                    <RefreshCw size={28} />
                    <h3>Finding opportunities…</h3>
                    <p>Fetching search results from Remotive.</p>
                  </div>
                )}

                {!loading && !error && (
                  <div className="job-list">
                    {jobs.map((job) => (
                      <article className="job-card" key={job.id}>
                        <div className="company-logo violet">
                          {(job.company || "CO").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="job-main">
                          <div className="company-name">{job.company}</div>
                          <h3>{job.title}</h3>
                          <div className="job-meta">
                            <span><MapPin size={14} /> {job.location || "Remote"}</span>
                            <span><Clock3 size={14} /> {job.job_type || "Not specified"}</span>
                          </div>
                          {job.salary && job.salary !== "Not specified" && (
                            <p className="job-description">
                              <strong>Salary:</strong> {job.salary}
                            </p>
                          )}
                          {job.description && (
                            <p className="job-description">
                              {job.description.length > 260
                                ? `${job.description.slice(0, 260)}…`
                                : job.description}
                            </p>
                          )}
                          <div className="skill-tags">
                            <span>{job.category || "General"}</span>
                            <span>Remotive</span>
                          </div>
                          <span className="source-label">
                            Source: Remotive · Verify eligibility on the original listing
                          </span>
                        </div>
                        <div className="job-side">
                          <button
                            className={`save-button ${saved.includes(job.id) ? "saved" : ""}`}
                            type="button"
                            onClick={() => toggleSaved(job.id)}
                          >
                            <Bookmark size={16} />
                            {saved.includes(job.id) ? "Saved" : "Save job"}
                          </button>
                          <a
                            className="apply-button"
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View listing <ExternalLink size={15} />
                          </a>
                        </div>
                      </article>
                    ))}

                    {jobs.length === 0 && (
                      <div className="empty-state">
                        <Search size={28} />
                        <h3>No jobs found</h3>
                        <p>Try Python, AI, data science, or another keyword.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          <footer className="footer">
            <span>InternMatch AI · Applications of AI project</span>
            <span><Activity size={14} /> {apiStatus} · Verify listings at source</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
