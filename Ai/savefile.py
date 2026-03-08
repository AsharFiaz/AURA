import os
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)


async def save_image(image: UploadFile) -> str:
    return await _upload_to_cloud(image)


async def save_video(video: UploadFile) -> str:
    return await _upload_to_cloud(video)


async def _upload_to_cloud(file: UploadFile) -> str:
    file_bytes = await file.read()
    file_like = BytesIO(file_bytes)

    result = cloudinary.uploader.upload(
        file_like,
        resource_type="auto",
    )

    return result["secure_url"]