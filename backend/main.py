
import re
from html import unescape
from urllib.parse import quote_plus

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="InternMatch AI",
    description="Multi-platform job and internship discovery",
    version="0.3.0",
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


def clean_html(text: str) -> str:
    text = re.sub(
        r"<(script|style)\b[^>]*>.*?</\1>",
        " ",
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", unescape(text)).strip()


@app.get("/")
def home():
    return {
        "app": "InternMatch AI",
        "message": "Welcome to the API!",
        "version": "0.3.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "app": "InternMatch AI",
        "version": "0.3.0",
    }


@app.get("/api/jobs")
def search_remotive_jobs(
    q: str = Query(default="machine learning", min_length=2, max_length=100),
    limit: int = Query(default=20, ge=1, le=50),
):
    """Search Remotive's public remote-job API."""
    try:
        response = requests.get(
            REMOTIVE_API,
            params={"search": q, "limit": limit},
            timeout=20,
            headers={"User-Agent": "InternMatch-AI/0.3"},
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
            "description": clean_html(item.get("description") or "")[:2500],
            "url": item.get("url") or "https://remotive.com/remote-jobs",
            "source": "Remotive",
        })

    return {
        "query": q,
        "count": len(jobs),
        "jobs": jobs,
        "source": "Remotive",
        "notice": (
            "Remote listings only. Results may be delayed. "
            "Not every listing is an internship; verify the original posting."
        ),
    }


@app.get("/api/platforms")
def platform_search_links(
    q: str = Query(default="machine learning internship", min_length=2, max_length=100),
):
    """Return official platform search destinations, not scraped results."""
    term = quote_plus(q)

    return {
        "query": q,
        "platforms": {
            "internshala": {
                "name": "Internshala",
                "search_url": (
                    "https://internshala.com/internships/"
                    f"keywords-{term}/"
                ),
                "mode": "external_search",
            },
            "indeed": {
                "name": "Indeed",
                "search_url": (
                    "https://in.indeed.com/jobs?q={term}&l=India".format(
                        term=term
                    )
                ),
                "mode": "external_search",
            },
        },
    }
