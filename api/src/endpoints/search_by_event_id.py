from typing import Optional, List
from fastapi import APIRouter

from ..database import *

router = APIRouter()

@router.get("/search_by_event_id")
def get_data(
    event_id: Optional[str] = None
):
    
    if event_id is None:
        return {}
    
    query = """
        SELECT 
            ec.tx_hash,
            ec.event_id,
            ec.block_number,
            JSON_OBJECTAGG(eca.arg_name, eca.arg_value) AS args
        FROM event_calls ec
        JOIN event_call_args eca ON ec.tx_hash = eca.tx_hash
        WHERE ec.event_id = %s
        GROUP BY ec.tx_hash, ec.event_id, ec.block_number
        ORDER BY ec.block_number;
    """
    params = [event_id]

    results = query_database(query, params)
    for row in results:
        try:
            row["args"] = json.loads(row["args"])
        except:
            pass

    return results