import os
import httpx   
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from savefile import save_image, save_video
from analyzer import analyze_personality
from vector_db import store_personality_vector
from vector_db_recommend import vector_db_recommend
import json, re

app = FastAPI(
    title="OCEAN Personality API",
    description="Analyze text, image, or video and return Big Five personality vector",
    version="1.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

NODE_BACKEND_URL  = os.getenv("NODE_BACKEND_URL", "http://localhost:5001")
INTERNAL_SECRET   = os.getenv("INTERNAL_SECRET", "aura_internal_secret")


def extract_json(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("No JSON object found")
    return json.loads(match.group())


async def post_ocean_to_node(memory_id: str, ocean: dict):
    """Fire-and-forget: send the OCEAN vector back to Node.js to save on Memory doc."""
    if not memory_id:
        return
    url = f"{NODE_BACKEND_URL}/api/memories/{memory_id}/ocean"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.patch(
                url,
                json={
                    "O": ocean.get("Openness"),
                    "C": ocean.get("Conscientiousness"),
                    "E": ocean.get("Extraversion"),
                    "A": ocean.get("Agreeableness"),
                    "N": ocean.get("Neuroticism"),
                },
                headers={"x-internal-secret": INTERNAL_SECRET},
            )
    except Exception as e:
        # Non-blocking — log but don't crash
        print(f"[post_ocean_to_node] failed for memory {memory_id}: {e}")


@app.post("/analyze")
async def analyze(
    text: str | None = Form(default=None),
    image: UploadFile | None = File(default=None),
    video: UploadFile | None = File(default=None),
    memory_id: str | None = Form(default=None),
):
    try:
        image_bytes = await image.read() if image else None
        video_bytes = await video.read() if video else None

        if image:
            await image.seek(0)
        if video:
            await video.seek(0)

        image_path = await save_image(image) if image else None
        video_path = await save_video(video) if video else None

        response_text = analyze_personality(
            user_text=text,
            image_bytes=image_bytes,
            video_bytes=video_bytes
        )

        parsed_response  = extract_json(response_text)
        integrated_vector = parsed_response.get("ocean_scores_integrated")

        store_personality_vector(
            ocean_result=integrated_vector,
            text=text,
            image_path=image_path,
            video_path=video_path,
            memory_id=memory_id,
        )

        # ── Post OCEAN vector back to Node.js so it's stored on the Memory doc ──
        await post_ocean_to_node(memory_id, integrated_vector)

        return {
            "success": True,
            "ocean_vector": integrated_vector,
            "memory_id": memory_id,
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend")
def recommend(ocean_vector: dict):
    try:
        user_vector = np.array([
            ocean_vector["openness"],
            ocean_vector["conscientiousness"],
            ocean_vector["extraversion"],
            ocean_vector["agreeableness"],
            ocean_vector["neuroticism"],
        ])
        results = vector_db_recommend(user_vector)
        return {"success": True, "recommendations": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/count")
def count():
    from qdrant_client import QdrantClient
    client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
    try:
        result = client.count(collection_name="ocean")
        return {"total_vectors": result.count}
    except Exception as e:
        return {"total_vectors": 0, "note": str(e)}


@app.get("/debug-vectors")
def debug_vectors():
    from qdrant_client import QdrantClient
    client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
    try:
        results = client.scroll(collection_name="ocean", limit=20, with_payload=True, with_vectors=False)
        return {"points": [{"id": str(p.id), "payload": p.payload} for p in results[0]]}
    except Exception as e:
        return {"error": str(e)}


@app.delete("/cleanup-vectors")
def cleanup_vectors():
    from qdrant_client import QdrantClient
    from qdrant_client.models import VectorParams, Distance
    client = QdrantClient(url=os.getenv("QDRANT_URL"), api_key=os.getenv("QDRANT_API_KEY"))
    try:
        client.delete_collection(collection_name="ocean")
        client.create_collection(
            collection_name="ocean",
            vectors_config=VectorParams(size=5, distance=Distance.COSINE)
        )
        return {"success": True, "message": "Collection wiped and recreated clean"}
    except Exception as e:
        return {"error": str(e)}


@app.get("/health")
def health():
    return {"status": "ok"}