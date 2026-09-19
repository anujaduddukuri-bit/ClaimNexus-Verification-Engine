import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.domain import QueryRequest, ExecutionDetailResponse
from app.database.session import get_db
from app.agents.orchestrator import orchestrator

router = APIRouter(prefix="/consensus", tags=["Consensus Engine"])

@router.post("/run", response_model=ExecutionDetailResponse)
async def run_consensus_engine(
    request: QueryRequest,
    db: Session = Depends(get_db)
):
    """Execute multi-model consensus and synthesis pipeline."""
    execution_id = f"exec_{uuid.uuid4().hex[:8]}"
    try:
        result = await orchestrator.run_pipeline(
            execution_id=execution_id,
            request=request,
            db_session=db
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Execution error: {str(e)}")
