import os
import json
import pandas as pd
import networkx as nx
import osmnx as ox
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

# --- 1️⃣ LOAD DATA ---
GRAPH_PATH = os.path.join("data", "map.graphml")
DELIVERIES_PATH = os.path.join("data", "deliveries.csv")
OUTPUT_PATH = "optimized_route.json"

def load_resources():
    """Loads the graph and delivery data."""
    print(f"Loading graph from {GRAPH_PATH}...")
    if not os.path.exists(GRAPH_PATH):
        raise FileNotFoundError(f"Graph file not found: {GRAPH_PATH}")
    G = ox.load_graphml(GRAPH_PATH)
    
    # Pre-process graph: ensure it's strongly connected or simplify it
    # For a routing engine to work reliably between any two nodes, 
    # we should work with the largest strongly connected component.
    print("Ensuring graph is strongly connected...")
    G = ox.truncate.largest_component(G, strongly=True)

    # Convert travel_weight to float (it may be loaded as string)
    for u, v, k, d in G.edges(data=True, keys=True):
        if 'travel_weight' in d:
            try:
                d['travel_weight'] = float(d['travel_weight'])
            except (ValueError, TypeError):
                d['travel_weight'] = 1.0
        else:
            d['travel_weight'] = 1.0

    print(f"Loading deliveries from {DELIVERIES_PATH}...")
    if not os.path.exists(DELIVERIES_PATH):
        raise FileNotFoundError(f"Deliveries file not found: {DELIVERIES_PATH}")
    df = pd.read_csv(DELIVERIES_PATH)
    
    # Re-map delivery nodes to the nearest nodes in the new simplified graph
    print("Re-mapping deliveries to the strongly connected component...")
    new_node_ids = ox.nearest_nodes(G, X=df['lon'], Y=df['lat'])
    df['mapped_node_id'] = new_node_ids
    
    # Extract mapped node IDs
    delivery_nodes = df['mapped_node_id'].tolist()
    return G, delivery_nodes

# --- 2️⃣ A* SHORTEST PATH FUNCTION ---
def get_shortest_path(G, source, target):
    """Computes the shortest path using A* algorithm based on travel_weight."""
    try:
        # Check if nodes exist in graph
        if source not in G or target not in G:
            print(f"Skipping unreachable node: {source} or {target} not in graph")
            return None, float('inf')
            
        # Using astar_path with travel_weight
        path = nx.astar_path(G, source, target, weight='travel_weight')
        # Calculate total cost (sum of travel_weight along the path)
        cost = sum(G.get_edge_data(u, v, 0).get('travel_weight', 1.0) 
                   for u, v in zip(path[:-1], path[1:]))
        return path, cost
    except nx.NetworkXNoPath:
        print(f"Warning: No path found between {source} and {target}")
        return None, float('inf')
    except Exception as e:
        print(f"Error computing path: {e}")
        return None, float('inf')

# --- 3️⃣ BUILD DISTANCE MATRIX ---
def build_distance_matrix(G, nodes):
    """Computes pairwise shortest path costs between all delivery points."""
    print(f"Computing distance matrix for {len(nodes)} delivery points...")
    matrix = []
    # A large number to represent infinity, but not float('inf')
    infinity_surrogate = 999999999 

    for i, source in enumerate(nodes):
        row = []
        for j, target in enumerate(nodes):
            if i == j:
                row.append(0)
            else:
                _, cost = get_shortest_path(G, source, target)
                if cost == float('inf'):
                    row.append(infinity_surrogate)
                else:
                    row.append(int(cost))
        matrix.append(row)
    return matrix

# --- 4️⃣ VRP SOLVER (OR-TOOLS) ---
def solve_vrp(distance_matrix):
    """Solves the Vehicle Routing Problem using Google OR-Tools."""
    print("Solving VRP...")
    
    n = len(distance_matrix)
    
    # Data model
    data = {}
    data['distance_matrix'] = distance_matrix
    data['num_vehicles'] = 1
    data['depot'] = 0  # Start from the first node in the list

    # Create the routing index manager
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']),
                                           data['num_vehicles'], data['depot'])

    # Create Routing Model
    routing = pywrapcp.RoutingModel(manager)

    # Create and register a transit callback
    def distance_callback(from_index, to_index):
        """Returns the distance between the two nodes."""
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)

    # Define cost of each arc
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Setting first solution heuristic - use SAVINGS for TSP-like problem
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.SAVINGS)
    
    # Limit search to prevent infinite loops
    search_parameters.log_search = False

    # Solve the problem
    assignment = routing.SolveWithParameters(search_parameters)

    if assignment:
        # Extract the optimized order
        index = routing.Start(0)
        route_order = []
        while not routing.IsEnd(index):
            route_order.append(manager.IndexToNode(index))
            index = assignment.Value(routing.NextVar(index))
        return route_order
    else:
        print("Error: Could not solve VRP.")
        return None

# --- 5️⃣ GENERATE FINAL ROUTE ---
def generate_full_route(G, delivery_nodes, optimized_indices):
    """Converts optimized order to actual path nodes and calculates total cost."""
    full_route_nodes = []
    total_cost = 0
    ordered_nodes = [delivery_nodes[i] for i in optimized_indices]
    
    print("Generating full route path...")
    for i in range(len(ordered_nodes) - 1):
        source = ordered_nodes[i]
        target = ordered_nodes[i+1]
        path, cost = get_shortest_path(G, source, target)
        
        if path:
            # Avoid duplicating nodes at connections
            if full_route_nodes:
                full_route_nodes.extend(path[1:])
            else:
                full_route_nodes.extend(path)
            total_cost += cost
            
    return ordered_nodes, total_cost, full_route_nodes

# --- 7️⃣ SAVE OUTPUT ---
def save_output(order, total_cost, full_route):
    """Saves the results to a JSON file."""
    output = {
        "order": [str(node) for node in order],
        "total_cost": total_cost,
        "route": [str(node) for node in full_route]
    }
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f, indent=4)
    print(f"Optimized route saved to {OUTPUT_PATH}")

# --- MAIN EXECUTION ---
def main():
    try:
        # 1. Load Data
        G, delivery_nodes = load_resources()
        
        # 3. Build Distance Matrix
        dist_matrix = build_distance_matrix(G, delivery_nodes)
        
        # 4. Solve VRP
        optimized_indices = solve_vrp(dist_matrix)
        
        if optimized_indices:
            # 5. Generate Final Route
            order, total_cost, full_route = generate_full_route(G, delivery_nodes, optimized_indices)
            
            # 6. Output Results
            print("\n--- ROUTING RESULTS ---")
            print(f"Optimized Delivery Order (Node IDs): {order}")
            print(f"Total Travel Weight: {total_cost:.2f}")
            print(f"Number of nodes in full route: {len(full_route)}")
            print("---------------------------\n")
            
            # 7. Save Data
            save_output(order, total_cost, full_route)
        else:
            print("Failed to find an optimized route.")
            
    except Exception as e:
        print(f"An error occurred in the routing engine: {e}")

if __name__ == "__main__":
    main()
