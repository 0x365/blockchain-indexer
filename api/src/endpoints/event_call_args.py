from typing import Optional, List
from fastapi import APIRouter

from ..database import *

router = APIRouter()

@router.get("/event_call_args")
def get_data(
    tx_hash: Optional[str] = None,
    arg_name: Optional[str] = None,
    arg_value: Optional[str] = None,
    arg_value_lower: Optional[int] = None,
    arg_value_upper: Optional[int] = None
):
    query = "SELECT * FROM event_call_args WHERE 1=1"
    params = []
    
    if tx_hash is not None:
        query += " AND tx_hash = %s"
        params.append(tx_hash)
    if arg_name is not None:
        query += " AND arg_name = %s"
        params.append(arg_name)
    if arg_value is not None:
        query += " AND arg_value = %s"
        params.append(arg_value)
    if arg_value_lower is not None:
        query += " AND CAST(arg_value AS INT) > %s"
        params.append(arg_value_lower)
    if arg_value_upper is not None:
        query += " AND CAST(arg_value AS INT) < %s"
        params.append(arg_value_upper)

    query += " ORDER BY arg_name ASC;"
    results = query_database(query, params)

    if tx_hash and all(v is None for v in [arg_name, arg_value, arg_value_lower, arg_value_upper]):
        final_results = {}
        for result in results:
            final_results[result["arg_name"]] = result["arg_value"]
        return final_results
    else:
        return results