
import html
import re
import time
from threading import Lock

import requests
import fitz
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from matcher import extract_skills, calculate_match

app = FastAPI(
    title="InternMatch AI",
    description="AI-powered internship discovery and resume matching API",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REMOTIVE_API = "https://remotive.com/api/remote-jobs"
MAX_RESUME_BYTES = 5 * 1024 * 1024
CACHE_TTL_SECONDS = 6 * 60 * 60

# Keep the provider's listings in memory and filter them locally.
# This avoids calling the provider for every search.
JOB_CACHE = {"jobs": [], "fetched_at": 0.0}
JOB_CACHE_LOCK = Lock()

# Simple in-memory storage for the uploaded resume during this session.
RESUME_DATA = {"text": "", "skills": []}


def clean_html(value):
    """Convert HTML descriptions into readable plain text."""
    if not value:
        return ""

    text = re.sub(r"<[^>]+>", " ", str(value))
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_job(item):
    """Convert a provider listing to the shape expected by the frontend."""
    return {
        "id": str(item.get("id", "")),
        "title": item.get("title") or "Untitled role",
        "company": item.get("company_name") or "Unknown company",
        "location": item.get("candidate_required_location") or "Remote",
        "category": item.get("category") or "Not specified",
        "job_type": item.get("job_type") or "Not specified",
        "published": item.get("publication_date"),
        "salary": item.get("salary") or "Not specified",
        "description": clean_html(item.get("description"))[:5000],
        "url": item.get("url") or "https://remotive.com/remote-jobs",
        "source": "Remotive",
        "tags": item.get("tags") if isinstance(item.get("tags"), list) else [],
    }


@app.get("/")
def home():
    return {
        "message": "Welcome to InternMatch AI",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "InternMatch AI",
        "cached_jobs": len(JOB_CACHE["jobs"]),
        "resume_uploaded": bool(RESUME_DATA["text"]),
    }


def get_cached_jobs():
    """Fetch listings when the cache is empty or six hours old."""
    now = time.time()

    with JOB_CACHE_LOCK:
        expired = (
            not JOB_CACHE["jobs"]
            or now - JOB_CACHE["fetched_at"] >= CACHE_TTL_SECONDS
        )

        if expired:
            try:
                response = requests.get(
                    REMOTIVE_API,
                    timeout=30,
                    headers={"User-Agent": "InternMatch-AI/0.4"},
                )
                response.raise_for_status()
                payload = response.json()
                fresh_jobs = payload.get("jobs", [])

                if not isinstance(fresh_jobs, list):
                    raise ValueError("Unexpected response from job provider")

                JOB_CACHE["jobs"] = fresh_jobs
                JOB_CACHE["fetched_at"] = time.time()

            except (requests.RequestException, ValueError) as exc:
                # If we have older cached results, continue using them.
                if not JOB_CACHE["jobs"]:
                    raise HTTPException(
                        status_code=502,
                        detail=(
                            "Could not load jobs from Remotive. "
                            "Check your internet connection and try again."
                        ),
                    ) from exc

    return JOB_CACHE["jobs"]


@app.get("/api/jobs")
def search_remotive_jobs(
    q: str = Query(
        default="machine learning internship",
        min_length=2,
        max_length=100,
    ),
    limit: int = Query(default=20, ge=1, le=50),
):
    """
    Fetch a listing collection periodically, then filter it locally.

    All meaningful query terms must occur somewhere in a listing.
    """
    provider_jobs = get_cached_jobs()
    query = q.strip().lower()
    terms = re.findall(r"[a-zA-Z0-9+#.]+", query)

    if not terms:
        raise HTTPException(status_code=400, detail="Enter a valid search term")

    matches = []

    for item in provider_jobs:
        description = clean_html(item.get("description") or "")
        tags = item.get("tags", [])
        if not isinstance(tags, list):
            tags = []

        searchable_text = " ".join([
            str(item.get("title") or ""),
            str(item.get("company_name") or ""),
            str(item.get("category") or ""),
            str(item.get("job_type") or ""),
            str(item.get("candidate_required_location") or ""),
            description,
            " ".join(str(tag) for tag in tags),
        ]).lower()

        # Require every term to appear, so "python intern" is not
        # accidentally treated as a match for every internship.
        if all(term in searchable_text for term in terms):
            matches.append(item)

    # Put exact phrase matches in job titles first.
    matches.sort(
        key=lambda item: (
            query not in str(item.get("title") or "").lower(),
            str(item.get("title") or "").lower(),
        )
    )

    jobs = [normalize_job(item) for item in matches[:limit]]

    return {
        "query": q,
        "count": len(jobs),
        "total_matches": len(matches),
        "jobs": jobs,
        "source": "Remotive",
        "cache_updated_at": JOB_CACHE["fetched_at"],
        "notice": (
            "Results are filtered locally from cached Remotive listings. "
            "Listings are remote-focused and may not all be internships. "
            "Check the original posting for eligibility and availability."
        ),
    }


@app.get("/api/platforms")
def platform_search(q: str = Query(default="AI ML internship", max_length=100)):
    """Return external search URLs; these sites are not scraped."""
    from urllib.parse import quote_plus

    query = quote_plus(q.strip())

    return {
        "query": q,
        "platforms": [
            {
                "name": "Internshala",
                "url": f"https://internshala.com/internships/keywords-{query}/",
            },
            {
                "name": "Indeed",
                "url": f"https://in.indeed.com/jobs?q={query}&fromage=14",
            },
        ],
        "notice": (
            "These links open the platforms' own search pages. "
            "Their listings are not imported into InternMatch AI."
        ),
    }


@app.post("/api/resume/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    """Extract text and skills from an uploaded PDF resume."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume.",
        )

    content = await file.read(MAX_RESUME_BYTES + 1)

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Resume must be 5 MB or smaller.",
        )

    try:
        with fitz.open(stream=content, filetype="pdf") as document:
            resume_text = "\n".join(page.get_text() for page in document).strip()
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF. Please try another file.",
        ) from exc

    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail=(
                "No readable text was found. "
                "This may be a scanned PDF; try a text-based PDF."
            ),
        )

    skills = extract_skills(resume_text)

    RESUME_DATA["text"] = resume_text
    RESUME_DATA["skills"] = skills

    return {
        "filename": file.filename,
        "characters_extracted": len(resume_text),
        "skills": skills,
        "skill_count": len(skills),
        "message": "Resume analyzed successfully.",
    }


class MatchRequest(BaseModel):
    resume_text: str | None = None
    job_text: str
    resume_skills: list[str] | None = None


@app.post("/api/jobs/match")
def match_job(request: MatchRequest):
    """Compare a job description with the uploaded resume."""
    resume_text = request.resume_text or RESUME_DATA["text"]

    if not resume_text:
        raise HTTPException(
            status_code=400,
            detail="Upload and analyze your resume before matching jobs.",
        )

    if not request.job_text.strip():
        raise HTTPException(
            status_code=400,
            detail="The job description is empty.",
        )

    try:
        result = calculate_match(resume_text, request.job_text)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Could not calculate the match. Please try again.",
        ) from exc

    return {
        **result,
        "notice": (
            "This score estimates resume-to-description similarity. "
            "It is not a probability of getting hired."
        ),
    }
