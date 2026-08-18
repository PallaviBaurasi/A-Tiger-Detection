import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.run import ProcessingRun
from app.models.image import Image
from app.models.station import CameraStation
from app.schemas.run import ProcessingRunResponse
from app.services.storage_service import StorageService
from app.services.triage_service import TriageService

router = APIRouter(prefix="/processing-runs", tags=["Processing Runs"])

@router.post("", response_model=ProcessingRunResponse)
async def create_processing_run(
    background_tasks: BackgroundTasks,
    station_id: int = Form(...),
    captured_at: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    station = db.query(CameraStation).filter(CameraStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Camera station not found")

    # Create run record
    run = ProcessingRun(
        started_at=datetime.datetime.utcnow(),
        total_images=len(files),
        status="RUNNING"
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    image_ids = []
    cap_dt = datetime.datetime.fromisoformat(captured_at) if captured_at else datetime.datetime.utcnow()

    for idx, file in enumerate(files):
        content = await file.read()
        fname = f"run_{run.id}_stn_{station.id}_{idx}_{file.filename}"
        raw_path = StorageService.save_raw_image(content, fname)

        img = Image(
            filename=fname,
            original_path=raw_path,
            station_id=station.id,
            captured_at=cap_dt,
            file_size=len(content),
            status="PENDING",
            processing_run_id=run.id
        )
        db.add(img)
        db.commit()
        db.refresh(img)
        image_ids.append(img.id)

    # Launch processing pipeline task
    triage_service = TriageService(db)
    background_tasks.add_task(triage_service.process_run, run.id, image_ids)

    return run

@router.get("", response_model=List[ProcessingRunResponse])
def list_processing_runs(db: Session = Depends(get_db)):
    return db.query(ProcessingRun).order_by(ProcessingRun.started_at.desc()).all()

@router.get("/{run_id}", response_model=ProcessingRunResponse)
def get_processing_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(ProcessingRun).filter(ProcessingRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Processing run not found")
    return run
