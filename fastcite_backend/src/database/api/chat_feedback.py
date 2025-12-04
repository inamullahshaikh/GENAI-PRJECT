"""
Chat Feedback API - User feedback on chat responses
Allows users to submit feedback on LLM responses and admins to view all feedback.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.auth import get_current_user, get_admin_user
from database.mongo import chat_feedback_collection, users_collection, chat_sessions_collection
from database.models import ChatFeedback

router = APIRouter(prefix="/chat-feedback", tags=["Chat Feedback"])

# ==============================
# PYDANTIC MODELS
# ==============================
class ChatFeedbackCreate(BaseModel):
    chat_session_id: str
    message_index: int
    rating: Optional[str] = None  # "positive", "negative", or "neutral" (optional)
    star_rating: Optional[int] = None  # 1-5 star rating (optional but recommended)
    comment: Optional[str] = None
    question: str
    answer: str

class ChatFeedbackResponse(BaseModel):
    feedbacks: List[dict]
    total: int
    page: int
    limit: int
    has_more: bool

# ==============================
# USER ENDPOINTS
# ==============================
@router.post("/", status_code=201)
async def create_chat_feedback(
    feedback_data: ChatFeedbackCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new chat feedback entry."""
    try:
        # Validate rating if provided
        if feedback_data.rating is not None:
            if feedback_data.rating not in ["positive", "negative", "neutral"]:
                raise HTTPException(status_code=400, detail="Rating must be 'positive', 'negative', or 'neutral'")
        
        # Validate star rating if provided
        if feedback_data.star_rating is not None:
            if feedback_data.star_rating < 1 or feedback_data.star_rating > 5:
                raise HTTPException(status_code=400, detail="Star rating must be between 1 and 5")
        
        # At least one rating must be provided
        if not feedback_data.rating and not feedback_data.star_rating:
            raise HTTPException(status_code=400, detail="Either rating or star_rating must be provided")
        
        # Verify chat session exists and belongs to user
        chat_session = await chat_sessions_collection.find_one({"id": feedback_data.chat_session_id})
        if not chat_session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        if chat_session.get("user_id") != str(current_user["id"]):
            raise HTTPException(status_code=403, detail="Access denied to this chat session")
        
        # Get user details
        user = await users_collection.find_one({"id": current_user["id"]})
        
        feedback = ChatFeedback(
            user_id=str(current_user["id"]),
            user_name=user.get("name") if user else None,
            user_email=user.get("email") if user else None,
            chat_session_id=feedback_data.chat_session_id,
            message_index=feedback_data.message_index,
            rating=feedback_data.rating,
            star_rating=feedback_data.star_rating,
            comment=feedback_data.comment,
            question=feedback_data.question,
            answer=feedback_data.answer
        )
        
        await chat_feedback_collection.insert_one(feedback.to_mongo())
        
        return {
            "message": "Feedback submitted successfully",
            "id": str(feedback.id)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating feedback: {str(e)}")

@router.get("/me")
async def get_my_chat_feedback(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all chat feedback submitted by the current user."""
    try:
        query = {"user_id": str(current_user["id"])}
        
        total = await chat_feedback_collection.count_documents(query)
        skip = (page - 1) * limit
        
        cursor = chat_feedback_collection.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        feedbacks = await cursor.to_list(length=limit)
        
        return ChatFeedbackResponse(
            feedbacks=feedbacks,
            total=total,
            page=page,
            limit=limit,
            has_more=(skip + limit) < total
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feedback: {str(e)}")

# ==============================
# ADMIN ENDPOINTS
# ==============================
@router.get("/admin/all", response_model=ChatFeedbackResponse)
async def get_all_chat_feedback_admin(
    admin_user: dict = Depends(get_admin_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    rating: Optional[str] = Query(None, description="Filter by rating: positive, negative, or neutral")
):
    """Get all chat feedback (admin only)."""
    try:
        query = {}
        if rating and rating in ["positive", "negative", "neutral"]:
            query["rating"] = rating
        
        total = await chat_feedback_collection.count_documents(query)
        skip = (page - 1) * limit
        
        cursor = chat_feedback_collection.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
        feedbacks = await cursor.to_list(length=limit)
        
        return ChatFeedbackResponse(
            feedbacks=feedbacks,
            total=total,
            page=page,
            limit=limit,
            has_more=(skip + limit) < total
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feedback: {str(e)}")

@router.get("/admin/stats")
async def get_chat_feedback_stats(
    admin_user: dict = Depends(get_admin_user)
):
    """Get statistics about chat feedback (admin only)."""
    try:
        total = await chat_feedback_collection.count_documents({})
        positive = await chat_feedback_collection.count_documents({"rating": "positive"})
        negative = await chat_feedback_collection.count_documents({"rating": "negative"})
        neutral = await chat_feedback_collection.count_documents({"rating": "neutral"})
        
        return {
            "total": total,
            "positive": positive,
            "negative": negative,
            "neutral": neutral
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")

@router.delete("/{feedback_id}")
async def delete_chat_feedback(
    feedback_id: str,
    admin_user: dict = Depends(get_admin_user)
):
    """Delete a chat feedback entry (admin only)."""
    try:
        result = await chat_feedback_collection.delete_one({"id": feedback_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Feedback not found")
        
        return {"message": "Feedback deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting feedback: {str(e)}")

