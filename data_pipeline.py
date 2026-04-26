import os
import osmnx as ox
import networkx as nx
import pandas as pd
import random
import numpy as np

# --- 1️⃣ SETUP & CONSTANTS ---
CITY_NAME = "Ludhiana, Punjab, India"
# For faster testing, use a small radius if needed
# But we'll try the full city first as requested
NUM_DELIVERIES = 20
DATA_DIR = "data"
GRAPH_PATH = os.path.join(DATA_DIR, "map.graphml")
DELIVERIES_PATH = os.path.join(DATA_DIR, "deliveries.csv")

# Ensure data directory exists
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def download_map_data(city_name, graph_path):
    """
    2️⃣ DOWNLOAD MAP DATA
    Downloads the road network for the specified city and saves it.
    """
    print(f"Downloading road network for {city_name}...")
    # Download graph from OSMnx
    G = ox.graph_from_place(city_name, network_type='drive')
    
    # Save graph as graphml
    ox.save_graphml(G, graph_path)
    print(f"Map saved to {graph_path}")
    return G

def generate_delivery_points(G, n):
    """
    3️⃣ GENERATE DELIVERY POINTS
    Generates random delivery locations near the center of the graph.
    """
    print(f"Generating {n} delivery points...")
    
    # Get nodes as a GeoDataFrame to find the center/bounds
    nodes_gdf = ox.graph_to_gdfs(G, edges=False)
    center_lat = nodes_gdf.geometry.y.mean()
    center_lon = nodes_gdf.geometry.x.mean()
    
    # Simple bounding box for randomness
    lat_min, lat_max = nodes_gdf.geometry.y.min(), nodes_gdf.geometry.y.max()
    lon_min, lon_max = nodes_gdf.geometry.x.min(), nodes_gdf.geometry.x.max()
    
    # For Ludhiana specifically, we can use a tighter range if needed
    # but let's stick to the graph's extent.
    
    deliveries = []
    for _ in range(n):
        # Generate random lat/lon within bounds
        lat = random.uniform(lat_min, lat_max)
        lon = random.uniform(lon_min, lon_max)
        deliveries.append({'lat': lat, 'lon': lon})
        
    return pd.DataFrame(deliveries)

def map_points_to_nodes(G, df):
    """
    4️⃣ MAP POINTS TO GRAPH NODES
    Converts (lat, lon) coordinates to the nearest graph node IDs.
    """
    print("Mapping delivery locations to nearest graph nodes...")
    
    # osmnx nearest_nodes function
    node_ids = ox.nearest_nodes(G, X=df['lon'], Y=df['lat'])
    df['mapped_node_id'] = node_ids
    
    # Also get the exact coordinates of those nodes
    nodes_gdf = ox.graph_to_gdfs(G, edges=False)
    df['node_lat'] = df['mapped_node_id'].apply(lambda x: nodes_gdf.loc[x].geometry.y)
    df['node_lon'] = df['mapped_node_id'].apply(lambda x: nodes_gdf.loc[x].geometry.x)
    
    return df

def add_delivery_features(df):
    """
    5️⃣ ADD DELIVERY FEATURES
    Adds realistic attributes like deadline and priority to deliveries.
    """
    print("Adding delivery attributes (deadline, priority)...")
    
    df['delivery_id'] = range(1, len(df) + 1)
    # Deadline: random 10 to 60 minutes
    df['deadline_min'] = [random.randint(10, 60) for _ in range(len(df))]
    # Priority: low, medium, high
    df['priority'] = [random.choice(['low', 'medium', 'high']) for _ in range(len(df))]
    
    return df

def simulate_traffic(G):
    """
    6️⃣ SIMULATE TRAFFIC
    Assigns random traffic multipliers to edges and computes weighted travel time.
    """
    print("Simulating traffic conditions on road network...")
    
    # Assign traffic multipliers (1.0 to 2.0)
    for u, v, k, data in G.edges(data=True, keys=True):
        traffic_multiplier = round(random.uniform(1.0, 2.0), 2)
        data['traffic_multiplier'] = traffic_multiplier
        # Calculate new weight: length * traffic
        # Assuming length is already in meters (standard OSMnx)
        if 'length' in data:
            data['travel_weight'] = data['length'] * traffic_multiplier
        else:
            # Fallback if length is missing
            data['travel_weight'] = 1.0 * traffic_multiplier
            
    return G

def save_data(G, df, graph_path, deliveries_path):
    """
    7️⃣ SAVE DATA
    Saves the processed graph and deliveries dataset.
    """
    print(f"Saving final data to {DATA_DIR}...")
    ox.save_graphml(G, graph_path)
    df.to_csv(deliveries_path, index=False)
    print("All data saved successfully.")

def reload_saved_graph(graph_path):
    """
    9️⃣ BONUS: Reload function
    Loads a saved graph from disk.
    """
    if os.path.exists(graph_path):
        return ox.load_graphml(graph_path)
    return None

def main():
    # 2️⃣ Download map
    G = download_map_data(CITY_NAME, GRAPH_PATH)
    
    # 3️⃣ Generate delivery points
    deliveries_df = generate_delivery_points(G, NUM_DELIVERIES)
    
    # 4️⃣ Map to nodes
    deliveries_df = map_points_to_nodes(G, deliveries_df)
    
    # 5️⃣ Add features
    deliveries_df = add_delivery_features(deliveries_df)
    
    # 6️⃣ Simulate traffic
    G = simulate_traffic(G)
    
    # 7️⃣ Save data
    save_data(G, deliveries_df, GRAPH_PATH, DELIVERIES_PATH)
    
    # 9️⃣ SUMMARY
    print("\n--- PIPELINE SUMMARY ---")
    print(f"City: {CITY_NAME}")
    print(f"Number of nodes: {len(G.nodes)}")
    print(f"Number of edges: {len(G.edges)}")
    print(f"Number of deliveries: {len(deliveries_df)}")
    print(f"Graph saved: {GRAPH_PATH}")
    print(f"Deliveries saved: {DELIVERIES_PATH}")
    print("----------------------------\n")

if __name__ == "__main__":
    main()
