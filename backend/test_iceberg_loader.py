import unittest
from pathlib import Path

from app.data.iceberg_loader import (
    load_iceberg_observations,
    group_trajectories,
    calculate_observed_motion,
    MissingColumnError,
    InvalidIcebergDataError,
)


SAMPLE_FILE = Path(
    "data/sample/iceberg_tracks_sample.csv"
)


class TestIcebergLoader(unittest.TestCase):

    def test_sample_file_exists(self):
        """Synthetic development fixture must exist."""
        self.assertTrue(SAMPLE_FILE.exists())

    def test_load_valid_observations(self):
        """All 8 synthetic observations should load."""
        observations, qc = load_iceberg_observations(
            SAMPLE_FILE
        )

        self.assertEqual(len(observations), 8)
        self.assertEqual(qc.duplicate_records, 0)
        self.assertEqual(qc.invalid_coordinates, 0)
        self.assertEqual(qc.invalid_timestamps, 0)

    def test_iceberg_ids(self):
        """Two iceberg trajectories should be present."""
        observations, _ = load_iceberg_observations(
            SAMPLE_FILE
        )

        ids = {
            obs.iceberg_id
            for obs in observations
        }

        self.assertEqual(
            ids,
            {"ICE_SYN_001", "ICE_SYN_002"}
        )

    def test_utc_timestamps(self):
        """All timestamps must be timezone-aware UTC."""
        observations, _ = load_iceberg_observations(
            SAMPLE_FILE
        )

        for obs in observations:
            self.assertIsNotNone(
                obs.observation_time.tzinfo
            )

            self.assertEqual(
                obs.observation_time.utcoffset().total_seconds(),
                0,
            )

    def test_coordinates_are_valid(self):
        """Latitude and longitude should be valid."""
        observations, _ = load_iceberg_observations(
            SAMPLE_FILE
        )

        for obs in observations:
            self.assertGreaterEqual(
                obs.latitude,
                -90.0
            )

            self.assertLessEqual(
                obs.latitude,
                90.0
            )

            self.assertGreaterEqual(
                obs.longitude,
                -180.0
            )

            self.assertLessEqual(
                obs.longitude,
                180.0
            )

    def test_projection_coordinates_exist(self):
        """Every observation must have finite EPSG:3031 coordinates."""
        observations, _ = load_iceberg_observations(
            SAMPLE_FILE
        )

        for obs in observations:
            self.assertTrue(
                isinstance(obs.x, float)
            )

            self.assertTrue(
                isinstance(obs.y, float)
            )

    def test_observations_sorted(self):
        """Observations must be sorted by iceberg and time."""
        observations, _ = load_iceberg_observations(
            SAMPLE_FILE
        )

        for first, second in zip(
            observations,
            observations[1:]
        ):
            self.assertLessEqual(
                (
                    first.iceberg_id,
                    first.observation_time,
                ),
                (
                    second.iceberg_id,
                    second.observation_time,
                ),
            )

    def test_group_trajectories(self):
        """Observations should group into two trajectories."""
        observations, _ = load_iceberg_observations(
            SAMPLE_FILE
        )

        trajectories = group_trajectories(
            observations
        )

        self.assertEqual(
            set(trajectories.keys()),
            {"ICE_SYN_001", "ICE_SYN_002"},
        )

        self.assertEqual(
            len(trajectories["ICE_SYN_001"]),
            4,
        )

        self.assertEqual(
            len(trajectories["ICE_SYN_002"]),
            4,
        )

    def test_trajectory_chronological_order(self):
        """Each trajectory must be chronological."""
        observations, _ = load_iceberg_observations(
            SAMPLE_FILE
        )

        trajectories = group_trajectories(
            observations
        )

        for trajectory in trajectories.values():

            times = [
                obs.observation_time
                for obs in trajectory
            ]

            self.assertEqual(
                times,
                sorted(times),
            )

    def test_observed_motion(self):
        """Observed displacement and speed should be positive."""
        observations, _ = load_iceberg_observations(
            SAMPLE_FILE
        )

        trajectories = group_trajectories(
            observations
        )

        for trajectory in trajectories.values():

            motions = calculate_observed_motion(
                trajectory
            )

            self.assertEqual(
                len(motions),
                3,
            )

            for motion in motions:

                self.assertGreater(
                    motion.displacement_m,
                    0,
                )

                self.assertGreater(
                    motion.time_seconds,
                    0,
                )

                self.assertGreater(
                    motion.observed_speed_mps,
                    0,
                )

                self.assertGreaterEqual(
                    motion.observed_heading_deg,
                    0,
                )

                self.assertLess(
                    motion.observed_heading_deg,
                    360,
                )

    def test_motion_is_observed_not_prediction(self):
        """
        Motion objects must represent historical observed
        movement and contain no prediction fields.
        """
        observations, _ = load_iceberg_observations(
            SAMPLE_FILE
        )

        trajectories = group_trajectories(
            observations
        )

        motions = calculate_observed_motion(
            trajectories["ICE_SYN_001"]
        )

        self.assertTrue(
            hasattr(
                motions[0],
                "observed_speed_mps"
            )
        )

        self.assertTrue(
            hasattr(
                motions[0],
                "observed_heading_deg"
            )
        )

        self.assertFalse(
            hasattr(
                motions[0],
                "predicted_speed_mps"
            )
        )

    def test_missing_columns(self):
        """Missing required columns should raise an error."""
        import tempfile

        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".csv",
            delete=False,
        ) as f:

            f.write(
                "iceberg_id,latitude,longitude\n"
            )

            temp_path = Path(f.name)

        try:
            with self.assertRaises(
                MissingColumnError
            ):
                load_iceberg_observations(
                    temp_path
                )
        finally:
            temp_path.unlink()

    def test_invalid_latitude(self):
        """Invalid latitude should be rejected."""
        import tempfile

        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".csv",
            delete=False,
        ) as f:

            f.write(
                "iceberg_id,observation_time,"
                "latitude,longitude,source,"
                "source_record_id\n"
            )

            f.write(
                "BAD,2024-01-15T00:00:00Z,"
                "95.0,0.0,SYNTHETIC,BAD_001\n"
            )

            temp_path = Path(f.name)

        try:
            with self.assertRaises(
                InvalidIcebergDataError
            ):
                load_iceberg_observations(
                    temp_path
                )
        finally:
            temp_path.unlink()

    def test_missing_iceberg_id(self):
        """Empty iceberg IDs should be rejected."""
        import tempfile

        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".csv",
            delete=False,
        ) as f:

            f.write(
                "iceberg_id,observation_time,"
                "latitude,longitude,source,"
                "source_record_id\n"
            )

            f.write(
                ",2024-01-15T00:00:00Z,"
                "-80.0,0.0,SYNTHETIC,BAD_001\n"
            )

            temp_path = Path(f.name)

        try:
            with self.assertRaises(
                InvalidIcebergDataError
            ):
                load_iceberg_observations(
                    temp_path
                )
        finally:
            temp_path.unlink()


if __name__ == "__main__":
    unittest.main()
