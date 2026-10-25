from fastapi import APIRouter
from pathlib import Path

from osdagbridge_core.utils import common

router = APIRouter()

'''
    Returns all the constants and keys in common.py 
'''

@router.get("/constants") 
def get_keys_constants():
    try:
        keys_constants_dict = {
            name: value
            for name, value in vars(common).items() #gets items in the module as a dictionary to evaluate every single key value pair
            if (name.isupper() or name.startswith("KEY_"))   # keeps KEY_..._kN names
            and "_" in name
            and not isinstance(value, Path) #excluding any paths
            and not callable(value)  # Filters out functions and methods
            and not isinstance(value, type)  # Filters out classes
        }
    except ImportError as e:
            print("CORE IMPORT ERROR:", e)
            raise
    return [keys_constants_dict]