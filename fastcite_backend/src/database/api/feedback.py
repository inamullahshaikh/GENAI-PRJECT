"""
Feedback API - User feedback and suggestions
Allows users to submit feedback and admins to respond.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.auth import get_current_user
from database.mongo import feedback_collection, users_collection
from database.models import Feedback

router = APIRouter(prefix="/feedback", tags=["Feedback"])

# ==============================
# PYDANTIC MODELS
# ==============================
class FeedbackCreate(BaseModel):
    subject: str
    message: str

class FeedbackResponse(BaseModel):
    feedbacks: List[dict]
    total: int
    page: int
    limit: int
    has_more: bool

# ==============================
# USER ENDPOINTS
# ==============================
@router.post("/", status_code=201)
async def create_feedback(
    feedback_data: FeedbackCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new feedback entry."""
    try:
        # Get user details
        user = await users_collection.find_one({"id": current_user["id"]})
        
        feedback = Feedback(
            user_id=str(current_user["id"]),
            user_name=user.get("name") if user else None,
            user_email=user.get("email") if user else None,
            subject=feedback_data.subject,
            message=feedback_data.message,
            status="pending"
        )
        
        await feedback_collection.insert_one(feedback.to_mongo())
        
        return {
            "message": "Feedback submitted successfully",
            "id": str(feedback.id)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating feedback: {str(e)}")

@router.get("/me", response_model=FeedbackResponse)
async def get_my_feedback(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all feedback submitted by the current user."""
    try:
        query = {"user_id": str(current_user["id"])}
        
        total = await feedback_collection.count_documents(query)
        skip = (page - 1) * limit
        
        cursor = feedback_collection.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        feedbacks = await cursor.to_list(length=limit)
        
        return FeedbackResponse(
            feedbacks=feedbacks,
            total=total,
            page=page,
            limit=limit,
            has_more=(skip + limit) < total
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feedback: {str(e)}")

@router.get("/{feedback_id}")
async def get_feedback_by_id(
    feedback_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific feedback by ID (only if user owns it or is admin)."""
    feedback = await feedback_collection.find_one({"id": feedback_id}, {"_id": 0})
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    # Check if user owns the feedback or is admin
    if feedback["user_id"] != str(current_user["id"]) and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return feedback

