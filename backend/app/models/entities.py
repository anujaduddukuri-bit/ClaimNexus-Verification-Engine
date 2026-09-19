import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class ExecutionDB(Base):
    __tablename__ = "executions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    query = Column(Text, nullable=False)
    mode = Column(String, default="BALANCED")
    demo_mode = Column(Boolean, default=False)
    status = Column(String, default="RUNNING") # RUNNING, COMPLETED, FAILED
    total_latency = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    models = relationship("ModelRunDB", back_populates="execution", cascade="all, delete-orphan")
    claims = relationship("ClaimDB", back_populates="execution", cascade="all, delete-orphan")
    clusters = relationship("ClusterDB", back_populates="execution", cascade="all, delete-orphan")
    conflicts = relationship("ConflictDB", back_populates="execution", cascade="all, delete-orphan")
    synthesis = relationship("SynthesisDB", back_populates="execution", uselist=False, cascade="all, delete-orphan")
    events = relationship("ExecutionEventDB", back_populates="execution", cascade="all, delete-orphan")
    evidence = relationship("EvidenceDB", back_populates="execution", cascade="all, delete-orphan")

class ModelRunDB(Base):
    __tablename__ = "model_runs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    model_name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    response_text = Column(Text, nullable=True)
    latency_seconds = Column(Float, default=0.0)
    token_count = Column(Integer, default=0)
    claims_count = Column(Integer, default=0)
    confidence_score = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    execution = relationship("ExecutionDB", back_populates="models")

class ClaimDB(Base):
    __tablename__ = "claims"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    claim_id = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    source_model = Column(String, nullable=False)
    confidence = Column(Float, default=0.0)
    category = Column(String, default="factual")
    reasoning_summary = Column(Text, nullable=True)
    supporting_context = Column(Text, nullable=True)
    embedding = Column(JSON, nullable=True)
    
    execution = relationship("ExecutionDB", back_populates="claims")

class EvidenceDB(Base):
    __tablename__ = "evidence_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    evidence_id = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    source_title = Column(String, nullable=False)
    source_url = Column(String, nullable=False)
    source_type = Column(String, default="Research")
    relationship_type = Column(String, default="SUPPORTS")
    quality = Column(String, default="HIGH")
    timestamp = Column(String, nullable=True)
    research_agent = Column(String, nullable=True)
    
    execution = relationship("ExecutionDB", back_populates="evidence")

class ClusterDB(Base):
    __tablename__ = "consensus_clusters"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    cluster_id = Column(String, nullable=False)
    canonical_claim = Column(Text, nullable=False)
    supporting_models = Column(JSON, nullable=False)
    consensus_percentage = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    status = Column(String, nullable=False)
    claims_data = Column(JSON, nullable=False)
    
    execution = relationship("ExecutionDB", back_populates="clusters")

class ConflictDB(Base):
    __tablename__ = "conflicts"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    conflict_id = Column(String, nullable=False)
    claim_a = Column(JSON, nullable=False)
    claim_b = Column(JSON, nullable=False)
    models_a = Column(JSON, nullable=False)
    models_b = Column(JSON, nullable=False)
    semantic_similarity = Column(Float, default=0.0)
    severity = Column(String, default="medium")
    explanation = Column(Text, nullable=False)
    
    execution = relationship("ExecutionDB", back_populates="conflicts")

class SynthesisDB(Base):
    __tablename__ = "synthesis_results"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    final_answer = Column(Text, nullable=False)
    consensus_summary = Column(Text, nullable=False)
    conflicts_breakdown = Column(JSON, nullable=False)
    confidence_score = Column(Float, default=0.0)
    model_agreements = Column(JSON, nullable=False)
    uncertainty_notes = Column(Text, nullable=True)
    critic_findings = Column(JSON, nullable=True)
    verdict = Column(String, default="PARTIALLY_SUPPORTED")
    why_this_result = Column(JSON, nullable=True)
    
    execution = relationship("ExecutionDB", back_populates="synthesis")

class ExecutionEventDB(Base):
    __tablename__ = "execution_events"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False)
    step = Column(String, nullable=False)
    status = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    
    execution = relationship("ExecutionDB", back_populates="events")
