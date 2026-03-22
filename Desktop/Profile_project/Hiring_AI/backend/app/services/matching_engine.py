"""
Matching Engine Service
Semantic matching of candidate resumes against Job Descriptions
using OpenAI embeddings + cosine similarity via Supabase pgvector.
"""
import json
import numpy as np
from typing import List, Tuple
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.database import get_pg_pool, get_redis
from app.schemas.schemas import ParsedResumeData
import logging

logger = logging.getLogger(__name__)

# Weights for scoring components
SCORE_WEIGHTS = {
    "semantic_similarity": 0.40,   # Vector embedding cosine similarity
    "skills_overlap": 0.35,        # Skills mentioned in JD vs resume
    "experience_match": 0.15,      # Years of experience alignment
    "education_match": 0.10,       # Education requirements
}


class MatchingEngine:
    """
    Multi-factor JD-Resume matching engine.
    
    Combines:
    1. Semantic similarity via OpenAI embeddings + pgvector
    2. Hard skill overlap scoring
    3. Experience years alignment
    4. Education level matching
    """
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.embedding_model = "text-embedding-3-small"

    async def compute_match_score(
        self,
        parsed_resume: ParsedResumeData,
        job_id: str,
        job_description: str,
        required_skills: List[str],
        min_experience: int,
    ) -> float:
        """
        Compute weighted match score between resume and job description.
        Returns a score between 0.0 and 1.0.
        """
        # 1. Semantic Similarity Score
        semantic_score = await self._semantic_similarity(
            resume_text=self._resume_to_text(parsed_resume),
            jd_text=job_description,
            job_id=job_id,
        )
        
        # 2. Skills Overlap Score
        skills_score = self._compute_skills_overlap(
            candidate_skills=[s.lower() for s in parsed_resume.skills],
            required_skills=[s.lower() for s in required_skills],
        )
        
        # 3. Experience Score
        experience_score = self._compute_experience_score(
            candidate_years=parsed_resume.total_years_experience,
            required_min=min_experience,
        )
        
        # 4. Education Score (simplified)
        education_score = 1.0 if parsed_resume.education else 0.5
        
        # Weighted combination
        final_score = (
            semantic_score * SCORE_WEIGHTS["semantic_similarity"] +
            skills_score * SCORE_WEIGHTS["skills_overlap"] +
            experience_score * SCORE_WEIGHTS["experience_match"] +
            education_score * SCORE_WEIGHTS["education_match"]
        )
        
        logger.info(
            f"Match scores — Semantic: {semantic_score:.2f}, "
            f"Skills: {skills_score:.2f}, Exp: {experience_score:.2f}, "
            f"Education: {education_score:.2f} → Final: {final_score:.2f}"
        )
        
        return round(min(final_score, 1.0), 4)

    async def _semantic_similarity(
        self, resume_text: str, jd_text: str, job_id: str
    ) -> float:
        """Compute cosine similarity between resume and JD embeddings."""
        redis = await get_redis()
        cache_key = f"jd_embedding:{job_id}"
        
        # Try to get cached JD embedding
        cached = await redis.get(cache_key)
        if cached:
            jd_embedding = np.array(json.loads(cached))
        else:
            # Generate JD embedding and cache it
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=jd_text[:8000],
            )
            jd_embedding = np.array(response.data[0].embedding)
            await redis.set(cache_key, json.dumps(jd_embedding.tolist()), ex=86400)  # 24h cache
        
        # Generate resume embedding (not cached, unique per candidate)
        resume_response = await self.client.embeddings.create(
            model=self.embedding_model,
            input=resume_text[:8000],
        )
        resume_embedding = np.array(resume_response.data[0].embedding)
        
        # Cosine similarity
        similarity = np.dot(resume_embedding, jd_embedding) / (
            np.linalg.norm(resume_embedding) * np.linalg.norm(jd_embedding)
        )
        
        return float(np.clip(similarity, 0, 1))

    def _compute_skills_overlap(
        self, candidate_skills: List[str], required_skills: List[str]
    ) -> float:
        """Compute Jaccard-like skill overlap score."""
        if not required_skills:
            return 0.8  # No specific requirements → neutral score
        
        # Fuzzy matching for related skills (e.g., "react.js" ~ "react")
        matched = 0
        for req_skill in required_skills:
            for cand_skill in candidate_skills:
                if req_skill in cand_skill or cand_skill in req_skill:
                    matched += 1
                    break
        
        return matched / len(required_skills)

    def _compute_experience_score(
        self, candidate_years: float, required_min: int
    ) -> float:
        """Score experience alignment. Overqualification is acceptable."""
        if required_min == 0:
            return 1.0
        
        if candidate_years >= required_min:
            # Full score if meets/exceeds requirement (cap bonus at 20%)
            return min(1.0, 0.8 + (candidate_years - required_min) * 0.05)
        else:
            # Proportional score if below requirement
            return candidate_years / required_min

    def _resume_to_text(self, resume: ParsedResumeData) -> str:
        """Convert parsed resume to searchable text."""
        parts = [
            f"Skills: {', '.join(resume.skills)}",
            f"Total Experience: {resume.total_years_experience} years",
        ]
        
        if resume.summary:
            parts.append(f"Summary: {resume.summary}")
        
        for exp in resume.experience[:5]:  # Top 5 experiences
            parts.append(
                f"{exp.get('title', '')} at {exp.get('company', '')} — "
                f"{exp.get('description', '')}"
            )
        
        for edu in resume.education:
            parts.append(
                f"{edu.get('degree', '')} in {edu.get('field', '')} "
                f"from {edu.get('institution', '')}"
            )
        
        if resume.certifications:
            parts.append(f"Certifications: {', '.join(resume.certifications)}")
        
        return "\n".join(parts)


_engine_instance = None


def get_matching_engine() -> MatchingEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = MatchingEngine()
    return _engine_instance
