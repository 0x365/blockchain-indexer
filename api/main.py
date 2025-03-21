# API endpoint for database (FastAPI)
# Author: Robert Cowlishaw (0x365)
# Start with: uvicorn web2_api:app --reload

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.endpoints import *

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Enable CORS (for frontend compatibility)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS ---
for file in os.listdir("src/endpoints"):
    if file.endswith(".py") and file != "__init__.py":
        module_name = f"src.endpoints.{file[:-3]}"
        module = importlib.import_module(module_name)
        if hasattr(module, "router"):
            app.include_router(module.router, prefix="")