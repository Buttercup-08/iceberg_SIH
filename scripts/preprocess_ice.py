#!/usr/bin/env python3
"""
preprocess_ice.py

Antarctic Sea-Ice Reprojection and Standardization Pipeline.

Converts validated ProcessedSeaIce observations from source polar stereographic
coordinate systems (e.g. EPSG:3976 / EPSG:3412) into the project's unified
Antarctic navigation CRS:
    EPSG:3031 (WGS 84 / Antarctic Polar Stereographic, standard parallel 71°S).

Key Scientific Constraints:
1. Dynamic source CRS handling: Never hardcode source EPSG; read from ProcessedSeaIce.crs.
2. Barrier-aware resampling:
   - Physical sea-ice concentration is resampled using normalized bilinear interpolation
     restricted exclusively to valid water/pack-ice pixels.
   - Land, coastline, and polar hole barriers receive 0 weight and are NEVER converted
     into artificial ice concentrations.
   - Nearest-neighbor resampling is applied to boolean masks (land, coast, pole-hole, missing).
3. Explicit missing-data preservation: Missing cells remain identifiable via is_missing.
   No data is fabricated or silently infilled at this stage.
4. Full scientific provenance: Records source file, source CRS, target CRS, resolutions,
   resampling algorithms, and timestamps.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
import os
import sys
from typing import Any, Dict, Optional, Tuple, Union

import affine
import numpy as np
import pyproj
import rasterio
from rasterio.warp import Resampling, reproject, transform_bounds
import xarray as xr

# Ensure backend modules are importable
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.data.ice_loader import (  # noqa: E402
    ProcessedSeaIce,
    load_sea_ice_dataset,
    resolve_epsg_code,
)


@dataclass(frozen=True)
class StandardizedSeaIce:
    """
    Standardized sea-ice dataset reprojected into the unified Antarctic navigation CRS (EPSG:3031).

    Attributes
    ----------
    concentration : np.ndarray
        2D float32 array (ny, nx) with valid physical concentration values in [0.0, 1.0].
        Land, coast, pole-hole, missing, and unobserved cells are strictly np.nan.
    is_land : np.ndarray
        2D boolean array (ny, nx). True where cells represent continental land or ice shelves.
    is_coast : np.ndarray
        2D boolean array (ny, nx). True where cells represent coastal boundaries.
    is_pole_hole : np.ndarray
        2D boolean array (ny, nx). True where cells fall within the observation-hole.
    is_missing : np.ndarray
        2D boolean array (ny, nx). True where source data was missing or fill.
    is_valid : np.ndarray
        2D boolean array (ny, nx). True exclusively for navigable cells with valid observation.
    x : np.ndarray
        1D float32 coordinate array (nx,) of easting in meters (EPSG:3031).
    y : np.ndarray
        1D float32 coordinate array (ny,) of northing in meters (EPSG:3031).
    crs : pyproj.CRS
        Unified navigation CRS (EPSG:3031).
    transform : affine.Affine
        Affine geotransform matrix in EPSG:3031 metric space.
    bounds : Tuple[float, float, float, float]
        Bounding box (min_x, min_y, max_x, max_y) in EPSG:3031 meters.
    timestamp : datetime
        Observation timestamp in UTC.
    source_crs : pyproj.CRS
        Original CRS from the source dataset.
    source_resolution : Tuple[float, float]
        Original grid spacing (dx, dy) in meters.
    target_resolution : Tuple[float, float]
        Target grid spacing (dx, dy) in meters.
    metadata : Dict[str, Any]
        Complete scientific provenance dictionary.
    """
    concentration: np.ndarray
    is_land: np.ndarray
    is_coast: np.ndarray
    is_pole_hole: np.ndarray
    is_missing: np.ndarray
    is_valid: np.ndarray
    x: np.ndarray
    y: np.ndarray
    crs: pyproj.CRS
    transform: affine.Affine
    bounds: Tuple[float, float, float, float]
    timestamp: datetime
    source_crs: pyproj.CRS
    source_resolution: Tuple[float, float]
    target_resolution: Tuple[float, float]
    metadata: Dict[str, Any]

    @property
    def shape(self) -> Tuple[int, int]:
        """Dimensions of the spatial grid (rows, columns)."""
        return (len(self.y), len(self.x))

    def to_xarray(self) -> xr.Dataset:
        """
        Converts the standardized sea-ice data into a CF-compliant xarray.Dataset.
        """
        # EPSG:3031 grid mapping CF attributes
        grid_mapping_attrs = {
            "grid_mapping_name": "polar_stereographic",
            "standard_parallel": -71.0,
            "straight_vertical_longitude_from_pole": 0.0,
            "false_easting": 0.0,
            "false_northing": 0.0,
            "semi_major_axis": 6378137.0,
            "inverse_flattening": 298.257223563,
            "spatial_epsg": 3031,
            "spatial_ref": self.crs.to_wkt(),
        }

        data_vars = {
            "concentration": (
                ("y", "x"),
                self.concentration,
                {
                    "units": "1",
                    "long_name": "Standardized Sea Ice Concentration (EPSG:3031)",
                    "standard_name": "sea_ice_area_fraction",
                    "valid_range": [0.0, 1.0],
                    "grid_mapping": "polar_stereographic",
                }
            ),
            "is_land": (
                ("y", "x"),
                self.is_land.astype(np.uint8),
                {
                    "long_name": "Land Binary Mask",
                    "standard_name": "land_binary_mask",
                    "flag_values": [0, 1],
                    "flag_meanings": "water land",
                    "grid_mapping": "polar_stereographic",
                }
            ),
            "is_coast": (
                ("y", "x"),
                self.is_coast.astype(np.uint8),
                {
                    "long_name": "Coastline Boundary Mask",
                    "standard_name": "coast_binary_mask",
                    "flag_values": [0, 1],
                    "flag_meanings": "non_coast coastline",
                    "grid_mapping": "polar_stereographic",
                }
            ),
            "is_pole_hole": (
                ("y", "x"),
                self.is_pole_hole.astype(np.uint8),
                {
                    "long_name": "Polar Observation Hole Mask",
                    "standard_name": "pole_hole_binary_mask",
                    "flag_values": [0, 1],
                    "flag_meanings": "observed unobserved_pole_hole",
                    "grid_mapping": "polar_stereographic",
                }
            ),
            "is_missing": (
                ("y", "x"),
                self.is_missing.astype(np.uint8),
                {
                    "long_name": "Missing Observation Mask",
                    "standard_name": "missing_data_binary_mask",
                    "flag_values": [0, 1],
                    "flag_meanings": "present missing",
                    "grid_mapping": "polar_stereographic",
                }
            ),
            "is_valid": (
                ("y", "x"),
                self.is_valid.astype(np.uint8),
                {
                    "long_name": "Valid Physical Observation Mask",
                    "standard_name": "valid_observation_binary_mask",
                    "flag_values": [0, 1],
                    "flag_meanings": "invalid valid",
                    "grid_mapping": "polar_stereographic",
                }
            ),
            "polar_stereographic": ((), b" ", grid_mapping_attrs),
        }

        coords = {
            "x": (
                "x",
                self.x,
                {
                    "units": "m",
                    "long_name": "projection_x_coordinate",
                    "standard_name": "projection_x_coordinate",
                    "axis": "X",
                }
            ),
            "y": (
                "y",
                self.y,
                {
                    "units": "m",
                    "long_name": "projection_y_coordinate",
                    "standard_name": "projection_y_coordinate",
                    "axis": "Y",
                }
            ),
            "time": (
                "time",
                [np.datetime64(self.timestamp.replace(tzinfo=None))],
                {
                    "long_name": "time",
                    "standard_name": "time",
                    "axis": "T",
                }
            ),
        }

        # Flatten metadata for NetCDF global attributes
        clean_attrs = {
            "title": "Standardized Antarctic Sea-Ice Concentration (EPSG:3031)",
            "institution": "SIH26059 Antarctic Navigation Decision Support System",
            "Conventions": "CF-1.6",
            "source_crs": self.metadata.get("source_crs_name", str(self.source_crs)),
            "source_epsg": int(self.metadata.get("source_epsg") or 0),
            "target_crs": "EPSG:3031 (WGS 84 / Antarctic Polar Stereographic)",
            "target_epsg": 3031,
            "source_resolution_meters": float(self.source_resolution[0]),
            "target_resolution_meters": float(self.target_resolution[0]),
            "processing_timestamp": self.metadata.get("processing_timestamp", ""),
            "resampling_concentration": self.metadata.get("resampling_concentration", ""),
            "resampling_masks": self.metadata.get("resampling_masks", ""),
            "source_file": self.metadata.get("source_file", ""),
        }

        return xr.Dataset(data_vars=data_vars, coords=coords, attrs=clean_attrs)

    def save(
        self,
        output_path: Optional[str] = None,
        output_dir: str = "data/processed/sea_ice"
    ) -> str:
        """
        Saves the standardized dataset to NetCDF format.

        Parameters
        ----------
        output_path : Optional[str]
            Direct filepath to save. If None, derives filename from timestamp.
        output_dir : str
            Directory to place file when output_path is not explicitly provided.

        Returns
        -------
        str : Absolute path to the saved file.
        """
        if output_path is None:
            # Format timestamp: YYYYMMDDTHHMMSSZ.nc
            time_str = self.timestamp.strftime("%Y%m%dT%H%M%SZ")
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, f"{time_str}.nc")
        else:
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

        ds = self.to_xarray()
        try:
            ds.to_netcdf(output_path, engine="scipy")
        finally:
            ds.close()

        return os.path.abspath(output_path)


def derive_target_grid(
    src_bounds: Tuple[float, float, float, float],
    src_crs: pyproj.CRS,
    dst_crs: pyproj.CRS,
    target_resolution: float = 25000.0
) -> Tuple[affine.Affine, Tuple[float, float, float, float], np.ndarray, np.ndarray, int, int]:
    """
    Derives the target EPSG:3031 grid geometry, dimensions, coordinates, and affine transform
    by projecting the source bounding box.

    Parameters
    ----------
    src_bounds : Tuple[float, float, float, float]
        (min_x, min_y, max_x, max_y) in source CRS.
    src_crs : pyproj.CRS
        Source coordinate reference system.
    dst_crs : pyproj.CRS
        Destination coordinate reference system (EPSG:3031).
    target_resolution : float
        Grid cell spacing in meters (default: 25000.0 m = 25 km).

    Returns
    -------
    dst_transform, dst_bounds, x_coords, y_coords, width, height
    """
    if target_resolution <= 0.0:
        raise ValueError(f"Target resolution must be strictly positive, got {target_resolution}")

    # Project outer bounding box with densified curve tracing
    dst_min_x, dst_min_y, dst_max_x, dst_max_y = transform_bounds(
        src_crs, dst_crs, *src_bounds, densify_pts=21
    )

    # Snap bounds to uniform multiples of target resolution
    target_min_x = float(np.floor(dst_min_x / target_resolution) * target_resolution)
    target_min_y = float(np.floor(dst_min_y / target_resolution) * target_resolution)
    target_max_x = float(np.ceil(dst_max_x / target_resolution) * target_resolution)
    target_max_y = float(np.ceil(dst_max_y / target_resolution) * target_resolution)

    width = int(round((target_max_x - target_min_x) / target_resolution))
    height = int(round((target_max_y - target_min_y) / target_resolution))

    # Cell-center 1D coordinate vectors
    x_coords = target_min_x + (np.arange(width, dtype=np.float32) + 0.5) * target_resolution
    y_coords = target_min_y + (np.arange(height, dtype=np.float32) + 0.5) * target_resolution

    # Affine transform mapping pixel (col, row) to metric coordinates
    # Standard bottom-up polar grid (y increases with row index)
    dst_transform = affine.Affine(
        target_resolution, 0.0, target_min_x,
        0.0, target_resolution, target_min_y
    )
    dst_bounds = (target_min_x, target_min_y, target_max_x, target_max_y)

    return dst_transform, dst_bounds, x_coords, y_coords, width, height


def reproject_sea_ice(
    psi: ProcessedSeaIce,
    target_resolution: float = 25000.0,
    target_epsg: int = 3031
) -> StandardizedSeaIce:
    """
    Core scientific reprojection function. Converts a ProcessedSeaIce instance
    into StandardizedSeaIce in EPSG:3031 using barrier-aware normalized resampling.

    Parameters
    ----------
    psi : ProcessedSeaIce
        Source sea-ice dataset loaded via ice_loader.py.
    target_resolution : float
        Target cell resolution in meters (default: 25000.0).
    target_epsg : int
        Target EPSG integer (default: 3031).

    Returns
    -------
    StandardizedSeaIce
    """
    src_crs = psi.crs
    dst_crs = pyproj.CRS.from_epsg(target_epsg)

    # 1. Derive target grid geometry
    dst_transform, dst_bounds, x_coords, y_coords, width, height = derive_target_grid(
        src_bounds=psi.bounds,
        src_crs=src_crs,
        dst_crs=dst_crs,
        target_resolution=target_resolution,
    )

    # 2. Resample Boolean Masks with Nearest-Neighbor
    def _resample_mask(mask: np.ndarray) -> np.ndarray:
        dst = np.zeros((height, width), dtype=np.uint8)
        reproject(
            source=mask.astype(np.uint8),
            destination=dst,
            src_transform=psi.transform,
            src_crs=src_crs,
            dst_transform=dst_transform,
            dst_crs=dst_crs,
            resampling=Resampling.nearest,
        )
        return dst == 1

    dst_is_land = _resample_mask(psi.is_land)
    dst_is_coast = _resample_mask(psi.is_coast)
    dst_is_pole_hole = _resample_mask(psi.is_pole_hole)
    dst_is_missing = _resample_mask(psi.is_missing)

    # 3. Barrier-Aware Normalized Bilinear Resampling for Concentration
    # Only valid water/pack-ice observations contribute value and weight.
    # Land, coast, pole-hole, and missing cells contribute 0 weight so they cannot
    # bleed artificial values into water cells or pull concentration toward zero.
    src_values = np.where(psi.is_valid, psi.concentration, 0.0).astype(np.float32)
    src_weights = psi.is_valid.astype(np.float32)

    dst_values = np.zeros((height, width), dtype=np.float32)
    dst_weights = np.zeros((height, width), dtype=np.float32)

    reproject(
        source=src_values,
        destination=dst_values,
        src_transform=psi.transform,
        src_crs=src_crs,
        dst_transform=dst_transform,
        dst_crs=dst_crs,
        resampling=Resampling.bilinear,
    )
    reproject(
        source=src_weights,
        destination=dst_weights,
        src_transform=psi.transform,
        src_crs=src_crs,
        dst_transform=dst_transform,
        dst_crs=dst_crs,
        resampling=Resampling.bilinear,
    )

    # Normalized interpolation: divide weighted values by weighted coverage
    with np.errstate(divide="ignore", invalid="ignore"):
        dst_conc = np.where(dst_weights > 0.25, dst_values / dst_weights, np.nan)

    # 4. Strict Barrier Enforcement & Non-Fabrication Constraints
    # Hard barrier cells (land, coast, pole-hole, missing) MUST NEVER hold ice concentration
    barriers = dst_is_land | dst_is_coast | dst_is_pole_hole | dst_is_missing
    dst_conc[barriers] = np.nan

    # Derive final validated physical observation mask
    dst_is_valid = (~barriers) & np.isfinite(dst_conc)
    dst_conc[dst_is_valid] = np.clip(dst_conc[dst_is_valid], 0.0, 1.0)
    dst_conc[~dst_is_valid] = np.nan

    src_epsg = resolve_epsg_code(src_crs)
    if src_epsg:
        src_crs_repr = f"EPSG:{src_epsg} ({pyproj.CRS.from_epsg(src_epsg).name})"
    else:
        src_crs_repr = src_crs.name if src_crs.name != "undefined" else str(src_crs)

    # 5. Scientific Provenance Metadata
    metadata = {
        "source_file": psi.metadata.get("source_filepath", "unknown"),
        "source_crs_wkt": src_crs.to_wkt(),
        "source_crs_name": src_crs_repr,
        "source_epsg": src_epsg,
        "target_crs": f"EPSG:{target_epsg} (WGS 84 / Antarctic Polar Stereographic)",
        "target_epsg": target_epsg,
        "source_resolution_meters": psi.resolution,
        "target_resolution_meters": (target_resolution, target_resolution),
        "processing_timestamp": datetime.now(timezone.utc).isoformat(),
        "resampling_concentration": "barrier_aware_normalized_bilinear (min_weight=0.25)",
        "resampling_masks": "nearest_neighbor",
        "original_metadata": psi.metadata,
    }

    return StandardizedSeaIce(
        concentration=dst_conc.astype(np.float32),
        is_land=dst_is_land,
        is_coast=dst_is_coast,
        is_pole_hole=dst_is_pole_hole,
        is_missing=dst_is_missing,
        is_valid=dst_is_valid,
        x=x_coords,
        y=y_coords,
        crs=dst_crs,
        transform=dst_transform,
        bounds=dst_bounds,
        timestamp=psi.timestamp,
        source_crs=src_crs,
        source_resolution=psi.resolution,
        target_resolution=(target_resolution, target_resolution),
        metadata=metadata,
    )


def preprocess_sea_ice(
    source: Union[str, ProcessedSeaIce],
    target_resolution: float = 25000.0,
    target_epsg: int = 3031,
    output_dir: str = "data/processed/sea_ice",
    save_output: bool = True
) -> Tuple[StandardizedSeaIce, Optional[str]]:
    """
    High-level orchestration function to load, reproject, and standardize sea-ice data.

    Parameters
    ----------
    source : Union[str, ProcessedSeaIce]
        Either a filepath to a raw/sample NetCDF file or an already loaded ProcessedSeaIce instance.
    target_resolution : float
        Target grid resolution in meters (default: 25000.0).
    target_epsg : int
        Target Antarctic EPSG (default: 3031).
    output_dir : str
        Directory where processed NetCDF file will be stored.
    save_output : bool
        Whether to save the standardized NetCDF file to disk.

    Returns
    -------
    Tuple[StandardizedSeaIce, Optional[str]]
        The standardized dataset object and the filepath where it was saved (or None).
    """
    if isinstance(source, str):
        psi = load_sea_ice_dataset(source)
    elif isinstance(source, ProcessedSeaIce):
        psi = source
    else:
        raise TypeError(f"Expected source as filepath str or ProcessedSeaIce, got {type(source)}")

    standardized = reproject_sea_ice(
        psi=psi,
        target_resolution=target_resolution,
        target_epsg=target_epsg,
    )

    saved_path = None
    if save_output:
        saved_path = standardized.save(output_dir=output_dir)

    return standardized, saved_path


def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="Preprocess and reproject Antarctic sea-ice NetCDF observations to EPSG:3031."
    )
    parser.add_argument(
        "--input", "-i",
        default="data/sample/sea_ice_sample.nc",
        help="Path to input NetCDF sea-ice file."
    )
    parser.add_argument(
        "--resolution", "-r",
        type=float,
        default=25000.0,
        help="Target grid resolution in meters (default: 25000.0)."
    )
    parser.add_argument(
        "--output-dir", "-o",
        default="data/processed/sea_ice",
        help="Directory to save the processed NetCDF output."
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Perform preprocessing without saving file to disk."
    )
    args = parser.parse_args()

    print(f"[*] Ingesting sea-ice observation from: {args.input}")
    standardized, saved_path = preprocess_sea_ice(
        source=args.input,
        target_resolution=args.resolution,
        output_dir=args.output_dir,
        save_output=not args.no_save,
    )

    print("[+] Reprojection to EPSG:3031 complete:")
    print(f"    Target Shape: {standardized.shape} (rows, cols)")
    print(f"    Target Resolution: {standardized.target_resolution} m")
    print(f"    Target Bounds: {standardized.bounds}")
    print(f"    Land Cells: {standardized.is_land.sum()}")
    print(f"    Coast Cells: {standardized.is_coast.sum()}")
    print(f"    Missing Cells: {standardized.is_missing.sum()}")
    print(f"    Valid Observation Cells: {standardized.is_valid.sum()}")
    if standardized.is_valid.sum() > 0:
        valid_conc = standardized.concentration[standardized.is_valid]
        print(f"    Valid Concentration Range: [{valid_conc.min():.4f}, {valid_conc.max():.4f}]")
    if saved_path:
        print(f"[+] Output saved successfully to: {saved_path}")


if __name__ == "__main__":
    main()
