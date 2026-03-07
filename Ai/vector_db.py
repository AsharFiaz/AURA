from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid
import os
from dotenv import load_dotenv

load_dotenv()


def ocean_to_vector(ocean: dict) -> list[float]:
    return [
        ocean["Openness"],
        ocean["Conscientiousness"],
        ocean["Extraversion"],
        ocean["Agreeableness"],
        ocean["Neuroticism"],
    ]


def store_personality_vector(
    ocean_result: dict,
    text: str | None = None,
    image_path: str | None = None,
    video_path: str | None = None,
    memory_id: str | None = None,   # ← MongoDB _id of the memory
):
    client = QdrantClient(
        url=os.getenv("QDRANT_URL"),
        api_key=os.getenv("QDRANT_API_KEY"),
    )

    existing = [c.name for c in client.get_collections().collections]
    if "ocean" not in existing:
        client.create_collection(
            collection_name="ocean",
            vectors_config=VectorParams(size=5, distance=Distance.COSINE),
        )

    vector = ocean_to_vector(ocean_result)

    metadata = {
        "memory_id": memory_id,          # ← key field for Node.js lookup
        "text": text,
        "image_path": image_path,
        "video_path": video_path,
        "source": "video" if video_path else "image" if image_path else "text",
        "model_version": "1.2.1",
    }

    point = PointStruct(
        id=str(uuid.uuid4()),
        vector=vector,
        payload=metadata,
    )

    client.upsert(
        collection_name="ocean",
        points=[point],
        wait=True,
    )