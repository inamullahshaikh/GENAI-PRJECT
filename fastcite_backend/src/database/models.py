from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal, Dict
from uuid import UUID, uuid4
from datetime import date, datetime


# ============================
# USER MODEL
# ============================
class User(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    username: str
    pass_hash: Optional[str]
    name: str
    dob: Optional[date] = None
    email: EmailStr
    role: Literal["user", "admin"] = "user"  # restricts values to 'user' or 'admin'

    class Config:
        orm_mode = True
        json_schema_extra = {
            "example": {
                "username": "inam123",
                "pass_hash": "hashed_password_here",
                "name": "Inam Ullah",
                "dob": "2002-04-10",
                "email": "inam@example.com",
                "role": "user"
            }
        }

    def to_mongo(self):
        """Convert UUIDs to strings for MongoDB insertion."""
        data = self.dict()
        data["id"] = str(self.id)
        return data


# ============================
# CHAT MESSAGE MODEL
# ============================
class ChatMessage(BaseModel):
    question: str
    answer: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is deep learning?",
                "answer": "Deep learning is a subset of machine learning using neural networks.",
                "timestamp": "2025-10-30T12:00:00Z"
            }
        }

    def to_mongo(self):
        data = self.dict()
        data["timestamp"] = data["timestamp"].isoformat()
        return data


# ============================
# CHAT SESSION MODEL
# ============================
class ChatSession(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: Optional[str] = ""
    title: Optional[str] = Field(default="New Chat")
    messages: List[ChatMessage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "740729b6-aa3c-47f1-a043-4425ed5d70eb",
                "title": "LLM Project Discussion",
                "messages": [
                    {
                        "question": "Explain retrieval-augmented generation.",
                        "answer": "RAG combines retrieval from a vector DB with text generation."
                    },
                    {
                        "question": "How can I integrate it with FastAPI?",
                        "answer": "Use a vector DB like Qdrant and query it inside a FastAPI route."
                    }
                ],
                "created_at": "2025-10-30T10:00:00Z",
                "updated_at": "2025-10-30T11:00:00Z"
            }
        }

    def to_mongo(self):
        """Convert UUIDs and datetime to strings for MongoDB."""
        data = self.dict()
        data["id"] = str(self.id)
        data["user_id"] = str(self.user_id)
        data["created_at"] = data["created_at"].isoformat()
        data["updated_at"] = data["updated_at"].isoformat()
        data["messages"] = [m.to_mongo() for m in self.messages]
        return data


# ============================
# BOOK MODEL
# ============================
class Book(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    author_name: Optional[str] = None
    pages: Optional[int] = None
    status: Literal["processing", "complete"]
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    uploaded_by: Dict[str, str] = Field(default_factory=dict)  # {user_id: book_name}

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Deep Learning with Python",
                "author_name": "François Chollet",
                "pages": 360,
                "status": "processing",
                "uploaded_at": "2025-10-30T12:00:00Z",
                "uploaded_by": {"user-id-123": "My Custom Book Name"}
            }
        }

    def to_mongo(self):
        """Convert UUIDs and datetime to strings for MongoDB."""
        data = self.dict()
        data["id"] = str(self.id)
        data["uploaded_at"] = data["uploaded_at"].isoformat()
        return data


# ============================
# FEEDBACK MODEL
# ============================
class Feedback(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    subject: str
    message: str
    status: Literal["pending", "in_progress", "resolved", "closed"] = "pending"
    admin_response: Optional[str] = None
    responded_by: Optional[str] = None  # admin user_id
    responded_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "740729b6-aa3c-47f1-a043-4425ed5d70eb",
                "user_name": "John Doe",
                "user_email": "john@example.com",
                "subject": "Feature Request",
                "message": "I would like to see a dark mode feature.",
                "status": "pending",
                "admin_response": None,
                "responded_by": None,
                "responded_at": None,
                "created_at": "2025-10-30T12:00:00Z",
                "updated_at": "2025-10-30T12:00:00Z"
            }
        }

    def to_mongo(self):
        """Convert UUIDs and datetime to strings for MongoDB."""
        data = self.dict()
        data["id"] = str(self.id)
        data["created_at"] = data["created_at"].isoformat()
        data["updated_at"] = data["updated_at"].isoformat()
        if data.get("responded_at"):
            data["responded_at"] = data["responded_at"].isoformat()
        return data


# ============================
# CHAT FEEDBACK MODEL
# ============================
class ChatFeedback(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    chat_session_id: str
    message_index: int  # Index of the message in the chat (0-based for Q&A pairs)
    rating: Optional[Literal["positive", "negative", "neutral"]] = None  # User's rating of the response (optional)
    star_rating: Optional[int] = Field(None, ge=1, le=5)  # 1-5 star rating
    comment: Optional[str] = None  # Optional comment/feedback text
    question: str  # The user's question
    answer: str  # The LLM's answer
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "740729b6-aa3c-47f1-a043-4425ed5d70eb",
                "user_name": "John Doe",
                "user_email": "john@example.com",
                "chat_session_id": "chat-123",
                "message_index": 0,
                "rating": "positive",
                "comment": "Very helpful response!",
                "question": "What is deep learning?",
                "answer": "Deep learning is a subset of machine learning...",
                "created_at": "2025-10-30T12:00:00Z"
            }
        }

    def to_mongo(self):
        """Convert UUIDs and datetime to strings for MongoDB."""
        data = self.dict()
        data["id"] = str(self.id)
        data["created_at"] = data["created_at"].isoformat()
        return data