"""
test_grid.py

Unit and validation tests for Antarctic NavigationGrid (EPSG:3031),
coordinate transformations, index mapping, boundary handling, and barrier separation.
"""

import os
import unittest
import numpy as np
import pyproj

from app.geo import (
    NavigationGrid,
    GridError,
    OutOfBoundsError,
    InvalidGridIndexError,
    create_navigation_grid_from_sea_ice,
    latlon_to_xy,
    xy_to_latlon,
    validate_latlon,
    euclidean_distance,
    haversine_distance,
    point_in_bounds,
)
from scripts.preprocess_ice import preprocess_sea_ice


class TestNavigationGrid(unittest.TestCase):
    """Test suite for NavigationGrid and polar geospatial utilities."""

    @classmethod
    def setUpClass(cls):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        cls.sample_path = os.path.join(project_root, "data", "sample", "sea_ice_sample.nc")
        if not os.path.exists(cls.sample_path):
            raise FileNotFoundError(f"Sample file not found at: {cls.sample_path}")

        # Preprocess sample to obtain StandardizedSeaIce
        cls.standardized, _ = preprocess_sea_ice(cls.sample_path, save_output=False)
        cls.grid = create_navigation_grid_from_sea_ice(cls.standardized)

    def test_epsg_3031_grid_creation(self):
        """Test that NavigationGrid is successfully created with EPSG:3031 CRS."""
        self.assertIsInstance(self.grid, NavigationGrid)
        self.assertEqual(self.grid.crs.to_epsg(), 3031)

        # Test that attempting to create a NavigationGrid with non-3031 CRS raises ValueError
        invalid_crs = pyproj.CRS.from_epsg(4326)
        with self.assertRaises(ValueError):
            NavigationGrid(
                crs=invalid_crs,
                x=self.grid.x,
                y=self.grid.y,
                resolution=self.grid.resolution,
                transform=self.grid.transform,
                bounds=self.grid.bounds,
                width=self.grid.width,
                height=self.grid.height,
                is_navigable=self.grid.is_navigable,
                is_land=self.grid.is_land,
                is_coast=self.grid.is_coast,
                is_missing=self.grid.is_missing,
                is_pole_hole=self.grid.is_pole_hole,
                is_valid_obs=self.grid.is_valid_obs,
                metadata={},
            )

    def test_grid_dimensions(self):
        """Test grid width, height, resolution, and coordinates."""
        self.assertEqual(self.grid.width, 61)
        self.assertEqual(self.grid.height, 61)
        self.assertEqual(self.grid.shape, (61, 61))
        self.assertEqual(len(self.grid.x), 61)
        self.assertEqual(len(self.grid.y), 61)
        self.assertEqual(self.grid.resolution, (25000.0, 25000.0))

        # Check cell spacing
        self.assertTrue(np.allclose(np.diff(self.grid.x), 25000.0))
        self.assertTrue(np.allclose(np.diff(self.grid.y), 25000.0))

    def test_coordinate_conversion(self):
        """Test WGS84 to EPSG:3031 forward transformation against known benchmarks."""
        # 1. South Pole (-90°S) must project to exactly (0.0, 0.0) meters
        x_pole, y_pole = latlon_to_xy(-90.0, 0.0)
        self.assertAlmostEqual(x_pole, 0.0, places=1)
        self.assertAlmostEqual(y_pole, 0.0, places=1)

        # 2. Benchmark station: McMurdo (-77.846°S, 166.668°E)
        x_mcm, y_mcm = latlon_to_xy(-77.846, 166.668)
        self.assertAlmostEqual(x_mcm, 305613.5, places=0)
        self.assertAlmostEqual(y_mcm, -1289618.4, places=0)

        # 3. Array conversions
        lats = np.array([-75.0, -80.0, -90.0])
        lons = np.array([0.0, 90.0, 180.0])
        xs, ys = latlon_to_xy(lats, lons)
        self.assertEqual(len(xs), 3)
        self.assertEqual(len(ys), 3)

    def test_inverse_coordinate_conversion(self):
        """Test round-trip fidelity between WGS84 and EPSG:3031."""
        test_points = [
            (-70.0, -45.0),
            (-75.5, 30.0),
            (-82.3, 175.0),
            (-89.9, -120.0),
            (-65.0, 0.0),
        ]
        for lat_in, lon_in in test_points:
            x, y = latlon_to_xy(lat_in, lon_in)
            lat_out, lon_out = xy_to_latlon(x, y)
            self.assertAlmostEqual(lat_in, lat_out, places=6)
            self.assertAlmostEqual(lon_in, lon_out, places=6)

            # Inverse check: (x, y) -> (lat, lon) -> (x_back, y_back)
            x_back, y_back = latlon_to_xy(lat_out, lon_out)
            self.assertAlmostEqual(x, x_back, places=2)
            self.assertAlmostEqual(y, y_back, places=2)

    def test_grid_index_conversion(self):
        """Test mapping between metric coordinates and discrete grid indices (row, col)."""
        # Test all 4 corners and center cell
        test_indices = [(0, 0), (0, 60), (60, 0), (60, 60), (30, 30)]
        for r, c in test_indices:
            # 1. Index to cell center
            cx, cy = self.grid.index_to_xy(r, c)
            self.assertEqual(cx, self.grid.x[c])
            self.assertEqual(cy, self.grid.y[r])

            # 2. Cell center back to index
            mapped_r, mapped_c = self.grid.xy_to_index(cx, cy)
            self.assertEqual(mapped_r, r)
            self.assertEqual(mapped_c, c)

            # 3. An interior point within cell offset by +/- 5 km must resolve to same cell
            perturbed_x = cx + 5000.0
            perturbed_y = cy - 5000.0
            p_r, p_c = self.grid.xy_to_index(perturbed_x, perturbed_y)
            self.assertEqual(p_r, r)
            self.assertEqual(p_c, c)

    def test_geographic_index_roundtrip(self):
        """Test latlon_to_index and index_to_latlon consistency."""
        row, col = 20, 15
        lat, lon = self.grid.index_to_latlon(row, col)
        r_back, c_back = self.grid.latlon_to_index(lat, lon)
        self.assertEqual(r_back, row)
        self.assertEqual(c_back, col)

    def test_boundary_handling(self):
        """Test coordinates positioned directly on the outer grid boundaries."""
        min_x, min_y, max_x, max_y = self.grid.bounds

        # Points on bounds must be contained
        self.assertTrue(self.grid.contains_xy(min_x, min_y))
        self.assertTrue(self.grid.contains_xy(max_x, max_y))
        self.assertTrue(self.grid.contains_xy(min_x, max_y))
        self.assertTrue(self.grid.contains_xy(max_x, min_y))

        # Points on lower bounds map to (0, 0)
        r0, c0 = self.grid.xy_to_index(min_x, min_y)
        self.assertEqual(r0, 0)
        self.assertEqual(c0, 0)

        # Points on upper bounds map to (height-1, width-1)
        r_top, c_top = self.grid.xy_to_index(max_x, max_y)
        self.assertEqual(r_top, self.grid.height - 1)
        self.assertEqual(c_top, self.grid.width - 1)

    def test_out_of_bounds_handling(self):
        """Test that coordinates outside grid raise OutOfBoundsError without silent clipping."""
        min_x, min_y, max_x, max_y = self.grid.bounds

        # Test points outside each of the 4 bounds
        out_of_bounds_coords = [
            (min_x - 1.0, min_y),
            (max_x + 1.0, max_y),
            (min_x, min_y - 1.0),
            (min_x, max_y + 1.0),
            (9999999.0, 9999999.0),
        ]
        for x, y in out_of_bounds_coords:
            self.assertFalse(self.grid.contains_xy(x, y))
            with self.assertRaises(OutOfBoundsError):
                self.grid.xy_to_index(x, y)

        # Geographic coordinates outside grid (e.g. South Pole: x=0, y=0 is outside this specific sample bounding box)
        # Note: In our sample, bounds X are [-1525000, 0], bounds Y are [-25000, 1500000].
        # Point (lat=0.0, lon=0.0) is the equator and far outside the Antarctic grid
        self.assertFalse(self.grid.contains_latlon(0.0, 0.0))
        with self.assertRaises(OutOfBoundsError):
            self.grid.latlon_to_index(0.0, 0.0)

    def test_invalid_grid_index_handling(self):
        """Test that invalid row or col indices raise InvalidGridIndexError."""
        invalid_indices = [
            (-1, 0),
            (0, -1),
            (self.grid.height, 0),
            (0, self.grid.width),
            (100, 100),
        ]
        for r, c in invalid_indices:
            with self.assertRaises(InvalidGridIndexError):
                self.grid.index_to_xy(r, c)
            with self.assertRaises(InvalidGridIndexError):
                self.grid.index_to_latlon(r, c)

    def test_consistency_between_standardized_sea_ice_and_navigation_grid(self):
        """Test strict consistency between source StandardizedSeaIce and NavigationGrid."""
        std = self.standardized
        grid = self.grid

        self.assertEqual(grid.bounds, std.bounds)
        self.assertEqual(grid.resolution, std.target_resolution)
        self.assertEqual(grid.transform, std.transform)
        self.assertTrue(np.array_equal(grid.x, std.x))
        self.assertTrue(np.array_equal(grid.y, std.y))
        self.assertTrue(np.array_equal(grid.is_land, std.is_land))
        self.assertTrue(np.array_equal(grid.is_coast, std.is_coast))
        self.assertTrue(np.array_equal(grid.is_missing, std.is_missing))
        self.assertTrue(np.array_equal(grid.is_pole_hole, std.is_pole_hole))
        self.assertTrue(np.array_equal(grid.is_valid_obs, std.is_valid))

    def test_navigable_and_barrier_distinctions(self):
        """Test preservation of distinct land, coast, missing, and navigable categories."""
        # 1. Navigable mask definition
        expected_navigable = (
            (~self.grid.is_land)
            & (~self.grid.is_coast)
            & (~self.grid.is_pole_hole)
        )
        self.assertTrue(np.array_equal(self.grid.is_navigable, expected_navigable))

        # 2. Absolute barrier exclusion: no land or coast cell can ever be navigable
        self.assertFalse(np.any(self.grid.is_land & self.grid.is_navigable))
        self.assertFalse(np.any(self.grid.is_coast & self.grid.is_navigable))

        # 3. Missing observations are tracked distinctly from navigable status
        self.assertEqual(int(self.grid.is_missing.sum()), 9)

        # 4. Total cells partition correctly
        total_cells = self.grid.width * self.grid.height
        barrier_cells = int(self.grid.is_land.sum() + self.grid.is_coast.sum() + self.grid.is_pole_hole.sum())
        self.assertEqual(int(self.grid.is_navigable.sum()), total_cells - barrier_cells)

    def test_spatial_distance_utilities(self):
        """Test spatial distance calculations."""
        # Planar Euclidean: 3-4-5 triangle scaled by 1000m
        dist_euc = euclidean_distance(0.0, 0.0, 3000.0, 4000.0)
        self.assertAlmostEqual(dist_euc, 5000.0)

        # Haversine distance along 1 degree of meridian ~ 111.19 km
        dist_hav = haversine_distance(-70.0, 0.0, -71.0, 0.0)
        self.assertAlmostEqual(dist_hav / 1000.0, 111.195, delta=0.5)

        # Point in bounds
        bounds = (0.0, 0.0, 100.0, 100.0)
        self.assertTrue(point_in_bounds(50.0, 50.0, bounds))
        self.assertFalse(point_in_bounds(150.0, 50.0, bounds))


if __name__ == "__main__":
    unittest.main()
