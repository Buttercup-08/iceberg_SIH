#!/usr/bin/env python3
"""
generate_sample_ice.py

Generates a synthetic Antarctic sea-ice sample NetCDF file conforming
to the NOAA/NSIDC Climate Data Record (CDR v4) specification (EPSG:3412 / 25 km grid).

This dataset is intended for local backend testing, CI/CD validation,
and offline development without requiring multi-gigabyte external downloads.
"""

from datetime import datetime, timezone
import os
import numpy as np
from scipy.io import netcdf_file


def generate_synthetic_sea_ice(output_path: str, nx: int = 60, ny: int = 60, dx: float = 25000.0):
    """
    Constructs a synthetic Antarctic sea ice NetCDF-3/64-bit file.

    Parameters
    ----------
    output_path : str
        Target filepath for the NetCDF file.
    nx : int
        Number of grid cells along x-axis (default: 60).
    ny : int
        Number of grid cells along y-axis (default: 60).
    dx : float
        Grid spacing in meters (default: 25000.0 m = 25 km).
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    # 1. Spatial Grid Setup (Antarctic South Polar Stereographic EPSG:3412)
    # Coordinate range centered in the Weddell Sea / Antarctic Peninsula sector
    x0 = -1500000.0
    y0 = 0.0
    x_coords = np.linspace(x0, x0 + (nx - 1) * dx, nx, dtype=np.float32)
    y_coords = np.linspace(y0, y0 + (ny - 1) * dx, ny, dtype=np.float32)

    xx, yy = np.meshgrid(x_coords, y_coords)
    r = np.sqrt(xx**2 + yy**2)

    # Approximate inverse polar stereographic formulas (lat_ts = -70 deg S, lon_0 = 0 deg)
    lon_deg = np.degrees(np.arctan2(xx, -yy)).astype(np.float32)
    lat_deg = (- (90.0 - 2.0 * np.degrees(np.arctan(r / (2.0 * 6378137.0 * 0.972))))).astype(np.float32)

    # 2. Synthetic Sea Ice Concentration Field Synthesis
    # Per NOAA/NSIDC CDR v4:
    # 0.0 to 1.0 : Valid sea ice concentration fraction
    # 2.51 : Pole hole
    # 2.53 : Coastline
    # 2.54 : Land interior
    # 2.55 : Missing data / fill value

    # Create realistic gradient based on latitude:
    # High south (< -74): Land
    # -74 to -72: Dense coastal fast ice (0.85 - 1.0)
    # -72 to -67: Pack ice to Marginal Ice Zone (0.85 down to 0.15)
    # > -67: Open water (0.0)
    cdr_data = np.zeros((ny, nx), dtype=np.float32)
    qa_data = np.zeros((ny, nx), dtype=np.int8)

    for i in range(ny):
        for j in range(nx):
            lat = lat_deg[i, j]
            if lat < -74.0:
                cdr_data[i, j] = 2.54  # Land
                qa_data[i, j] = 2
            elif -74.0 <= lat < -73.2:
                cdr_data[i, j] = 2.53  # Coastline
                qa_data[i, j] = 1
            elif -73.2 <= lat < -70.0:
                # Dense pack ice with spatial texture
                noise = 0.05 * np.sin(i * 0.4) * np.cos(j * 0.4)
                conc = 0.85 + 0.12 * ((lat + 70.0) / -3.2) + noise
                cdr_data[i, j] = np.clip(conc, 0.70, 1.0)
                qa_data[i, j] = 0
            elif -70.0 <= lat < -66.5:
                # Marginal ice zone
                factor = (lat - (-66.5)) / (-70.0 - (-66.5))
                noise = 0.08 * np.sin(i * 0.5) * np.sin(j * 0.3)
                conc = factor * 0.80 + noise
                cdr_data[i, j] = np.clip(conc, 0.0, 0.85)
                qa_data[i, j] = 0
            else:
                # Open water
                cdr_data[i, j] = 0.0
                qa_data[i, j] = 0

    # Inject localized missing data patch (sensor drop-out simulation)
    cdr_data[10:13, 20:23] = 2.55
    qa_data[10:13, 20:23] = 3

    # Generate bootstrap and NASA team variations
    bt_data = np.copy(cdr_data)
    nt_data = np.copy(cdr_data)
    valid_mask = cdr_data <= 1.0
    bt_data[valid_mask] = np.clip(cdr_data[valid_mask] + 0.02 * np.cos(xx[valid_mask] * 1e-5), 0.0, 1.0)
    nt_data[valid_mask] = np.clip(cdr_data[valid_mask] - 0.02 * np.sin(yy[valid_mask] * 1e-5), 0.0, 1.0)

    # 3. Time Coordinate (Days since 1970-01-01 for 2024-01-15)
    ref_date = datetime(1970, 1, 1, tzinfo=timezone.utc)
    sample_date = datetime(2024, 1, 15, 0, 0, 0, tzinfo=timezone.utc)
    time_val = (sample_date - ref_date).days

    # 4. Write NetCDF File
    with netcdf_file(output_path, "w", version=2) as f:
        # Global metadata attributes
        f.title = b"NOAA/NSIDC Climate Data Record of Passive Microwave Sea Ice Concentration (Synthetic Testbed Sample)"
        f.institution = b"SIH26059 Antarctic Navigation System Project"
        f.source = b"Synthetic generator conforming to NSIDC CDR v4"
        f.Conventions = b"CF-1.6"
        f.reference = b"https://nsidc.org/data/g02202"
        f.spatial_resolution = b"25 km"
        f.grid_mapping = b"polar_stereographic"
        f.date_created = datetime.now(timezone.utc).isoformat().encode("ascii")
        f.comment = b"Synthetic offline development and validation sample for Antarctic route decision support."

        # Dimensions
        f.createDimension("time", 1)
        f.createDimension("y", ny)
        f.createDimension("x", nx)

        # Coordinate Variables
        time_var = f.createVariable("time", "i", ("time",))
        time_var.units = b"days since 1970-01-01 00:00:00"
        time_var.long_name = b"time"
        time_var.standard_name = b"time"
        time_var.calendar = b"standard"
        time_var[:] = np.array([time_val], dtype=np.int32)

        x_var = f.createVariable("x", "f", ("x",))
        x_var.units = b"m"
        x_var.long_name = b"projection_x_coordinate"
        x_var.standard_name = b"projection_x_coordinate"
        x_var[:] = x_coords

        y_var = f.createVariable("y", "f", ("y",))
        y_var.units = b"m"
        y_var.long_name = b"projection_y_coordinate"
        y_var.standard_name = b"projection_y_coordinate"
        y_var[:] = y_coords

        lat_var = f.createVariable("latitude", "f", ("y", "x"))
        lat_var.units = b"degrees_north"
        lat_var.long_name = b"latitude coordinate"
        lat_var.standard_name = b"latitude"
        lat_var[:] = lat_deg

        lon_var = f.createVariable("longitude", "f", ("y", "x"))
        lon_var.units = b"degrees_east"
        lon_var.long_name = b"longitude coordinate"
        lon_var.standard_name = b"longitude"
        lon_var[:] = lon_deg

        # Projection Variable (CF Grid Mapping)
        proj_var = f.createVariable("polar_stereographic", "c", ())
        proj_var.grid_mapping_name = b"polar_stereographic"
        proj_var.straight_vertical_longitude_from_pole = 0.0
        proj_var.standard_parallel = -70.0
        proj_var.false_easting = 0.0
        proj_var.false_northing = 0.0
        proj_var.semi_major_axis = 6378137.0
        proj_var.inverse_flattening = 298.257223563

        # Data Variables
        cdr_var = f.createVariable("cdr_sea_ice_conc", "f", ("time", "y", "x"))
        cdr_var.units = b"1"
        cdr_var.long_name = b"NOAA/NSIDC CDR Sea Ice Concentration"
        cdr_var.standard_name = b"sea_ice_area_fraction"
        cdr_var.grid_mapping = b"polar_stereographic"
        cdr_var.valid_range = np.array([0.0, 1.0], dtype=np.float32)
        cdr_var.flag_values = np.array([2.51, 2.53, 2.54, 2.55], dtype=np.float32)
        cdr_var.flag_meanings = b"pole_hole coast land missing"
        cdr_var[0, :, :] = cdr_data

        bt_var = f.createVariable("nsidc_bt_sea_ice_conc", "f", ("time", "y", "x"))
        bt_var.units = b"1"
        bt_var.long_name = b"Bootstrap Algorithm Sea Ice Concentration"
        bt_var.standard_name = b"sea_ice_area_fraction"
        bt_var.grid_mapping = b"polar_stereographic"
        bt_var[0, :, :] = bt_data

        nt_var = f.createVariable("nsidc_nt_sea_ice_conc", "f", ("time", "y", "x"))
        nt_var.units = b"1"
        nt_var.long_name = b"NASA Team Algorithm Sea Ice Concentration"
        nt_var.standard_name = b"sea_ice_area_fraction"
        nt_var.grid_mapping = b"polar_stereographic"
        nt_var[0, :, :] = nt_data

        qa_var = f.createVariable("spatial_qa_flag", "b", ("time", "y", "x"))
        qa_var.long_name = b"Spatial Quality Assessment Flag"
        qa_var.grid_mapping = b"polar_stereographic"
        qa_var[0, :, :] = qa_data

    print(f"[+] Successfully generated synthetic NetCDF: {output_path}")
    print(f"    Grid dimensions: {nx} x {ny} (dx = {dx/1000:.1f} km)")
    print(f"    Latitude range: {lat_deg.min():.2f}°S to {lat_deg.max():.2f}°S")
    print(f"    Longitude range: {lon_deg.min():.2f}° to {lon_deg.max():.2f}°")


if __name__ == "__main__":
    target = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data", "sample", "sea_ice_sample.nc"
    )
    generate_synthetic_sea_ice(target)
