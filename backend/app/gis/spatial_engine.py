import math
from typing import List, Tuple, Dict, Any

class SpatialEngine:
    """
    GIS Spatial Computation Engine for Pench Tiger Reserve.
    Calculates:
    - Activity Centroids (mean Lat/Lon)
    - Home Range / Occupied Area (Convex Hull area in km²)
    - Core vs Buffer vs Village area breakdown
    - Pairwise Territorial Overlap (Intersection area km², % overlap)
    """
    EARTH_RADIUS_KM = 6371.0

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates Haversine distance in kilometers between two lat/lon points."""
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return SpatialEngine.EARTH_RADIUS_KM * c

    @staticmethod
    def calculate_centroid(points: List[Tuple[float, float]]) -> Tuple[float, float]:
        """Calculates geographical centroid (mean latitude, mean longitude)."""
        if not points:
            return (21.65, 79.30) # Default Pench Reserve core coordinates
        mean_lat = sum(p[0] for p in points) / len(points)
        mean_lon = sum(p[1] for p in points) / len(points)
        return (round(mean_lat, 6), round(mean_lon, 6))

    @staticmethod
    def calculate_convex_hull(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        """Computes 2D Convex Hull using Andrew's Monotone Chain Algorithm."""
        pts = sorted(set(points))
        if len(pts) <= 2:
            return pts

        def cross(o, a, b):
            return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

        lower = []
        for p in pts:
            while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
                lower.pop()
            lower.append(p)

        upper = []
        for p in reversed(pts):
            while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
                upper.pop()
            upper.append(p)

        return lower[:-1] + upper[:-1]

    @staticmethod
    def calculate_occupied_area(points: List[Tuple[float, float]]) -> float:
        """
        Calculates estimated occupied area in km² using Geodetic Convex Hull / Bounding Box.
        Note: Clearly documented as 'Estimated Occupied Area' for scientific transparency.
        """
        if len(points) < 3:
            # If 1 or 2 stations, return minimum buffers (e.g. 5.0 km² per station circle)
            return round(len(points) * 5.0, 2)

        hull = SpatialEngine.calculate_convex_hull(points)
        if len(hull) < 3:
            return round(len(points) * 5.0, 2)

        # Shoelace formula converted to approximate km²
        # Convert lat/lon degrees to approximate km offset relative to centroid
        c_lat, c_lon = SpatialEngine.calculate_centroid(hull)
        lat_km_per_deg = 111.0
        lon_km_per_deg = 111.0 * math.cos(math.radians(c_lat))

        km_pts = [( (p[0] - c_lat) * lat_km_per_deg, (p[1] - c_lon) * lon_km_per_deg ) for p in hull]
        
        # Polygon area via Shoelace
        area = 0.0
        n = len(km_pts)
        for i in range(n):
            j = (i + 1) % n
            area += km_pts[i][0] * km_pts[j][1]
            area -= km_pts[j][0] * km_pts[i][1]
        area = abs(area) / 2.0
        
        # Add slight buffer margin for camera detection radius
        total_area = area + (len(points) * 1.5)
        return round(max(5.0, total_area), 2)

    @staticmethod
    def calculate_territorial_overlap(
        tiger_a: Dict[str, Any], 
        tiger_b: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates spatial overlap between two tigers' occupied areas.
        """
        dist = SpatialEngine.haversine_distance(
            tiger_a["centroid"][0], tiger_a["centroid"][1],
            tiger_b["centroid"][0], tiger_b["centroid"][1]
        )
        
        r_a = math.sqrt(tiger_a["occupied_area"] / math.pi)
        r_b = math.sqrt(tiger_b["occupied_area"] / math.pi)

        if dist >= (r_a + r_b):
            overlap_km2 = 0.0
        elif dist <= abs(r_a - r_b):
            overlap_km2 = min(tiger_a["occupied_area"], tiger_b["occupied_area"])
        else:
            # Circle-circle intersection approximation
            overlap_dist = (r_a + r_b) - dist
            overlap_km2 = (overlap_dist ** 2) * 1.5

        overlap_km2 = round(min(overlap_km2, min(tiger_a["occupied_area"], tiger_b["occupied_area"])), 2)
        min_area = max(1.0, min(tiger_a["occupied_area"], tiger_b["occupied_area"]))
        pct_overlap = round((overlap_km2 / min_area) * 100, 1)

        severity = "LOW"
        if pct_overlap > 40.0:
            severity = "HIGH"
        elif pct_overlap > 15.0:
            severity = "MEDIUM"

        return {
            "tiger_a_code": tiger_a["code"],
            "tiger_b_code": tiger_b["code"],
            "distance_km": round(dist, 2),
            "overlap_sq_km": overlap_km2,
            "overlap_percent": pct_overlap,
            "severity": severity
        }
