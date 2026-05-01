# Delivery Routes Optimizer

Delivery Routes Optimizer is a full-stack application designed to compute and visualize optimized delivery routes for a set of given delivery points in a specific city. The system simulates real-world traffic conditions and uses advanced graph-based routing and operations research algorithms to find the most efficient path connecting all delivery points.

## 🚀 Features

- **Real-World Map Data**: Downloads and processes road networks from OpenStreetMap using OSMnx.
- **Traffic Simulation**: Applies simulated traffic multipliers to roads to mimic real-world travel conditions.
- **Optimized Routing**: Solves the Vehicle Routing Problem (VRP) using Google OR-Tools to find the optimal sequence of deliveries.
- **Shortest Path Calculation**: Uses the A* algorithm (via NetworkX) to determine the exact path between delivery nodes accounting for simulated traffic.
- **Interactive Map UI**: A modern React-based frontend using Leaflet to visualize delivery points, routes, and statistics.
- **RESTful API**: A fast, robust FastAPI backend handling data generation, fetching, and route optimization.

## 🛠️ Technology Stack & Why We Used Them

### Backend
- **Python**: The core language for data processing and backend API due to its rich ecosystem for data science and routing.
- **FastAPI**: Used for building the API endpoints. Selected for its high performance, automatic interactive documentation (Swagger), and ease of use.
- **OSMnx**: Used to download and manipulate OpenStreetMap street networks. It allows us to get accurate, real-world road data for any city (like Ludhiana, Punjab in this project).
- **NetworkX**: A library for the study of graphs and networks. Used here to compute the shortest paths between nodes using Dijkstra's and A* algorithms, taking into account the travel weights (distance * traffic).
- **Google OR-Tools**: An open-source software suite for optimization. Specifically, its Vehicle Routing functionality is used to solve the complex Traveling Salesperson Problem (TSP)/VRP to find the most efficient order to visit all delivery nodes.
- **Pandas**: Used for handling and manipulating tabular data, specifically the generation, processing, and storage of random delivery points.

### Frontend
- **React**: A popular JavaScript library for building dynamic user interfaces.
- **Vite**: A fast build tool and development server that provides a snappy developer experience for React applications.
- **Leaflet & React-Leaflet**: Used for rendering interactive maps. They are lightweight, highly customizable, and perfect for displaying the OpenStreetMap tiles, delivery markers, and the optimized route polyline.
- **Axios**: Used for making HTTP requests from the frontend to the FastAPI backend.
- **Lucide-React**: Used for beautiful, consistent iconography in the UI.

## 📂 Project Structure

- `data_pipeline.py`: A standalone script to initialize the project's data. It downloads the city map, generates random delivery points, simulates traffic, and saves the data to the `data/` directory.
- `backend/`: Contains the FastAPI application (`main.py`) and the core routing logic (`routing_engine.py`).
- `frontend/`: Contains the React web application for visualizing the routes.
- `data/`: Stores the generated graph (`map.graphml`) and deliveries dataset (`deliveries.csv`).

## ⚙️ Getting Started

### Prerequisites
- Python 3.8+
- Node.js (for frontend)

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Adilkhan01V/Delivery-Routes.git
   cd Delivery-Routes
   ```

2. **Backend Setup**:
   - Create a virtual environment and install dependencies:
     ```bash
     python -m venv .venv
     # Windows: .venv\Scripts\activate | Mac/Linux: source .venv/bin/activate
     pip install -r requirements.txt
     ```
   - Run the data pipeline to download map data and generate initial deliveries:
     ```bash
     python data_pipeline.py
     ```
   - Start the FastAPI backend server:
     ```bash
     uvicorn backend.main:app --reload --port 8000
     ```

3. **Frontend Setup**:
   - Open a new terminal and navigate to the frontend directory:
     ```bash
     cd frontend
     npm install
     ```
   - Start the frontend development server:
     ```bash
     npm run dev
     ```

## 🧠 How the Routing Engine Works

1. **Graph Preparation**: The map is loaded as a directed graph where nodes are intersections and edges are roads. The graph is pre-processed to find the largest strongly connected component ensuring a valid path exists between any two nodes.
2. **Distance Matrix**: The engine computes the cost to travel between every pair of delivery points using NetworkX's single-source Dijkstra algorithm. The "cost" considers both distance and our simulated traffic multipliers.
3. **Solving the VRP**: The distance matrix is fed into Google OR-Tools. The solver evaluates thousands of permutations and uses the Savings heuristic to quickly find the most optimized sequence (order) to visit all deliveries.
4. **Generating the Full Route**: Once the sequence is determined, the engine performs an A* search between each consecutive point in the sequence to build the final continuous path coordinate list, which is then sent to the frontend for rendering.
