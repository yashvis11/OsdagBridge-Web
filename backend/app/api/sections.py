from fastapi import APIRouter
from typing import List
from app.models.schemas import UIFieldSchema

router = APIRouter(prefix="/sections", tags=["Schema"])
@router.get("/rolled", response_model=[])
def get_rolled_sections():
    """
    Returns the sections from the core database as a READ only
    """
    try:

        from osdagbridge.core.utils.common import girder_catalog

        sections = girder_catalog.list_available_sections()
        rolled_section_result = []

        for section in sections.values():  #value provides the BeamSection object and all its properties instead of just the designation
            print(section.designation, repr(section.type_name))
            rolled_section_result.append({
                "designation": section.designation,                 
                "type_name": section.type_name,
                "mass_per_meter_kg": section.mass_per_meter_kg,
                "area_cm2": section.area_cm2,
                "depth_mm": section.depth_mm,
                "flange_width_mm": section.flange_width_mm,
                "web_thickness_mm": section.web_thickness_mm,
                "flange_thickness_mm": section.flange_thickness_mm,          
                "root_radius_mm": section.root_radius_mm,
                "toe_radius_mm": section.toe_radius_mm,                
                "moment_of_inertia_zz_cm4": section.moment_of_inertia_zz_cm4,
                "moment_of_inertia_yy_cm4": section.moment_of_inertia_yy_cm4,    
                "radius_of_gyration_z_cm": section.radius_of_gyration_z_cm,     
                "radius_of_gyration_y_cm": section.radius_of_gyration_y_cm,     
                "elastic_section_modulus_z_cm3": section.elastic_section_modulus_z_cm3,
                "elastic_section_modulus_y_cm3": section.elastic_section_modulus_y_cm3,
                "plastic_section_modulus_z_cm3": section.plastic_section_modulus_z_cm3,
                "plastic_section_modulus_y_cm3": section.plastic_section_modulus_y_cm3,
                "torsion_constant_cm4": section.torsion_constant_cm4,
                "warping_constant_cm6": section.warping_constant_cm6
            })
        return rolled_section_result
    except ImportError as e:
        print("CORE IMPORT ERROR:", e)
        raise
