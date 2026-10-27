
# 🎯 InternMatch AI

**An AI-powered internship discovery and resume-matching platform.**

InternMatch AI aims to help students discover relevant internship opportunities, compare job requirements with their skills, and track applications in one place.

## ✨ Planned Features

- 🔎 Search internships from supported job sources
- 📄 Upload and parse PDF resumes
- 🧠 Rank jobs using semantic similarity
- 🎯 Identify potential skill gaps
- 📋 Track saved jobs and application progress
- 📊 Explain recommendations and evaluate matching quality

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| AI/NLP | Sentence Transformers |
| Similarity | Scikit-learn |
| Resume parsing | PyMuPDF |
| Database | SQLite |

## 🚀 Run Locally

### 1. Start the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

### 2. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## 📌 Project Status

- [x] Initial React dashboard
- [x] FastAPI backend and health endpoint
- [x] Frontend/backend connection
- [ ] Live internship discovery
- [ ] AI resume matching
- [ ] Skill-gap analysis
- [ ] Persistent application tracking
- [ ] Evaluation and testing

**Note:** The current dashboard uses demonstration internship listings. Live data and AI-powered recommendations are planned features, not yet implemented.

## 🎓 Purpose

Developed as an Applications of AI academic project.

# 🎯 InternMatch AI

**An AI-powered internship discovery and resume-matching platform.**

InternMatch AI aims to help students discover relevant internship opportunities, compare job requirements with their skills, and track applications in one place.

## ✨ Planned Features

- 🔎 Search internships from supported job sources
- 📄 Upload and parse PDF resumes
- 🧠 Rank jobs using semantic similarity
- 🎯 Identify potential skill gaps
- 📋 Track saved jobs and application progress
- 📊 Explain recommendations and evaluate matching quality

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | FastAPI |
| AI/NLP | Sentence Transformers |
| Similarity | Scikit-learn |
| Resume parsing | PyMuPDF |
| Database | SQLite |

## 🚀 Run Locally

### 1. Start the backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

### 2. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## 📌 Project Status

- [x] Initial React dashboard
- [x] FastAPI backend and health endpoint
- [x] Frontend/backend connection
- [ ] Live internship discovery
- [ ] AI resume matching
- [ ] Skill-gap analysis
- [ ] Persistent application tracking
- [ ] Evaluation and testing

**Note:** The current dashboard uses demonstration internship listings. Live data and AI-powered recommendations are planned features, not yet implemented.

## 🎓 Purpose

Developed as an Applications of AI academic project.
