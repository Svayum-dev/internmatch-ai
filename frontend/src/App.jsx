
import { useEffect, useState } from "react";
import {
  Activity, ArrowRight, Bell, Bookmark, BriefcaseBusiness,
  CheckCircle2, Clock3, ExternalLink, FileUser, LayoutDashboard,
  MapPin, Search, Settings, Sparkles, Target, Upload, RefreshCw,
  AlertCircle, Globe, BrainCircuit, FileText, X,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const platforms = [
  { id: "remotive", label: "Remotive", mode: "Live API" },
  { id: "internshala", label: "Internshala", mode: "Website search" },
  { id: "indeed", label: "Indeed", mode: "Website search" },
];

function App() {
  const [query, setQuery] = useState("machine learning internship");
  const [search, setSearch] = useState("machine learning internship");
  const [activePlatform, setActivePlatform] = useState("remotive");
  const [jobs, setJobs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [resumeName, setResumeName] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeReady, setResumeReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [matches, setMatches] = useState({});
  const [matchingId, setMatchingId] = useState(null);
  const [showResumeDetails, setShowResumeDetails] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => {
        if (!r.ok) throw new Error("Backend unavailable");
        return r.json();
      })
      .then((data) =>
        setApiStatus(data.status === "healthy" ? "Connected" : "Unavailable")
      )
      .catch(() => setApiStatus("Offline"));

    fetchJobs("machine learning internship");
  }, []);

  async function fetchJobs(term) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/jobs?q=${encodeURIComponent(term)}&limit=20`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Job search failed.");
      }

      setJobs(data.jobs || []);
      setSearch(term);
      setApiStatus("Connected");
    } catch (err) {
      setJobs([]);
      setError(
        err.message === "Failed to fetch"
          ? "Cannot reach the backend. Make sure FastAPI is running."
          : err.message
      );
      setApiStatus("Offline");
    } finally {
      setLoading(false);
    }
  }

  async function uploadResume(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setResumeError("Please choose a PDF resume.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError("Your PDF must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setResumeLoading(true);
    setResumeError("");
    setResumeReady(false);
    setMatches({});

    try {
      const response = await fetch(`${API_URL}/api/resume/analyze`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume analysis failed.");
      }

      setResumeName(file.name);
      setResumeText(data.resume_text || "");
      setResumeSkills(data.skills || []);
      setResumeReady(true);
      setShowResumeDetails(true);
    } catch (err) {
      setResumeError(
        err.message === "Failed to fetch"
          ? "Could not connect to the backend."
          : err.message
      );
    } finally {
      setResumeLoading(false);
    }
  }

  async function calculateJobMatch(job) {
    if (!resumeReady || !resumeText) {
      setResumeError("Upload and analyze your PDF resume first.");
      setShowResumeDetails(true);
      return;
    }

    setMatchingId(job.id);
    setError("");

    try {
      const jobText = [
        job.title,
        job.company,
        job.category,
        job.job_type,
        job.location,
        job.description,
      ].filter(Boolean).join("\n");

      const response = await fetch(`${API_URL}/api/jobs/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_text: jobText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not calculate the match.");
      }

      setMatches((current) => ({ ...current, [job.id]: data }));
    } catch (err) {
      setError(err.message || "Could not calculate the match.");
    } finally {
      setMatchingId(null);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    const term = query.trim();

    if (term.length < 2) {
      setError("Enter at least two characters to search.");
      return;
    }

    setSearch(term);
    setMatches({});
    setError("");

    if (activePlatform === "remotive") {
      fetchJobs(term);
    }
  }

  function externalUrl(platform) {
    const term = (search || query || "internship").trim();

    if (platform === "internshala") {
      const slug = encodeURIComponent(term).replace(/%20/g, "-");
      return `https://internshala.com/internships/keywords-${slug}/`;
    }

    return `https://in.indeed.com/jobs?q=${encodeURIComponent(term)}&l=India`;
  }

  function toggleSaved(id) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((savedId) => savedId !== id)
        : [...current, id]
    );
  }

  const isExternal = activePlatform !== "remotive";
  const currentPlatform = platforms.find((p) => p.id === activePlatform);

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
            onClick={() => document.querySelector(".jobs-section")?.scrollIntoView({ behavior: "smooth" })}
          >
            <Search size={18} /> Find opportunities
          </button>
          <button
            className="nav-item"
            type="button"
            onClick={() => document.querySelector(".resume-panel")?.scrollIntoView({ behavior: "smooth" })}
          >
            <FileUser size={18} /> Resume analysis
          </button>
          <button
            className="nav-item"
            type="button"
            onClick={() => document.querySelector(".jobs-section")?.scrollIntoView({ behavior: "smooth" })}
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
              <span>{resumeReady ? "Resume analyzed" : "Build your career"}</span>
            </div>
            <Settings size={17} />
          </div>
          <div className="sidebar-help">
            <CheckCircle2 size={16} /> AI career studio · v0.4
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
            <button className="icon-button" type="button" aria-label="Notifications">
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
                Discover opportunities and compare them with your resume using AI.
              </p>
            </div>

            <label className="resume-button">
              <Upload size={17} />
              {resumeLoading ? "Analyzing..." : resumeReady ? "Change resume" : "Upload resume"}
              <input
                type="file"
                accept=".pdf,application/pdf"
                disabled={resumeLoading}
                onChange={(event) => {
                  uploadResume(event.target.files?.[0]);
                  event.target.value = "";
                }}
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
            <div className="location-field"><MapPin size={18} /> India / Remote</div>
            <button className="search-button" type="submit" disabled={loading}>
              {loading && !isExternal ? "Searching..." : "Search jobs"}
              {loading && !isExternal ? <RefreshCw size={17} /> : <ArrowRight size={17} />}
            </button>
          </form>

          {resumeError && (
            <div className="notice error-notice">
              <AlertCircle size={18} />
              <span>{resumeError}</span>
              <button type="button" onClick={() => setResumeError("")} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          )}

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top"><span>Live Remotive results</span><BriefcaseBusiness size={19} /></div>
              <strong>{loading ? "…" : jobs.length}</strong>
              <small>Results for the current search</small>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Active platform</span><Globe size={19} /></div>
              <strong className="profile-status">{currentPlatform?.label}</strong>
              <small>{currentPlatform?.mode}</small>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Saved jobs</span><Bookmark size={19} /></div>
              <strong>{saved.length}</strong>
              <small>Saved in this session</small>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span>Resume status</span><FileUser size={19} /></div>
              <strong className="profile-status">{resumeReady ? "Analyzed" : "Not uploaded"}</strong>
              <small>{resumeReady ? `${resumeSkills.length} detected skills` : "Choose a PDF resume"}</small>
            </article>
          </section>

          <section className="resume-panel">
            <div className="resume-panel-heading">
              <div className="resume-heading-icon"><BrainCircuit size={22} /></div>
              <div className="resume-heading-copy">
                <h2>AI resume analysis</h2>
                <p>
                  {resumeReady
                    ? `Analyzed ${resumeName}. Your extracted skills are ready for matching.`
                    : "Upload your PDF to extract skills and compare your profile against jobs."}
                </p>
              </div>
              {resumeReady && (
                <span className="ready-badge"><CheckCircle2 size={14} /> Ready</span>
              )}
            </div>

            {resumeLoading && (
              <div className="inline-loading"><RefreshCw size={18} /> Reading and analyzing your PDF…</div>
            )}

            {resumeReady && (
              <>
                <div className="skill-tags resume-skill-tags">
                  {resumeSkills.length > 0
                    ? resumeSkills.map((skill) => <span key={skill}>{skill}</span>)
                    : <span>No known skills detected. You can still use semantic matching.</span>}
                </div>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setShowResumeDetails((current) => !current)}
                >
                  {showResumeDetails ? "Hide resume details" : "Show resume details"}
                </button>
                {showResumeDetails && (
                  <div className="resume-details">
                    <FileText size={16} />
                    <span>{resumeName}</span>
                    <span>{resumeText.length.toLocaleString()} characters extracted</span>
                  </div>
                )}
              </>
            )}

            {!resumeReady && !resumeLoading && (
              <div className="resume-empty">
                <FileUser size={22} />
                <span>Your resume stays in memory for this session and is not saved by this API.</span>
              </div>
            )}
          </section>

          <section className="jobs-section">
            <div className="section-heading">
              <div>
                <h2>Explore job platforms</h2>
                <p>Search listings by source, then compare Remotive jobs against your resume.</p>
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
                  <span className="platform-mode">{platform.mode}</span>
                </button>
              ))}
            </div>

            {isExternal ? (
              <div className="platform-search-card">
                <div className="platform-icon"><Globe size={25} /></div>
                <div className="platform-search-content">
                  <h3>Search {currentPlatform?.label}</h3>
                  <p>
                    Search phrase: <strong>{search || query || "internship"}</strong>.
                    This opens the platform's own search results. Listings are not
                    imported into InternMatch AI, so in-app AI matching isn't available
                    for these results yet.
                  </p>
                  <a className="apply-button" href={externalUrl(activePlatform)} target="_blank" rel="noopener noreferrer">
                    Open {currentPlatform?.label} search <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ) : (
              <>
                <p className="source-label">
                  Remotive public API · Remote listings · Verify eligibility and availability on the original listing.
                </p>

                {error && (
                  <div className="empty-state">
                    <AlertCircle size={28} />
                    <h3>Something went wrong</h3>
                    <p>{error}</p>
                    <button className="search-button" type="button" onClick={() => fetchJobs(search)}>
                      Try again <RefreshCw size={16} />
                    </button>
                  </div>
                )}

                {loading && (
                  <div className="empty-state">
                    <RefreshCw size={28} />
                    <h3>Finding opportunities…</h3>
                    <p>Fetching results from Remotive.</p>
                  </div>
                )}

                {!loading && !error && (
                  <div className="job-list">
                    {jobs.map((job) => {
                      const match = matches[job.id];

                      return (
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
                              <p className="job-description"><strong>Salary:</strong> {job.salary}</p>
                            )}

                            {job.description && (
                              <p className="job-description">
                                {job.description.length > 260
                                  ? `${job.description.slice(0, 260)}…`
                                  : job.description}
                              </p>
                            )}

                            {match && (
                              <div className="match-result">
                                <div className="match-result-top">
                                  <span><BrainCircuit size={16} /> Resume similarity</span>
                                  <strong>{match.match_score}%</strong>
                                </div>
                                <div className="match-track">
                                  <div className="match-fill" style={{ width: `${match.match_score}%` }} />
                                </div>
                                <p>Detected skills in your resume: {match.resume_skills?.length || 0}</p>
                                <div className="match-skill-group">
                                  <strong>Skills found in listing</strong>
                                  <div className="skill-tags">
                                    {(match.job_skills || []).map((skill) => (
                                      <span key={skill}>{skill}</span>
                                    ))}
                                    {(!match.job_skills || match.job_skills.length === 0) && <span>No known skills detected</span>}
                                  </div>
                                </div>
                                <div className="match-skill-group">
                                  <strong>Potential skills to develop</strong>
                                  <div className="skill-tags missing-tags">
                                    {(match.missing_skills || []).map((skill) => (
                                      <span key={skill}>{skill}</span>
                                    ))}
                                    {(!match.missing_skills || match.missing_skills.length === 0) && <span>No missing skills detected by this basic skill scan</span>}
                                  </div>
                                </div>
                                <small className="match-disclaimer">
                                  Similarity is not a probability of getting hired. Skill detection uses a limited vocabulary.
                                </small>
                              </div>
                            )}

                            <div className="skill-tags">
                              <span>{job.category || "General"}</span>
                              <span>Remotive</span>
                            </div>
                            <span className="source-label">Source: Remotive · Check original listing for details</span>
                          </div>

                          <div className="job-side">
                            {resumeReady ? (
                              <button
                                className="match-button"
                                type="button"
                                disabled={matchingId === job.id}
                                onClick={() => calculateJobMatch(job)}
                              >
                                <BrainCircuit size={16} />
                                {matchingId === job.id
                                  ? "Matching…"
                                  : match ? "Recalculate" : "Calculate match"}
                              </button>
                            ) : (
                              <button
                                className="save-button"
                                type="button"
                                onClick={() => {
                                  setResumeError("Upload your PDF resume above to calculate job matches.");
                                  document.querySelector(".resume-panel")?.scrollIntoView({ behavior: "smooth" });
                                }}
                              >
                                <Upload size={16} /> Upload resume first
                              </button>
                            )}

                            <button
                              className={`save-button ${saved.includes(job.id) ? "saved" : ""}`}
                              type="button"
                              onClick={() => toggleSaved(job.id)}
                            >
                              <Bookmark size={16} />
                              {saved.includes(job.id) ? "Saved" : "Save job"}
                            </button>

                            <a className="apply-button" href={job.url} target="_blank" rel="noopener noreferrer">
                              View listing <ExternalLink size={15} />
                            </a>
                          </div>
                        </article>
                      );
                    })}

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
            <span><Activity size={14} /> {apiStatus} · Similarity scores are estimates</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
