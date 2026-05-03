from fastapi import APIRouter, HTTPException
from app.models.schemas import Folder, FolderCreate
from app.core.database import get_supabase

router = APIRouter(prefix="/folders", tags=["folders"])

@router.get("", response_model=list[dict])
async def list_folders():
    db = get_supabase()
    try:
        res = db.table("folders").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=dict, status_code=201)
async def create_folder(body: FolderCreate):
    db = get_supabase()
    try:
        res = db.table("folders").insert({
            "name": body.name,
            "color": body.color,
        }).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{folder_id}", status_code=204)
async def delete_folder(folder_id: str):
    db = get_supabase()
    try:
        # Also delete resources in the folder
        db.table("saved_resources").delete().eq("folder_id", folder_id).execute()
        db.table("folders").delete().eq("id", folder_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
