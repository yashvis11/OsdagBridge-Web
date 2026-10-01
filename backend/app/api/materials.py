from fastapi import APIRouter

router = APIRouter(prefix="/materials", tags=["Materials"])

@router.get("/steel")
def get_steel_options():
    try:
        from osdagbridge.core.bridge_types.plate_girder.defaults import steel_properties

        return steel_properties #return all the steel_properties data from the database via the default.py file
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise

@router.get("/concrete")
def get_concrete_options():
    try:
        from osdagbridge.core.bridge_types.plate_girder.defaults import concrete_properies

        return concrete_properies
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise
