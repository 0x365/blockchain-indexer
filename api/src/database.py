import os
import pymysql
from fastapi import HTTPException
from typing import Optional, List

# Helper function to connect to database
def query_database(query: str, params: Optional[List] = []):
    DB_CONFIG = {
        "host": os.getenv("DB_HOST"),
        "user": os.getenv("MYSQL_USER"),
        "password": os.getenv("MYSQL_PASSWORD"),
        "database": os.getenv("MYSQL_DATABASE"),
        "cursorclass": pymysql.cursors.DictCursor,
    }
    connection = pymysql.connect(**DB_CONFIG)
    try:
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        connection.close()