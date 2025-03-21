from typing import Optional, List
from fastapi import APIRouter

from ..database import *

router = APIRouter()

@router.get("/event_calls")
def get_data(
    tx_hash: Optional[str] = None,
    event_id: Optional[int] = None,
    block_number: Optional[int] = None,
    block_number_lower: Optional[int] = None,
    block_number_upper: Optional[int] = None
):
    query = "SELECT * FROM event_calls WHERE 1=1"
    params = []
    
    if tx_hash is not None:
        query += " AND tx_hash = %s"
        params.append(tx_hash)
    if event_id is not None:
        query += " AND event_id = %s"
        params.append(event_id)
    if block_number is not None:
        query += " AND block_number = %s"
        params.append(block_number)
    if block_number_lower is not None:
        query += " AND CAST(block_number AS INT) > %s"
        params.append(block_number_lower)
    if block_number_upper is not None:
        query += " AND CAST(block_number AS INT) < %s"
        params.append(block_number_upper)

    query += " ORDER BY block_number ASC;"
    results = query_database(query, params)

    return results