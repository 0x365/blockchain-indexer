from typing import Optional, List
from fastapi import APIRouter

from ..database import *

router = APIRouter()

@router.get("/events")
def get_data(
    event_id: Optional[int] = None,
    contract_address: Optional[str] = None,
    event_name: Optional[str] = None,
    contract_name: Optional[str] = None
):
    query = "SELECT * FROM events WHERE 1=1"
    params = []

    if event_id is not None:
        query += " AND event_id = %s"
        params.append(event_id)
    if contract_address is not None:
        query += " AND contract_address = %s"
        params.append(contract_address)
    if event_name is not None:
        query += " AND event_name = %s"
        params.append(event_name)
    if contract_name is not None:
        query += " AND contract_name = %s"
        params.append(contract_name)

    results = query_database(query, params)

    return results