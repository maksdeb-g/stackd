from fastapi import APIRouter, HTTPException
from app.models.schemas import SubtopicRequest, SubtopicResponse
from app.services.ai_service import generate_subtopics

router = APIRouter(prefix="/subtopics", tags=["subtopics"])

@router.post("", response_model=SubtopicResponse)
async def get_subtopics(body: SubtopicRequest):
    """Use AI to generate related subtopics for a given topic."""
    if not body.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    try:
        subtopics = await generate_subtopics(body.topic)
        return SubtopicResponse(subtopics=subtopics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
