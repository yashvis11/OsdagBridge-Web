from fastapi import APIRouter
from app.models.schemas import ValidateFieldRequest, ValidateFieldResponse

router = APIRouter(prefix="/validate", tags=["Validation"])
@router.post("/field", response_model=ValidateFieldResponse)
@router.post("", response_model=ValidateFieldResponse)
def validate_field(payload: ValidateFieldRequest):
    """
    Validates a single input field against IRC / Osdag design constraints
    """
    key = payload.key
    val = payload.value
    try:
        from osdagbridge.core.bridge_types.plate_girder.validator import BridgeInputValidator
        validator = BridgeInputValidator()
        result = validator.validate_basic_inputs(key, payload.all_inputs or {key: val})
        if result is not None:
            corrected, msg = result
            return ValidateFieldResponse(valid=False, corrected_value=corrected, message=msg)
        return ValidateFieldResponse(valid=True)
    
    except Exception as e:
        print("Validator error:", e)
        raise

