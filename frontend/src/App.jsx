
import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

const initialSearch = "machine learning internship";

function formatDate(date) {
  if (!date) return "Date not provided";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function App() {
  const [activePlatform, setActivePlatform] = useState("Remotive");
  const [search, setSearch] = useState(initialSearch);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resume, setResume] = useState(null);
  const [resumeSkills, setResumeSkills] = useState([]);
  const [resumeName, setResumeName] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [matches, setMatches] = useState({});
  const [matchingJob, setMatchingJob] = useState("");
  const [savedJobs, setSavedJobs] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);

  async function fetchJobs(query = search) {
    const term = query.trim();

    if (term.length < 2) {
      setError("Enter at least two characters to search.");
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const url = new URL(`${API_BASE}/api/jobs`);
      url.searchParams.set("q", term);
      url.searchParams.set("limit", "30");

      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || "Unable to load jobs.");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setTotalMatches(data.total_matches ?? data.count ?? 0);
      setNotice(data.notice || "");
      setSearch(query);
    } catch (err) {
      setJobs([]);
      setTotalMatches(0);
      setError(
        `${err.message} Make sure the FastAPI backend is running at ${API_BASE}.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs(initialSearch);
    // Load the initial results once when the dashboard opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event) {
    event.preventDefault();

    if (activePlatform === "Remotive") {
      await fetchJobs(search);
    } else {
      const url = new URL(`${API_BASE}/api/platforms`);
      url.searchParams.set("q", search.trim());

      try {
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Could not prepare platform search.");
        }

        const selected = data.platforms.find(
          (platform) => platform.name === activePlatform
        );

        if (selected) window.open(selected.url, "_blank", "noopener,noreferrer");
      } catch (err) {
        setError(err.message);
      }
    }
  }

  async function handleResumeUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setResumeError("");
    setResumeSkills([]);

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setResumeError("Please select a PDF resume.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError("Your PDF must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setResume(file);
    setResumeName(file.name);
    setResumeLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE}/api/resume/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Resume analysis failed.");
      }

      setResumeSkills(data.skills || []);
    } catch (err) {
      setResumeError(err.message);
      setResume(null);
      setResumeName("");
    } finally {
      setResumeLoading(false);
      event.target.value = "";
    }
  }

  async function calculateJobMatch(job) {
    if (!resume) {
      setResumeError("Upload your PDF resume before calculating a match.");
      return;
    }

    setMatchingJob(job.id);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/jobs/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_text: [
            job.title,
            job.company,
            job.category,
            job.description,
            ...(job.tags || []),
          ].join("\n"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not calculate job match.");
      }

      setMatches((previous) => ({ ...previous, [job.id]: data }));
    } catch (err) {
      setError(err.message);
    } finally {
      setMatchingJob("");
    }
  }

  function toggleSaved(job) {
    setSavedJobs((previous) => {
      const alreadySaved = previous.some((item) => item.id === job.id);

      if (alreadySaved) {
        return previous.filter((item) => item.id !== job.id);
      }

      return [...previous, job];
    });
  }

  const displayedJobs =
    activePlatform === "Saved" ? savedJobs : jobs;

  const platformItems = [
    { name: "Remotive", icon: "◈", description: "Live remote listings" },
    { name: "Internshala", icon: "↗", description: "Open platform search" },
    { name: "Indeed", icon: "↗", description: "Open platform search" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✦</div>
          <div>
            <h1>InternMatch <span>AI</span></h1>
            <p>YOUR CAREER COPILOT</p>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <button
          className={`nav-item ${activePlatform !== "Saved" ? "active" : ""}`}
          onClick={() => setActivePlatform("Remotive")}
        >
          <span>▦</span> Discover jobs
        </button>

        <button
          className={`nav-item ${activePlatform === "Saved" ? "active" : ""}`}
          onClick={() => setActivePlatform("Saved")}
        >
          <span>♡</span> Saved jobs
          <span className="nav-count">{savedJobs.length}</span>
        </button>

        <div className="sidebar-label platform-label">JOB SOURCES</div>

        {platformItems.map((platform) => (
          <button
            key={platform.name}
            className={`source-item ${
              activePlatform === platform.name ? "source-active" : ""
            }`}
            onClick={() => {
              setActivePlatform(platform.name);
              setError("");
            }}
          >
            <span className="source-icon">{platform.icon}</span>
            <span className="source-text">
              <strong>{platform.name}</strong>
              <small>{platform.description}</small>
            </span>
            <span className="source-arrow">›</span>
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="ai-status">
            <span className="status-dot" />
            <div>
              <strong>AI engine</strong>
              <small>Ready to match</small>
            </div>
          </div>
          <p className="sidebar-footnote">Built for your next opportunity.</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">WORKSPACE <span>/</span> DISCOVER</div>
            <h2>
              {activePlatform === "Saved"
                ? "Your saved jobs"
                : "Find your next opportunity"}
            </h2>
            <p className="page-subtitle">
              Discover roles. Match your skills. Take the next step.
            </p>
          </div>
          <div className="topbar-badge">
            <span>✦</span> AI-powered job discovery
          </div>
        </header>

        <section className="hero-card">
          <div className="hero-copy">
            <div className="eyebrow"><span /> YOUR CAREER, ACCELERATED</div>
            <h3>Less searching.<br />More <span>matching.</span></h3>
            <p>
              Search opportunities and use AI to understand how your resume
              aligns with each job description.
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="hero-star">✦</div>
            <div className="hero-mini-card">
              <span className="mini-sparkle">✦</span>
              <div>
                <strong>AI Match</strong>
                <small>Skills analyzed</small>
              </div>
              <span className="mini-check">✓</span>
            </div>
            <div className="floating-dot dot-one" />
            <div className="floating-dot dot-two" />
          </div>
        </section>

        <section className="search-panel">
          <div className="section-heading">
            <div>
              <h3>Search opportunities</h3>
              <p>Try a role, skill, or technology.</p>
            </div>
            <span className="live-indicator"><span /> SEARCH</span>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <span className="search-icon">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g. Python, machine learning, data science..."
              aria-label="Search job listings"
            />
            <button type="submit" disabled={loading}>
              {loading && activePlatform === "Remotive" ? "Searching..." : "Search jobs"}
              <span>→</span>
            </button>
          </form>

          <div className="quick-searches">
            <span>POPULAR:</span>
            {["python", "machine learning", "data science", "AI"].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setSearch(term);
                  if (activePlatform === "Remotive") fetchJobs(term);
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </section>

        <section className="resume-panel">
          <div className="resume-icon">⇧</div>
          <div className="resume-copy">
            <h3>Make it personal with your resume</h3>
            <p>
              Upload a PDF to extract your skills and calculate similarity
              scores against job descriptions.
            </p>
            {resumeName && (
              <div className="resume-file">
                <span>✓</span> {resumeName}
                {resumeSkills.length > 0 && (
                  <span className="skill-count">{resumeSkills.length} skills found</span>
                )}
              </div>
            )}
          </div>
          <label className="upload-button">
            {resumeLoading ? "Analyzing..." : resume ? "Change resume" : "Upload PDF resume"}
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleResumeUpload}
              disabled={resumeLoading}
            />
          </label>
        </section>

        {resumeError && <div className="message error-message">{resumeError}</div>}

        {resumeSkills.length > 0 && (
          <section className="skills-panel">
            <h4>Skills detected in your resume</h4>
            <div className="skill-list">
              {resumeSkills.map((skill) => (
                <span className="skill-chip" key={skill}>{skill}</span>
              ))}
            </div>
          </section>
        )}

        {error && <div className="message error-message">{error}</div>}
        {notice && <div className="notice-message">ⓘ {notice}</div>}

        <section className="results-section">
          <div className="results-heading">
            <div>
              <div className="results-title-row">
                <h3>
                  {activePlatform === "Saved"
                    ? "Saved opportunities"
                    : activePlatform === "Remotive"
                    ? "Recommended opportunities"
                    : `${activePlatform} search`}
                </h3>
                {activePlatform === "Remotive" && !loading && (
                  <span className="result-count">{totalMatches} matches</span>
                )}
              </div>
              <p>
                {activePlatform === "Saved"
                  ? "Jobs you've bookmarked in this session."
                  : activePlatform === "Remotive"
                  ? "Results from the remote job listings provider."
                  : `Search directly on ${activePlatform}; results open on its website.`}
              </p>
            </div>
            {activePlatform === "Remotive" && (
              <button
                className="refresh-button"
                onClick={() => fetchJobs(search)}
                disabled={loading}
              >
                ↻ Refresh
              </button>
            )}
          </div>

          {activePlatform !== "Remotive" && activePlatform !== "Saved" ? (
            <div className="external-card">
              <div className="external-icon">↗</div>
              <h4>Continue your search on {activePlatform}</h4>
              <p>
                This prototype opens the platform's own search page rather than
                scraping or copying its listings into this dashboard.
              </p>
              <button onClick={handleSearch}>Open {activePlatform} search ↗</button>
            </div>
          ) : loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <h4>Finding opportunities...</h4>
              <p>Searching the available listings for “{search}”.</p>
            </div>
          ) : displayedJobs.length === 0 ? (
            <div className="empty-state">
              <div>⌕</div>
              <h4>No matching jobs found</h4>
              <p>
                Try a broader term like “python”, “developer”, or “data”.
                Available listings depend on the source.
              </p>
              {activePlatform === "Saved" && (
                <button onClick={() => setActivePlatform("Remotive")}>
                  Discover jobs
                </button>
              )}
            </div>
          ) : (
            <div className="job-list">
              {displayedJobs.map((job) => {
                const match = matches[job.id];
                const isSaved = savedJobs.some((item) => item.id === job.id);

                return (
                  <article className="job-card" key={job.id}>
                    <div className="job-card-top">
                      <div className="company-avatar">
                        {(job.company || "C").charAt(0).toUpperCase()}
                      </div>
                      <div className="job-main-info">
                        <h4>{job.title}</h4>
                        <p>{job.company}</p>
                      </div>
                      <button
                        className={`save-button ${isSaved ? "saved" : ""}`}
                        onClick={() => toggleSaved(job)}
                        title={isSaved ? "Remove saved job" : "Save job"}
                        aria-label={isSaved ? "Remove saved job" : "Save job"}
                      >
                        {isSaved ? "♥" : "♡"}
                      </button>
                    </div>

                    <div className="job-metadata">
                      <span>⌖ {job.location || "Remote"}</span>
                      <span>▦ {job.job_type || "Type not specified"}</span>
                      <span>◷ {formatDate(job.published)}</span>
                    </div>

                    <p className="job-description">
                      {job.description || "No description provided."}
                    </p>

                    <div className="job-tags">
                      {job.category && <span>{job.category}</span>}
                      {job.source && <span>{job.source}</span>}
                      {job.salary && job.salary !== "Not specified" && (
                        <span>{job.salary}</span>
                      )}
                    </div>

                    {match && (
                      <div className="match-panel">
                        <div className="match-topline">
                          <strong>Resume similarity</strong>
                          <span>{Math.round(match.match_score)}%</span>
                        </div>
                        <div className="match-track">
                          <div
                            className="match-fill"
                            style={{
                              width: `${Math.max(0, Math.min(100, match.match_score))}%`,
                            }}
                          />
                        </div>
                        <p className="match-disclaimer">
                          Similarity score only — not a hiring probability.
                        </p>

                        {match.resume_skills?.length > 0 && (
                          <>
                            <small className="match-label">YOUR DETECTED SKILLS</small>
                            <div className="skill-list">
                              {match.resume_skills.map((skill) => (
                                <span className="skill-chip" key={skill}>{skill}</span>
                              ))}
                            </div>
                          </>
                        )}

                        {match.missing_skills?.length > 0 && (
                          <>
                            <small className="match-label missing-label">
                              SKILLS TO CONSIDER LEARNING
                            </small>
                            <div className="skill-list">
                              {match.missing_skills.map((skill) => (
                                <span className="missing-chip" key={skill}>{skill}</span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    <div className="job-actions">
                      <button
                        className="match-button"
                        onClick={() => calculateJobMatch(job)}
                        disabled={matchingJob === job.id || resumeLoading}
                      >
                        {matchingJob === job.id
                          ? "Calculating..."
                          : match
                          ? "Recalculate match"
                          : "✦ Calculate AI match"}
                      </button>
                      <a
                        className="apply-button"
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View original listing ↗
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="page-footer">
          <span>✦ InternMatch AI</span>
          <span>Built to make your job search smarter.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
