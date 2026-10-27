
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileUser,
  LayoutDashboard,
  MapPin,
  Search,
  Settings,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import "./App.css";

const demoJobs = [
  {
    id: 1,
    company: "NeuralWorks",
    title: "Machine Learning Intern",
    location: "Remote · India",
    match: 94,
    skills: ["Python", "PyTorch", "NLP"],
    color: "violet",
  },
  {
    id: 2,
    company: "DataOrbit",
    title: "AI Research Intern",
    location: "Bengaluru, India",
    match: 87,
    skills: ["Python", "Deep Learning", "NumPy"],
    color: "blue",
  },
  {
    id: 3,
    company: "CloudScale",
    title: "Data Science Intern",
    location: "Remote · India",
    match: 81,
    skills: ["SQL", "Pandas", "Statistics"],
    color: "orange",
  },
];

function App() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState([]);
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [resumeName, setResumeName] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((response) => {
        if (!response.ok) throw new Error("Backend unavailable");
        return response.json();
      })
      .then((data) => {
        setApiStatus(data.status === "healthy" ? "Connected" : "Unavailable");
      })
      .catch(() => setApiStatus("Offline"));
  }, []);

  const filteredJobs = demoJobs.filter((job) => {
    const searchable = [
      job.title,
      job.company,
      job.location,
      ...job.skills,
    ].join(" ").toLowerCase();

    return searchable.includes(search.toLowerCase());
  });

  function handleSearch(event) {
    event.preventDefault();
    setSearch(query.trim());
  }

  function toggleSaved(id) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((jobId) => jobId !== id)
        : [...current, id]
    );
  }

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
          <button className="nav-item active">
            <LayoutDashboard size={18} /> Overview
          </button>
          <button className="nav-item">
            <Search size={18} /> Find internships
          </button>
          <button className="nav-item">
            <FileUser size={18} /> Resume analysis
          </button>
          <button className="nav-item">
            <BriefcaseBusiness size={18} /> My applications
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
            <CheckCircle2 size={16} /> Project demo · v0.1
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumbs">Workspace / <strong>Overview</strong></div>
          <div className="topbar-actions">
            <span className={`connection ${apiStatus === "Connected" ? "connected" : ""}`}>
              <span className="status-dot" />
              API {apiStatus}
            </span>
            <button className="icon-button" aria-label="Notifications">
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
                Discover opportunities aligned with your skills and ambitions.
              </p>
            </div>

            <label className="resume-button">
              <Upload size={17} />
              {resumeName ? "Resume selected" : "Upload resume"}
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
                placeholder="Search job titles, skills or keywords..."
              />
            </div>
            <div className="search-divider" />
            <div className="location-field">
              <MapPin size={18} /> India / Remote
            </div>
            <button className="search-button" type="submit">
              Search jobs <ArrowRight size={17} />
            </button>
          </form>

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span>Demo opportunities</span>
                <BriefcaseBusiness size={19} />
              </div>
              <strong>128</strong>
              <small>Sample dashboard metric</small>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Strong matches</span>
                <Target size={19} />
              </div>
              <strong>24</strong>
              <small>Sample dashboard metric</small>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Saved jobs</span>
                <Bookmark size={19} />
              </div>
              <strong>{saved.length}</strong>
              <small>Saved in this session</small>
            </article>
            <article className="stat-card">
              <div className="stat-top">
                <span>Resume status</span>
                <FileUser size={19} />
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
                <h2>Recommended internships</h2>
                <p>Sample listings while we build live job discovery.</p>
              </div>
              <span className="demo-pill">DEMO DATA</span>
            </div>

            <div className="job-list">
              {filteredJobs.map((job) => (
                <article className="job-card" key={job.id}>
                  <div className={`company-logo ${job.color}`}>
                    {job.company.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="job-main">
                    <div className="company-name">{job.company}</div>
                    <h3>{job.title}</h3>
                    <div className="job-meta">
                      <span><MapPin size={14} /> {job.location}</span>
                      <span><Clock3 size={14} /> Internship</span>
                    </div>
                    <p className="job-description">
                      An illustrative role for previewing the job discovery experience.
                    </p>
                    <div className="skill-tags">
                      {job.skills.map((skill) => <span key={skill}>{skill}</span>)}
                    </div>
                    <span className="source-label">Demo listing · Not a live vacancy</span>
                  </div>

                  <div className="job-side">
                    <div className="match-ring" style={{ "--score": `${job.match}%` }}>
                      <div>
                        <strong>{job.match}%</strong>
                        <span>Demo match</span>
                      </div>
                    </div>
                    <button
                      className={`save-button ${saved.includes(job.id) ? "saved" : ""}`}
                      onClick={() => toggleSaved(job.id)}
                    >
                      <Bookmark size={16} />
                      {saved.includes(job.id) ? "Saved" : "Save job"}
                    </button>
                  </div>
                </article>
              ))}

              {filteredJobs.length === 0 && (
                <div className="empty-state">
                  <Search size={28} />
                  <h3>No matching demo jobs</h3>
                  <p>Try Python, machine learning, AI, SQL or data science.</p>
                </div>
              )}
            </div>
          </section>

          <footer className="footer">
            <span>InternMatch AI · Applications of AI project</span>
            <span><Activity size={14} /> {apiStatus}</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
