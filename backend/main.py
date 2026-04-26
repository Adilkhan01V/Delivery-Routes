import os
import logging
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Import from our existing modules
from backend.routing_engine import (
    load_resources as load_routing_resources,
    build_distance_matrix,
    solve_vrp,
    generate_full_route
)
from backend.utils import get_route_coordinates

# Import generation logic from data_pipeline
from data_pipeline import (
    generate_delivery_points,
    map_points_to_nodes,
    add_delivery_features,
    NUM_DELIVERIES
)

from fastapi.responses import RedirectResponse, Response

# --- 1️⃣ INITIAL SETUP ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Optimized Delivery Routes API",
    description="API for computing optimized delivery routes.",
    version="1.0.0"
)

# --- Root Redirect to Docs ---
@app.get("/")
def root():
    """Redirects the root URL to the API documentation."""
    return RedirectResponse(url="/docs")

# --- Favicon Handler ---
@app.get("/favicon.ico")
def favicon():
    """Returns a 204 No Content response for favicon requests."""
    return Response(status_code=204)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# --- 2️⃣ LOAD DATA ON STARTUP ---
GRAPH_PATH = os.path.join("data", "map.graphml")
DELIVERIES_PATH = os.path.join("data", "deliveries.csv")

# Global variables to hold loaded data
graph = None
deliveries_df = None

@app.on_event("startup")
def startup_event():
    """Load graph and delivery data when the server starts."""
    global graph, deliveries_df
    logger.info("Loading data on startup...")
    try:
        # Use the loader from the routing engine to ensure consistency
        graph, _ = load_routing_resources() # We only need the graph here
        deliveries_df = pd.read_csv(DELIVERIES_PATH)
        logger.info("Data loaded successfully.")
    except FileNotFoundError as e:
        logger.error(f"Failed to load data: {e}")
        # In a real app, you might want to prevent startup
        # For now, we log the error and endpoints will fail gracefully

# --- 3️⃣ API ENDPOINTS ---

# --- Health Check ---
@app.get("/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "running"}

# --- Get Deliveries ---
@app.get("/deliveries")
def get_deliveries():
    """Returns a list of all available delivery points."""
    global deliveries_df
    if deliveries_df is None:
        # Try to reload if it's somehow None
        try:
            deliveries_df = pd.read_csv(DELIVERIES_PATH)
        except Exception:
            raise HTTPException(status_code=503, detail="Deliveries data not available.")
    
    # Convert to a more friendly format for JSON
    result = deliveries_df.rename(columns={'delivery_id': 'id'})
    return result.to_dict(orient='records')

# --- Generate New Deliveries ---
class GenerateRequest(BaseModel):
    count: Optional[int] = NUM_DELIVERIES

@app.post("/generate-deliveries")
def generate_new_deliveries(request: GenerateRequest):
    """3️⃣ ADD RANDOM DELIVERY GENERATION API"""
    global graph, deliveries_df
    if graph is None:
        raise HTTPException(status_code=503, detail="Map graph not loaded.")
    
    count = request.count if request.count and request.count > 0 else NUM_DELIVERIES
    logger.info(f"Regenerating {count} synthetic delivery points...")
    try:
        # Generate new points
        new_df = generate_delivery_points(graph, count)
        # Map to nodes
        new_df = map_points_to_nodes(graph, new_df)
        # Add features
        new_df = add_delivery_features(new_df)
        
        # Overwrite deliveries.csv
        new_df.to_csv(DELIVERIES_PATH, index=False)
        
        # 4️⃣ RELOAD DATA AFTER GENERATION
        deliveries_df = new_df
        
        logger.info("New deliveries generated and reloaded.")
        return {"message": "New deliveries generated"}
    except Exception as e:
        logger.error(f"Failed to generate deliveries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Optimize Route ---
class OptimizeRequest(BaseModel):
    delivery_ids: Optional[List[int]] = None

@app.post("/optimize-route")
def optimize_route(request: OptimizeRequest):
    """Computes and returns the optimized delivery route."""
    if graph is None or deliveries_df is None:
        raise HTTPException(status_code=503, detail="Server data not loaded.")

    logger.info("Route optimization started.")

    # Filter deliveries based on request, or use all
    if request.delivery_ids:
        target_df = deliveries_df[deliveries_df['delivery_id'].isin(request.delivery_ids)]
        if len(target_df) != len(request.delivery_ids):
            raise HTTPException(status_code=404, detail="One or more delivery IDs not found.")
    else:
        target_df = deliveries_df

    if target_df.empty:
        raise HTTPException(status_code=400, detail="No deliveries to optimize.")

    delivery_nodes = target_df['mapped_node_id'].tolist()

    # --- 4️⃣ INTEGRATE ROUTING ENGINE ---
    try:
        # 1. Build distance matrix
        dist_matrix = build_distance_matrix(graph, delivery_nodes)

        # 2. Solve VRP
        optimized_indices = solve_vrp(dist_matrix)
        if not optimized_indices:
            raise HTTPException(status_code=500, detail="Could not solve VRP.")

        # 3. Generate the full route path
        order, total_cost, full_route_nodes = generate_full_route(graph, delivery_nodes, optimized_indices)

        # 4. Get coordinates for the route
        coordinates = get_route_coordinates(graph, full_route_nodes)

        logger.info("Route optimization completed.")

        # --- 5️⃣ RESPONSE FORMATTING ---
        return {
            "order": [int(node) for node in order],
            "total_cost": float(total_cost),
            "route": [int(node) for node in full_route_nodes],
            "coordinates": coordinates
        }

    except Exception as e:
        logger.error(f"An error occurred during optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))
