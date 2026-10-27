
import re
from html import unescape
from urllib.parse import quote_plus

import fitz
import requests
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from matcher import calculate_match, extract_skills

app = FastAPI(
    title="InternMatch AI",
    description="Multi-platform job discovery and AI resume matching",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

REMOTIVE_API = "https://remotive.com/api/remote-jobs"
MAX_RESUME_BYTES = 5 * 1024 * 1024


def clean_html(text: str) -> str:
    text = re.sub(
        r"<(script|style)\b[^>]*>.*?</\1>",
        " ",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", unescape(text)).strip()


class MatchRequest(BaseModel):
    resume_text: str = Field(min_length=1, max_length=12000)
    job_text: str = Field(min_length=1, max_length=6000)


@app.get("/")
def home():
    return {
        "app": "InternMatch AI",
        "message": "Welcome to the API!",
        "version": "0.4.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "app": "InternMatch AI",
        "version": "0.4.0",
    }


@app.get("/api/jobs")
def search_remotive_jobs(
    q: str = Query(default="machine learning internship", min_length=2, max_length=100),
    limit: int = Query(default=20, ge=1, le=50),
):
    try:
        response = requests.get(
            REMOTIVE_API,
            params={"search": q, "limit": limit},
            timeout=20,
            headers={"User-Agent": "InternMatch-AI/0.4"},
        )
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail="Remotive is temporarily unavailable. Please try again.",
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="Remotive returned an invalid response.",
        ) from exc

    jobs = []

    for item in payload.get("jobs", []):
        jobs.append({
            "id": str(item.get("id", "")),
            "title": item.get("title") or "Untitled role",
            "company": item.get("company_name") or "Unknown company",
            "location": item.get("candidate_required_location") or "Remote",
            "category": item.get("category") or "Not specified",
            "job_type": item.get("job_type") or "Not specified",
            "published": item.get("publication_date"),
            "salary": item.get("salary") or "Not specified",
            "description": clean_html(item.get("description") or "")[:5000],
            "url": item.get("url") or "https://remotive.com/remote-jobs",
            "source": "Remotive",
        })

    return {
        "query": q,
        "count": len(jobs),
        "jobs": jobs,
        "source": "Remotive",
        "notice": (
            "Remote listings only. Not every result is an internship. "
            "Verify eligibility and availability on the original listing."
        ),
    }


@app.get("/api/platforms")
def platform_search_links(
    q: str = Query(default="machine learning internship", min_length=2, max_length=100),
):
    term = quote_plus(q)

    return {
        "query": q,
        "platforms": {
            "internshala": {
                "name": "Internshala",
                "search_url": (
                    "https://internshala.com/internships/"
                    f"keywords-{term.replace('+', '-')}/"
                ),
                "mode": "external_search",
            },
            "indeed": {
                "name": "Indeed",
                "search_url": f"https://in.indeed.com/jobs?q={term}&l=India",
                "mode": "external_search",
            },
        },
    }


@app.post("/api/resume/analyze")
async def analyze_resume(file: UploadFile = File(...)):
    filename = file.filename or "resume.pdf"

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF resume.",
        )

    content = await file.read(MAX_RESUME_BYTES + 1)

    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(
            status_code=413,
            detail="The resume must be 5 MB or smaller.",
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    try:
        with fitz.open(stream=content, filetype="pdf") as document:
            resume_text = "\n".join(page.get_text() for page in document)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF. Please try another file.",
        ) from exc

    if not resume_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text found. Scanned PDFs may need OCR.",
        )

    return {
        "filename": filename,
        "character_count": len(resume_text),
        "skills": extract_skills(resume_text),
        "resume_text": resume_text[:12000],
        "notice": "The resume is analyzed in memory and is not saved to disk.",
    }


@app.post("/api/jobs/match")
def match_resume_to_job(request: MatchRequest):
    try:
        result = calculate_match(request.resume_text, request.job_text)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Could not calculate the AI similarity score.",
        ) from exc
