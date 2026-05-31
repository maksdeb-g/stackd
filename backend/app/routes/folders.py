from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import Folder, FolderCreate
from app.core.database import get_supabase
from app.core.auth import get_current_user

router = APIRouter(prefix="/folders", tags=["folders"])

@router.get("", response_model=list[dict])
async def list_folders(user: dict = Depends(get_current_user)):
    db = get_supabase()
    try:
        res = db.table("folders").select("*").eq("user_id", user["id"]).order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=dict, status_code=201)
async def create_folder(body: FolderCreate, user: dict = Depends(get_current_user)):
    db = get_supabase()
    try:
        res = db.table("folders").insert({
            "user_id": user["id"],
            "name": body.name,
            "color": body.color,
        }).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{folder_id}", status_code=204)
async def delete_folder(folder_id: str, user: dict = Depends(get_current_user)):
    db = get_supabase()
    try:
        db.table("saved_resources").delete().eq("folder_id", folder_id).eq("user_id", user["id"]).execute()
        db.table("folders").delete().eq("id", folder_id).eq("user_id", user["id"]).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
