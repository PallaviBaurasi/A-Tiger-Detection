import json
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

class AuditService:
    @staticmethod
    def log(
        db: Session,
        employee_id: str,
        action: str,
        entity_type: str = None,
        entity_id: str = None,
        previous_value: str = None,
        new_value: str = None,
        ip_address: str = None
    ):
        audit = AuditLog(
            user_employee_id=employee_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id else None,
            previous_value=previous_value if isinstance(previous_value, str) else json.dumps(previous_value) if previous_value else None,
            new_value=new_value if isinstance(new_value, str) else json.dumps(new_value) if new_value else None,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()
        return audit
