from datetime import datetime

from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool = True
    message: str = "ok"


class HealthResponse(BaseModel):
    status: str
    app: str
    env: str
    timestamp: datetime

