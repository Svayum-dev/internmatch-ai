
import re
from functools import lru_cache

from sentence_transformers import SentenceTransformer, util


# A small, transparent vocabulary for the first version.
SKILL_VOCABULARY = [
    "python", "c++", "java", "sql", "machine learning",
    "deep learning", "artificial intelligence", "nlp",
    "natural language processing", "computer vision",
    "pytorch", "tensorflow", "scikit-learn", "pandas",
    "numpy", "data analysis", "data science", "statistics",
    "generative ai", "llm", "transformers", "fastapi",
    "flask", "react", "javascript", "html", "css",
    "git", "github", "docker", "aws", "azure",
    "communication", "problem solving",
]


def extract_skills(text: str) -> list[str]:
    """Find known skills mentioned in a piece of text."""
    text_lower = text.lower()
    found = []

    for skill in SKILL_VOCABULARY:
        pattern = r"(?<!\w)" + re.escape(skill) + r"(?!\w)"
        if re.search(pattern, text_lower):
            found.append(skill)

    return sorted(set(found))


@lru_cache(maxsize=1)
def get_model():
    """Load the embedding model once and reuse it."""
    return SentenceTransformer("all-MiniLM-L6-v2")


def calculate_match(resume_text: str, job_text: str) -> dict:
    """Calculate semantic similarity and compare detected skills."""
    if not resume_text.strip() or not job_text.strip():
        return {
            "match_score": 0,
            "resume_skills": [],
            "job_skills": [],
            "missing_skills": [],
        }

    model = get_model()

    embeddings = model.encode(
        [resume_text[:6000], job_text[:6000]],
        convert_to_tensor=True,
        normalize_embeddings=True,
    )

    similarity = util.cos_sim(embeddings[0], embeddings[1]).item()

    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_text)

    missing_skills = [
        skill for skill in job_skills if skill not in resume_skills
    ]

    # Cosine similarity is converted to a percentage for display.
    # This is a similarity indicator, not a probability of getting hired.
    score = round(max(0, min(1, similarity)) * 100)

    return {
        "match_score": score,
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "missing_skills": missing_skills,
    }
