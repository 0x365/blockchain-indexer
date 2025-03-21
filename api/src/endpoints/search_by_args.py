from typing import Optional, List
from fastapi import APIRouter

from ..database import *

router = APIRouter()

@router.get("/search_by_arg")
def get_data(
    arg_name: Optional[str] = None,
    arg_value: Optional[str] = None,
):
    # query = "SELECT * FROM event_calls WHERE 1=1"
    # params = []
    
    if arg_name is None or arg_value is None:
        return {}
    
    query = """
        SELECT 
            ec.tx_hash,
            ec.event_id,
            ec.block_number,
            JSON_OBJECTAGG(eca.arg_name, eca.arg_value) AS args
        FROM event_calls ec
        JOIN event_call_args eca ON ec.tx_hash = eca.tx_hash
        WHERE ec.tx_hash IN (
            SELECT tx_hash FROM event_call_args 
            WHERE arg_name = %s AND arg_value = %s
        )
        GROUP BY ec.tx_hash, ec.event_id, ec.block_number
        ORDER BY ec.block_number;
    """
    params = [arg_name, arg_value]

    results = query_database(query, params)
    for row in results:
        try:
            row["args"] = json.loads(row["args"])
        except:
            pass

    return results