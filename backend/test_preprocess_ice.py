"""
test_preprocess_ice.py

Scientific test suite for Antarctic sea-ice reprojection and standardization to EPSG:3031.
Validates behavior against data/sample/sea_ice_sample.nc.
"""

import hashlib
import os
import tempfile
import unittest
import numpy as np
import pyproj
import xarray as xr

from app.data.ice_loader import load_sea_ice_dataset
from scripts.preprocess_ice import (
    StandardizedSeaIce,
    derive_target_grid,
    preprocess_sea_ice,
    reproject_sea_ice,
)


class TestPreprocessIce(unittest.TestCase):
    """Unit and scientific validation tests for scripts/preprocess_ice.py."""

    @classmethod
    def setUpClass(cls):
        # Locate sample file relative to repository root
        cls.project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        cls.sample_path = os.path.join(cls.project_root, "data", "sample", "sea_ice_sample.nc")
        if not os.path.exists(cls.sample_path):
            raise FileNotFoundError(f"Required sample file not found at: {cls.sample_path}")

        # Compute initial hash of sample file
        cls.initial_hash = cls._compute_file_sha256(cls.sample_path)

        # Preprocess sample dataset once for shared inspection tests
        cls.standardized, _ = preprocess_sea_ice(cls.sample_path, save_output=False)

    @staticmethod
    def _compute_file_sha256(filepath: str) -> str:
        hasher = hashlib.sha256()
        with open(filepath, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    def test_source_epsg_is_identified_as_3976(self):
        """Test that the source dataset CRS is correctly resolved as EPSG:3976 (not EPSG:3412)."""
        self.assertEqual(self.standardized.metadata.get("source_epsg"), 3976)
        self.assertIn("3976", self.standardized.metadata.get("source_crs_name", ""))

        # Verify source CRS geometry
        src_crs = self.standardized.source_crs
        self.assertAlmostEqual(src_crs.ellipsoid.semi_major_metre, 6378137.0, places=1)
        self.assertAlmostEqual(src_crs.ellipsoid.inverse_flattening, 298.257223563, places=2)

    def test_target_crs_is_epsg_3031(self):
        """Test that the target CRS is WGS 84 / Antarctic Polar Stereographic (EPSG:3031)."""
        expected_3031 = pyproj.CRS.from_epsg(3031)
        self.assertEqual(self.standardized.crs.to_epsg(), 3031)
        self.assertTrue(self.standardized.crs.equals(expected_3031))

    def test_output_is_actually_in_epsg_3031(self):
        """Test projection parameters of output to verify true EPSG:3031 conformity."""
        c_op = self.standardized.crs.coordinate_operation
        self.assertIsNotNone(c_op)
        self.assertEqual(c_op.method_name, "Polar Stereographic (variant B)")

        params = {p.name: p.value for p in c_op.params}
        self.assertEqual(params["Latitude of standard parallel"], -71.0)
        self.assertEqual(params["Longitude of origin"], 0.0)
        self.assertEqual(params["False easting"], 0.0)
        self.assertEqual(params["False northing"], 0.0)

    def test_output_is_two_dimensional(self):
        """Test that spatial output arrays are strictly 2D."""
        self.assertEqual(self.standardized.concentration.ndim, 2)
        self.assertEqual(self.standardized.is_land.ndim, 2)
        self.assertEqual(self.standardized.is_coast.ndim, 2)
        self.assertEqual(self.standardized.is_pole_hole.ndim, 2)
        self.assertEqual(self.standardized.is_missing.ndim, 2)
        self.assertEqual(self.standardized.is_valid.ndim, 2)

        ny, nx = self.standardized.shape
        self.assertEqual(self.standardized.concentration.shape, (ny, nx))
        self.assertEqual(len(self.standardized.x), nx)
        self.assertEqual(len(self.standardized.y), ny)

    def test_output_resolution_is_approx_25km(self):
        """Test that output grid resolution is approximately 25,000 meters."""
        self.assertEqual(self.standardized.target_resolution, (25000.0, 25000.0))

        dx_diffs = np.diff(self.standardized.x)
        dy_diffs = np.diff(self.standardized.y)
        self.assertTrue(np.allclose(dx_diffs, 25000.0, atol=1e-2))
        self.assertTrue(np.allclose(dy_diffs, 25000.0, atol=1e-2))

    def test_output_contains_all_required_masks(self):
        """Test that all required boolean masks exist in the standardized container."""
        required_masks = ["is_land", "is_coast", "is_pole_hole", "is_missing", "is_valid"]
        for mask_name in required_masks:
            mask = getattr(self.standardized, mask_name, None)
            self.assertIsNotNone(mask, f"Missing mask: {mask_name}")
            self.assertEqual(mask.shape, self.standardized.shape)

    def test_land_and_coast_masks_remain_boolean(self):
        """Test that land and coast masks remain strictly boolean and do not leak into valid ice."""
        self.assertEqual(self.standardized.is_land.dtype, np.bool_)
        self.assertEqual(self.standardized.is_coast.dtype, np.bool_)

        # Barrier cells must never be classified as valid ice observations
        self.assertFalse(np.any(self.standardized.is_land & self.standardized.is_valid))
        self.assertFalse(np.any(self.standardized.is_coast & self.standardized.is_valid))

        # Concentration values on land and coast must strictly be NaN
        self.assertTrue(np.all(np.isnan(self.standardized.concentration[self.standardized.is_land])))
        self.assertTrue(np.all(np.isnan(self.standardized.concentration[self.standardized.is_coast])))

    def test_missing_cells_remain_identifiable(self):
        """Test that missing observations are explicitly tracked and not fabricated."""
        self.assertEqual(self.standardized.is_missing.dtype, np.bool_)
        self.assertGreater(int(self.standardized.is_missing.sum()), 0)

        # Missing cells must not be marked as valid
        self.assertFalse(np.any(self.standardized.is_missing & self.standardized.is_valid))

        # Missing cells must have NaN concentration
        self.assertTrue(np.all(np.isnan(self.standardized.concentration[self.standardized.is_missing])))

    def test_no_sentinel_values_in_concentration(self):
        """Test that no sentinel numbers (2.51, 2.53, 2.54, 2.55) appear in concentration."""
        conc = self.standardized.concentration
        finite_vals = conc[np.isfinite(conc)]

        for sentinel in [2.51, 2.53, 2.54, 2.55]:
            self.assertFalse(
                np.any(np.isclose(finite_vals, sentinel, atol=1e-2)),
                f"Sentinel value {sentinel} found in reprojected concentration!"
            )
        # Verify no values above 1.0
        self.assertFalse(np.any(finite_vals > 1.0))

    def test_valid_concentration_remains_within_0_1(self):
        """Test that valid physical concentrations fall strictly within [0.0, 1.0]."""
        valid_mask = self.standardized.is_valid
        valid_vals = self.standardized.concentration[valid_mask]

        self.assertGreater(len(valid_vals), 0)
        self.assertTrue(np.all(valid_vals >= 0.0))
        self.assertTrue(np.all(valid_vals <= 1.0))
        self.assertGreaterEqual(float(np.min(valid_vals)), 0.7)  # Coastal pack ice range
        self.assertLessEqual(float(np.max(valid_vals)), 1.0)

    def test_metadata_records_source_and_target_crs(self):
        """Test that scientific provenance metadata records source and target CRS and resolutions."""
        meta = self.standardized.metadata
        self.assertEqual(meta.get("source_epsg"), 3976)
        self.assertEqual(meta.get("target_epsg"), 3031)
        self.assertIn("EPSG:3031", meta.get("target_crs", ""))
        self.assertEqual(meta.get("target_resolution_meters"), (25000.0, 25000.0))
        self.assertIn("resampling_concentration", meta)
        self.assertIn("resampling_masks", meta)

    def test_raw_sample_input_file_is_unchanged(self):
        """Test that the source sample NetCDF file was not modified or overwritten."""
        current_hash = self._compute_file_sha256(self.sample_path)
        self.assertEqual(
            self.initial_hash,
            current_hash,
            "The sample NetCDF file was altered during preprocessing!"
        )

    def test_save_and_reload_netcdf(self):
        """Test that the standardized dataset saves to NetCDF and reloads faithfully via xarray."""
        with tempfile.TemporaryDirectory() as tmpdir:
            out_file = os.path.join(tmpdir, "test_output.nc")
            saved_path = self.standardized.save(output_path=out_file)
            self.assertTrue(os.path.exists(saved_path))

            with xr.open_dataset(saved_path) as ds:
                self.assertIn("concentration", ds.data_vars)
                self.assertIn("is_land", ds.data_vars)
                self.assertIn("is_coast", ds.data_vars)
                self.assertIn("is_missing", ds.data_vars)
                self.assertIn("is_valid", ds.data_vars)
                self.assertIn("polar_stereographic", ds.data_vars)
                self.assertIn("x", ds.coords)
                self.assertIn("y", ds.coords)
                self.assertEqual(ds.attrs.get("target_epsg"), 3031)
                self.assertEqual(ds.attrs.get("source_epsg"), 3976)

    def test_configurable_resolution(self):
        """Test that target resolution is configurable (e.g., 50 km)."""
        std_50k, _ = preprocess_sea_ice(self.sample_path, target_resolution=50000.0, save_output=False)
        self.assertEqual(std_50k.target_resolution, (50000.0, 50000.0))
        # At 50km resolution, grid dimension should be roughly half of 25km grid
        self.assertLess(std_50k.shape[0], self.standardized.shape[0])
        self.assertLess(std_50k.shape[1], self.standardized.shape[1])
        self.assertEqual(std_50k.crs.to_epsg(), 3031)


if __name__ == "__main__":
    unittest.main()
