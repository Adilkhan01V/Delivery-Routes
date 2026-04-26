import osmnx as ox

def get_route_coordinates(G, node_ids):
    """Converts a list of node IDs to their lat/lon coordinates."""
    if not node_ids:
        return []
    
    # Get node attributes (latitude and longitude)
    nodes_data = G.nodes(data=True)
    
    coordinates = []
    for node_id in node_ids:
        try:
            node_data = nodes_data[node_id]
            coordinates.append({
                "lat": node_data['y'],
                "lon": node_data['x']
            })
        except KeyError:
            # Handle cases where a node might not be in the graph
            # This shouldn't happen if the graph is consistent
            print(f"Warning: Node ID {node_id} not found in graph.")
            
    return coordinates
