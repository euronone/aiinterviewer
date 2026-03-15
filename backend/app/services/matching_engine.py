"""
JD matching: compare parsed resume data with job requirements.
Returns a match score 0-100. BRD threshold for auto-invite is e.g. 75%.
"""

from typing import List, Any

MATCH_THRESHOLD = 75.0


def compute_match_score(parsed_data: dict, job_requirements: List[str], job_description: str) -> float:
    """
    Compute semantic match score between parsed resume and JD.
    Uses keyword overlap when embeddings are not available; can be replaced with pgvector/cosine similarity.
    """
    skills = parsed_data.get("skills") or []
    experience_years = parsed_data.get("experience_years") or 0
    education = (parsed_data.get("education") or "").lower()
    combined_resume = " ".join(skills) + " " + str(experience_years) + " " + education
    combined_resume_lower = combined_resume.lower()
    jd_text = (job_description + " " + " ".join(job_requirements or [])).lower()

    # Simple keyword overlap score (0-100)
    jd_words = set(w for w in jd_text.split() if len(w) > 2)
    resume_words = set(w for w in combined_resume_lower.split() if len(w) > 2)
    if not jd_words:
        return 80.0  # No JD requirements -> default pass
    overlap = len(jd_words & resume_words) / len(jd_words)
    base_score = min(100.0, overlap * 100.0)
    # Slight boost for experience
    if experience_years >= 3:
        base_score = min(100.0, base_score + 10.0)
    return round(base_score, 1)
