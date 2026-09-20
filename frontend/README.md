# Polar-GCS 🌐🚢
### Antarctic Maritime Navigation and Vessel Monitoring System

Polar-GCS is a maritime navigation and vessel monitoring application designed around the Antarctic environment. It provides a map-based interface for visualizing vessel positions, monitoring simulated telemetry, planning routes, and displaying geographic information relevant to maritime navigation.

The project aims to demonstrate how interactive mapping, vessel simulation, and geographic validation can be brought together in a single application.

---

## 📌 Project Overview

Navigating Antarctic waters presents unique challenges due to the region's remote environment, ice hazards, and complex coastal geography.

Polar-GCS explores a digital approach to maritime monitoring by providing an interactive interface where users can observe a vessel's position, follow its movement, view planned waypoints, and monitor relevant navigation information.

The application currently uses simulated vessel data and predefined geographic information to demonstrate its functionality.

> **Note:** Polar-GCS is a development project and demonstration system. It should not be used for real-world navigation or safety-critical maritime decisions.

---

## ✨ Key Features

### 🗺️ Interactive Maritime Map
- Interactive map interface powered by Leaflet.
- Visualization of the vessel's geographic position.
- Display of the vessel's route and historical movement trail.
- Visualization of navigation waypoints and relevant map information.

### 🚢 Vessel Monitoring
- Simulated vessel movement.
- Display of vessel telemetry, including position, heading, and speed.
- Continuous updates to represent vessel movement over time.

### 📍 Route Planning and Waypoints
- Display of predefined maritime waypoints.
- Visualization of the planned route.
- Waypoint status information to represent progress along a route.

### 🌊 Geographic Validation
- Validation of coordinate values and geographic boundaries.
- Approximate land-zone checks for selected Antarctic regions.
- Detection and display of potential terrain conflicts.
- Geographic status information associated with vessel coordinates.

**Geographic validation is currently approximate and depends on the available geographic data. It does not establish that a position is safe or navigable in real-world conditions.**

### 🧊 Navigation Context
- Antarctic maritime setting.
- Display of predefined ice-hazard information.
- Integration of navigation-related data into the map interface.

### 📊 Monitoring Interface
- Dashboard-style presentation of vessel information.
- Map and route-planning views.
- Navigation information organized for convenient visualization.

---

## 🛠️ Technology Stack

The project currently uses the following technologies:

| Technology | Purpose |
|---|---|
| React | Frontend application and user interface |
| JavaScript | Application logic and simulation |
| React Leaflet | Integration of interactive maps into React |
| Leaflet | Map rendering and geographic visualization |
| CSS | Interface styling |

Additional libraries, services, or backend technologies may be included as development progresses.

---

## 📂 Project Structure

The project includes components, hooks, utilities, and data modules organized within the React application.

A simplified view of the relevant source structure is:

```text
Polar-GCS/
│
├── src/
│   ├── components/
│   │   └── VesselMap.jsx
│   │
│   ├── hooks/
│   │   └── useVesselSimulation.js
│   │
│   ├── utils/
│   │   └── geoValidation.js
│   │
│   ├── data/
│   │   └── mockMissionData.js
│   │
│   └── App.jsx
│
├── public/
├── package.json
└── README.md
