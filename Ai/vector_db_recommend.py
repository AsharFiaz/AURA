import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
import numpy as np

load_dotenv()

def vector_db_recommend(
    user_vector: np.ndarray,
    balance_vector: np.ndarray = np.array([0.5, 0.5, 0.5, 0.5, 0.5]),
    top_k: int = 20,                  # fetch more so Node.js has enough IDs
    min_user_dist: float = 0.05,
    collection_name: str = "ocean"
):
    client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY"),
    )

    nearest_points = client.query_points(
        collection_name=collection_name,
        query=user_vector,
        limit=top_k * 5,
        with_payload=True,
        with_vectors=True
    ).points

    filtered_candidates = []

    for point in nearest_points:
        content_vector = np.array(point.vector)
        user_dist = np.linalg.norm(user_vector - content_vector)
        if user_dist < min_user_dist:
            continue

        improvement_per_trait = np.maximum(
            np.abs(user_vector - balance_vector) - np.abs(content_vector - balance_vector),
            0
        )
        total_improvement = improvement_per_trait.sum()

        if total_improvement > 0:
            filtered_candidates.append({
                "memory_id": point.payload.get("memory_id"),   # ← key field
                "trait_score": float(total_improvement),
                "user_distance": float(user_dist),
            })

    filtered_candidates.sort(key=lambda x: x["trait_score"], reverse=True)
    return filtered_candidates[:top_k]
