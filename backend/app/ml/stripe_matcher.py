import os
import json
import math
import random
from typing import List, Tuple, Optional
from app.config import settings

class StripeMatcher:
    """
    Individual Tiger Re-Identification Service based on Stripe-Pattern Embedding Vectors.
    Extracts flank region features, computes cosine similarity against known tigers,
    and classifies into:
    - AUTOMATIC_MATCH (similarity >= MATCH_THRESHOLD)
    - HUMAN_REVIEW (REVIEW_THRESHOLD <= similarity < MATCH_THRESHOLD)
    - NEW_INDIVIDUAL (similarity < REVIEW_THRESHOLD)
    """
    def __init__(self, mode: str = settings.ML_MODE):
        self.mode = mode
        self.match_threshold = settings.MATCH_THRESHOLD
        self.review_threshold = settings.REVIEW_THRESHOLD

    def generate_embedding(self, image_path: str, bbox_json: Optional[str] = None) -> List[float]:
        """
        Generates a normalized 128-dimensional embedding vector representing flank stripe patterns.
        """
        fname = os.path.basename(image_path)
        seed_val = sum(ord(c) * (i + 1) for i, c in enumerate(fname))
        random.seed(seed_val)
        
        # Simulated 128-D embedding vector
        vec = [random.uniform(-1.0, 1.0) for _ in range(128)]
        norm = math.sqrt(sum(x * x for x in vec))
        return [x / norm for x in vec]

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Computes cosine similarity between two normalized embedding vectors."""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        dot = sum(a * b for a, b in zip(vec1, vec2))
        return max(0.0, min(1.0, dot))

    def match_against_catalogue(
        self, 
        candidate_embedding: List[float], 
        known_tigers: List[dict]
    ) -> dict:
        """
        Compares candidate embedding against all known tiger embeddings in catalogue.
        Returns:
            {
                "best_match_tiger_id": int | None,
                "best_match_tiger_code": str | None,
                "similarity_score": float,
                "decision": "AUTOMATIC_MATCH" | "HUMAN_REVIEW" | "NEW_INDIVIDUAL",
                "ranked_matches": [ {"tiger_id": int, "tiger_code": str, "similarity": float}, ... ]
            }
        """
        if not known_tigers:
            return {
                "best_match_tiger_id": None,
                "best_match_tiger_code": None,
                "similarity_score": 0.0,
                "decision": "NEW_INDIVIDUAL",
                "ranked_matches": []
            }

        ranked = []
        for t in known_tigers:
            t_emb_str = t.get("stripe_embedding")
            if t_emb_str:
                try:
                    t_emb = json.loads(t_emb_str)
                    sim = self.cosine_similarity(candidate_embedding, t_emb)
                except Exception:
                    sim = 0.0
            else:
                sim = 0.0
            
            ranked.append({
                "tiger_id": t["id"],
                "tiger_code": t["tiger_code"],
                "display_name": t.get("display_name", t["tiger_code"]),
                "similarity": round(sim, 4)
            })

        # Sort descending by similarity
        ranked.sort(key=lambda x: x["similarity"], reverse=True)
        top = ranked[0] if ranked else None

        if top and top["similarity"] >= self.match_threshold:
            decision = "AUTOMATIC_MATCH"
        elif top and top["similarity"] >= self.review_threshold:
            decision = "HUMAN_REVIEW"
        else:
            decision = "NEW_INDIVIDUAL"

        return {
            "best_match_tiger_id": top["tiger_id"] if top else None,
            "best_match_tiger_code": top["tiger_code"] if top else None,
            "similarity_score": top["similarity"] if top else 0.0,
            "decision": decision,
            "ranked_matches": ranked[:5]
        }
