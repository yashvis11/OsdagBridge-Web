from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

#Changed label property to Optional[str] = None to accommodate module type ui fields with "None" as label
class UIFieldSchema(BaseModel):
    key: str
    label: Optional[str] = None
    ui_type: str = Field(..., description="'number' | 'text' | 'select' | 'button'")
    default: Optional[Union[float, int, str, bool]] = None
    min: Optional[float] = None
    max: Optional[float] = None
    unit: Optional[str] = None
    container: Optional[str] = "main"
    group: Optional[str] = "General"
    options: Optional[List[str]] = []
    placeholder: Optional[str] = None
    required: bool = False
    action: Optional[str] = None
    visibility: Optional[bool] = True
    validator: Optional[str ] = None

    # id: str
    # label: Optional[str] = None  
    # type: str = Field(..., description="'number' | 'text' | 'select' | 'button'")
    # default_value: Optional[Union[float, int, str, bool]] = None
    # unit: Optional[str] = None
    # options: Optional[List[str]] = []

class ValidateFieldRequest(BaseModel):
    key: str
    value: Any
    all_inputs: Dict[str, Any] = {}

class ValidateFieldResponse(BaseModel):
    valid: bool
    corrected_value: Optional[Any] = None
    message: Optional[str] = None

class LocationStateResponse(BaseModel):
    states: List[str]

class LocationStationResponse(BaseModel):
    state: str
    stations: List[str]

class LocationDataResponse(BaseModel):
    state: str
    station: str
    basic_wind_speed: float = Field(..., description="V_b in m/s (IRC 6)")
    seismic_zone: str = Field(..., description="Zone II, III, IV, or V")
    max_temperature: float = Field(..., description="T_max in °C")
    min_temperature: float = Field(..., description="T_min in °C")
