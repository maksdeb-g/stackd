from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import SaveResourceRequest, ProgressUpdate
from app.core.database import get_supabase
from app.core.auth import get_current_user, get_access_token

router = APIRouter(prefix="/resources", tags=["resources"])

@router.post("/save", response_model=dict, status_code=201)
async def save_resource(body: SaveResourceRequest, user: dict = Depends(get_current_user), token: str = Depends(get_access_token)):
    db = get_supabase(token)
    try:
        res = db.table("saved_resources").insert({
            "user_id": user["id"],
            "folder_id": body.folder_id,
            "title": body.title,
            "source": body.source,
            "description": body.description,
            "thumbnail": body.thumbnail,
            "link": body.link,
            "difficulty": body.difficulty,
            "status": "WANT_TO_LEARN",
        }).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/folder/{folder_id}", response_model=list[dict])
async def get_resources_in_folder(folder_id: str, user: dict = Depends(get_current_user), token: str = Depends(get_access_token)):
    db = get_supabase(token)
    try:
        res = (
            db.table("saved_resources")
            .select("*")
            .eq("folder_id", folder_id)
            .eq("user_id", user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/progress/{resource_id}", response_model=dict)
async def update_progress(resource_id: str, body: ProgressUpdate, user: dict = Depends(get_current_user), token: str = Depends(get_access_token)):
    db = get_supabase(token)
    valid = {"WANT_TO_LEARN", "IN_PROGRESS", "DONE"}
    if body.status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")
    try:
        res = (
            db.table("saved_resources")
            .update({"status": body.status})
            .eq("id", resource_id)
            .eq("user_id", user["id"])
            .execute()
        )
        if not res.data:
            raise HTTPException(status_code=404, detail="Resource not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{resource_id}", status_code=204)
async def delete_resource(resource_id: str, user: dict = Depends(get_current_user), token: str = Depends(get_access_token)):
    db = get_supabase(token)
    try:
        db.table("saved_resources").delete().eq("id", resource_id).eq("user_id", user["id"]).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/progress/all", response_model=list[dict])
async def get_all_progress(user: dict = Depends(get_current_user), token: str = Depends(get_access_token)):
    db = get_supabase(token)
    try:
        res = db.table("saved_resources").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
