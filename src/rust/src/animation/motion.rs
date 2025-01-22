use super::models::MotionModel;
use crate::math::vector::Vector3;
use std::time::Duration;
use std::f64::consts::PI;
use std::str::FromStr;
use serde::{Serialize, Deserialize};
use std::any::Any;

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum CircularPlane {
    XY,
    XZ,
    YZ,
}

impl Default for CircularPlane {
    fn default() -> Self {
        CircularPlane::XY
    }
}

impl FromStr for CircularPlane {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "XY" => Ok(CircularPlane::XY),
            "XZ" => Ok(CircularPlane::XZ),
            "YZ" => Ok(CircularPlane::YZ),
            _ => Err(format!("Invalid plane: {}", s)),
        }
    }
}

/// Linear motion between two points
#[derive(Clone)]
pub struct LinearMotion {
    start: Vector3,
    end: Vector3,
    duration: Duration,
    current_time: Duration,
}

impl LinearMotion {
    pub fn new(start: Vector3, end: Vector3, duration: Duration) -> Self {
        Self {
            start,
            end,
            duration,
            current_time: Duration::from_secs(0),
        }
    }

    pub fn start_position(&self) -> Vector3 {
        self.start
    }

    pub fn end_position(&self) -> Vector3 {
        self.end
    }

    pub fn duration(&self) -> Duration {
        self.duration
    }

    pub fn current_position(&self) -> Vector3 {
        let t = (self.current_time.as_secs_f64() / self.duration.as_secs_f64()).min(1.0);
        self.start.lerp(&self.end, t)
    }

    pub fn update(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn calculate_position(&self, time: Duration) -> Vector3 {
        let t = (time.as_secs_f64() / self.duration.as_secs_f64()).min(1.0);
        self.start.lerp(&self.end, t)
    }

    pub fn start(&self) -> Vector3 {
        self.start
    }

    pub fn end(&self) -> Vector3 {
        self.end
    }
}

impl MotionModel for LinearMotion {
    fn calculate_position(&self, time: Duration) -> Vector3 {
        self.calculate_position(time)
    }

    fn cycle_duration(&self) -> Duration {
        self.duration
    }

    fn is_cyclic(&self) -> bool {
        false
    }

    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
        Box::new((*self).clone())
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// Circular motion in a plane
#[derive(Clone)]
pub struct CircularMotion {
    center: Vector3,
    radius: f64,
    frequency: f64,
    plane: CircularPlane,
    current_time: Duration,
}

impl CircularMotion {
    pub fn new(center: Vector3, radius: f64, frequency: f64, plane: CircularPlane) -> Self {
        Self {
            center,
            radius,
            frequency,
            plane,
            current_time: Duration::from_secs(0),
        }
    }

    pub fn center(&self) -> Vector3 {
        self.center
    }

    pub fn radius(&self) -> f64 {
        self.radius
    }

    pub fn frequency(&self) -> f64 {
        self.frequency
    }

    pub fn plane(&self) -> CircularPlane {
        self.plane
    }

    pub fn period(&self) -> Duration {
        Duration::from_secs_f64(1.0 / self.frequency)
    }

    pub fn current_position(&self) -> Vector3 {
        self.calculate_position(self.current_time)
    }

    pub fn update(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn calculate_position(&self, time: Duration) -> Vector3 {
        let angle = time.as_secs_f64() * self.frequency * std::f64::consts::TAU;
        match self.plane {
            CircularPlane::XY => {
                let x = self.center.x() + self.radius * angle.cos();
                let y = self.center.y() + self.radius * angle.sin();
                Vector3::new(x, y, self.center.z())
            }
            CircularPlane::XZ => {
                let x = self.center.x() + self.radius * angle.cos();
                let z = self.center.z() + self.radius * angle.sin();
                Vector3::new(x, self.center.y(), z)
            }
            CircularPlane::YZ => {
                let y = self.center.y() + self.radius * angle.cos();
                let z = self.center.z() + self.radius * angle.sin();
                Vector3::new(self.center.x(), y, z)
            }
        }
    }
}

impl MotionModel for CircularMotion {
    fn calculate_position(&self, time: Duration) -> Vector3 {
        self.calculate_position(time)
    }

    fn cycle_duration(&self) -> Duration {
        Duration::from_secs_f64(1.0 / self.frequency)
    }

    fn is_cyclic(&self) -> bool {
        true
    }

    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
        Box::new((*self).clone())
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// Elliptical motion in a plane
#[derive(Clone)]
pub struct EllipticalMotion {
    center: Vector3,
    major_axis: f64,
    minor_axis: f64,
    frequency: f64,
    plane: CircularPlane,
    current_time: Duration,
}

impl EllipticalMotion {
    pub fn new(center: Vector3, major_axis: f64, minor_axis: f64, frequency: f64, plane: CircularPlane) -> Self {
        Self {
            center,
            major_axis,
            minor_axis,
            frequency,
            plane,
            current_time: Duration::from_secs(0),
        }
    }

    pub fn center(&self) -> Vector3 {
        self.center
    }

    pub fn major_axis(&self) -> f64 {
        self.major_axis
    }

    pub fn minor_axis(&self) -> f64 {
        self.minor_axis
    }

    pub fn frequency(&self) -> f64 {
        self.frequency
    }

    pub fn current_position(&self) -> Vector3 {
        self.calculate_position(self.current_time)
    }

    pub fn update(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn calculate_position(&self, time: Duration) -> Vector3 {
        let angle = 2.0 * PI * self.frequency * time.as_secs_f64();
        match self.plane {
            CircularPlane::XY => Vector3::new(
                self.center.x() + self.major_axis * angle.cos(),
                self.center.y() + self.minor_axis * angle.sin(),
                self.center.z(),
            ),
            CircularPlane::XZ => Vector3::new(
                self.center.x() + self.major_axis * angle.cos(),
                self.center.y(),
                self.center.z() + self.minor_axis * angle.sin(),
            ),
            CircularPlane::YZ => Vector3::new(
                self.center.x(),
                self.center.y() + self.major_axis * angle.cos(),
                self.center.z() + self.minor_axis * angle.sin(),
            ),
        }
    }
}

impl MotionModel for EllipticalMotion {
    fn calculate_position(&self, time: Duration) -> Vector3 {
        self.calculate_position(time)
    }

    fn cycle_duration(&self) -> Duration {
        Duration::from_secs_f64(1.0 / self.frequency)
    }

    fn is_cyclic(&self) -> bool {
        true
    }

    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
        Box::new((*self).clone())
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// Spiral motion in a plane, combining rotation with radius change
#[derive(Clone)]
pub struct SpiralMotion {
    center: Vector3,
    start_radius: f64,
    end_radius: f64,
    frequency: f64,
    plane: CircularPlane,
    duration: Duration,
    current_time: Duration,
}

impl SpiralMotion {
    pub fn new(center: Vector3, start_radius: f64, end_radius: f64, frequency: f64, duration: Duration, plane: CircularPlane) -> Self {
        Self {
            center,
            start_radius,
            end_radius,
            frequency,
            duration,
            plane,
            current_time: Duration::from_secs(0),
        }
    }

    pub fn center(&self) -> Vector3 {
        self.center
    }

    pub fn start_radius(&self) -> f64 {
        self.start_radius
    }

    pub fn end_radius(&self) -> f64 {
        self.end_radius
    }

    pub fn frequency(&self) -> f64 {
        self.frequency
    }

    pub fn duration(&self) -> Duration {
        self.duration
    }

    pub fn current_position(&self) -> Vector3 {
        self.calculate_position(self.current_time)
    }

    pub fn update(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn calculate_position(&self, time: Duration) -> Vector3 {
        let t = (time.as_secs_f64() / self.duration.as_secs_f64()).min(1.0);
        let radius = self.start_radius + (self.end_radius - self.start_radius) * t;
        let angle = 2.0 * PI * self.frequency * time.as_secs_f64();

        match self.plane {
            CircularPlane::XY => Vector3::new(
                self.center.x() + radius * angle.cos(),
                self.center.y() + radius * angle.sin(),
                self.center.z(),
            ),
            CircularPlane::XZ => Vector3::new(
                self.center.x() + radius * angle.cos(),
                self.center.y(),
                self.center.z() + radius * angle.sin(),
            ),
            CircularPlane::YZ => Vector3::new(
                self.center.x(),
                self.center.y() + radius * angle.cos(),
                self.center.z() + radius * angle.sin(),
            ),
        }
    }
}

impl MotionModel for SpiralMotion {
    fn calculate_position(&self, time: Duration) -> Vector3 {
        self.calculate_position(time)
    }

    fn cycle_duration(&self) -> Duration {
        self.duration
    }

    fn is_cyclic(&self) -> bool {
        false
    }

    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
        Box::new((*self).clone())
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// Linear motion optimized for XYZ coordinates
#[derive(Clone)]
pub struct XYZLinearMotion {
    start: Vector3,
    end: Vector3,
    duration: Duration,
    current_time: Duration,
}

impl XYZLinearMotion {
    pub fn new(start: Vector3, end: Vector3, duration: Duration) -> Self {
        Self {
            start,
            end,
            duration,
            current_time: Duration::from_secs(0),
        }
    }

    pub fn start_position(&self) -> Vector3 {
        self.start
    }

    pub fn end_position(&self) -> Vector3 {
        self.end
    }

    pub fn duration(&self) -> Duration {
        self.duration
    }

    pub fn current_position(&self) -> Vector3 {
        self.calculate_position(self.current_time)
    }

    pub fn update(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn calculate_position(&self, time: Duration) -> Vector3 {
        let t = (time.as_secs_f64() / self.duration.as_secs_f64()).min(1.0);
        self.start.lerp(&self.end, t)
    }
}

impl MotionModel for XYZLinearMotion {
    fn calculate_position(&self, time: Duration) -> Vector3 {
        self.calculate_position(time)
    }

    fn cycle_duration(&self) -> Duration {
        self.duration
    }

    fn is_cyclic(&self) -> bool {
        false
    }

    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
        Box::new((*self).clone())
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// Linear motion optimized for AED (Azimuth, Elevation, Distance) coordinates
#[derive(Clone)]
pub struct AEDLinearMotion {
    start_azimuth: f64,
    start_elevation: f64,
    start_distance: f64,
    end_azimuth: f64,
    end_elevation: f64,
    end_distance: f64,
    duration: Duration,
    current_time: Duration,
}

impl AEDLinearMotion {
    pub fn new(
        start_azimuth: f64,
        start_elevation: f64,
        start_distance: f64,
        end_azimuth: f64,
        end_elevation: f64,
        end_distance: f64,
        duration: Duration,
    ) -> Self {
        Self {
            start_azimuth,
            start_elevation,
            start_distance,
            end_azimuth,
            end_elevation,
            end_distance,
            duration,
            current_time: Duration::from_secs(0),
        }
    }

    pub fn start_position(&self) -> Vector3 {
        Vector3::from_aed(self.start_azimuth, self.start_elevation, self.start_distance)
    }

    pub fn end_position(&self) -> Vector3 {
        Vector3::from_aed(self.end_azimuth, self.end_elevation, self.end_distance)
    }

    pub fn duration(&self) -> Duration {
        self.duration
    }

    pub fn current_position(&self) -> Vector3 {
        self.calculate_position(self.current_time)
    }

    pub fn update(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn calculate_position(&self, time: Duration) -> Vector3 {
        let t = (time.as_secs_f64() / self.duration.as_secs_f64()).min(1.0);
        let current_azimuth = self.start_azimuth + (self.end_azimuth - self.start_azimuth) * t;
        let current_elevation = self.start_elevation + (self.end_elevation - self.start_elevation) * t;
        let current_distance = self.start_distance + (self.end_distance - self.start_distance) * t;
        Vector3::from_aed(current_azimuth, current_elevation, current_distance)
    }
}

impl MotionModel for AEDLinearMotion {
    fn calculate_position(&self, time: Duration) -> Vector3 {
        self.calculate_position(time)
    }

    fn cycle_duration(&self) -> Duration {
        self.duration
    }

    fn is_cyclic(&self) -> bool {
        false
    }

    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
        Box::new((*self).clone())
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// Circular motion optimized for XYZ coordinates
#[derive(Clone)]
pub struct XYZCircularMotion {
    center: Vector3,
    radius: f64,
    frequency: f64,
    plane: CircularPlane,
    current_time: Duration,
}

impl XYZCircularMotion {
    pub fn new(center: Vector3, radius: f64, frequency: f64, plane: CircularPlane) -> Self {
        Self {
            center,
            radius,
            frequency,
            plane,
            current_time: Duration::from_secs(0),
        }
    }

    pub fn center(&self) -> Vector3 {
        self.center
    }

    pub fn radius(&self) -> f64 {
        self.radius
    }

    pub fn frequency(&self) -> f64 {
        self.frequency
    }

    pub fn current_position(&self) -> Vector3 {
        self.calculate_position(self.current_time)
    }

    pub fn update(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn calculate_position(&self, time: Duration) -> Vector3 {
        let angle = 2.0 * PI * self.frequency * time.as_secs_f64();
        let (x_offset, y_offset) = (self.radius * angle.cos(), self.radius * angle.sin());
        match self.plane {
            CircularPlane::XY => Vector3::new(
                self.center.x() + x_offset,
                self.center.y() + y_offset,
                self.center.z(),
            ),
            CircularPlane::YZ => Vector3::new(
                self.center.x(),
                self.center.y() + x_offset,
                self.center.z() + y_offset,
            ),
            CircularPlane::XZ => Vector3::new(
                self.center.x() + x_offset,
                self.center.y(),
                self.center.z() + y_offset,
            ),
        }
    }
}

impl MotionModel for XYZCircularMotion {
    fn calculate_position(&self, time: Duration) -> Vector3 {
        self.calculate_position(time)
    }

    fn cycle_duration(&self) -> Duration {
        Duration::from_secs_f64(1.0 / self.frequency)
    }

    fn is_cyclic(&self) -> bool {
        true
    }

    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
        Box::new((*self).clone())
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// Circular motion optimized for AED coordinates
#[derive(Clone)]
pub struct AEDCircularMotion {
    center_azimuth: f64,
    center_elevation: f64,
    distance: f64,
    radius: f64,
    frequency: f64,
    current_time: Duration,
}

impl AEDCircularMotion {
    pub fn new(center_azimuth: f64, center_elevation: f64, distance: f64, radius: f64, frequency: f64) -> Self {
        Self {
            center_azimuth,
            center_elevation,
            distance,
            radius,
            frequency,
            current_time: Duration::from_secs(0),
        }
    }

    pub fn center_azimuth(&self) -> f64 {
        self.center_azimuth
    }

    pub fn center_elevation(&self) -> f64 {
        self.center_elevation
    }

    pub fn distance(&self) -> f64 {
        self.distance
    }

    pub fn radius(&self) -> f64 {
        self.radius
    }

    pub fn frequency(&self) -> f64 {
        self.frequency
    }

    pub fn current_position(&self) -> Vector3 {
        self.calculate_position(self.current_time)
    }

    pub fn update(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn calculate_position(&self, time: Duration) -> Vector3 {
        let phase = 2.0 * PI * self.frequency * time.as_secs_f64();
        let azimuth_offset = (self.radius / 2.0) * phase.sin();
        Vector3::from_aed(
            self.center_azimuth + azimuth_offset,
            self.center_elevation,
            self.distance,
        )
    }
}

impl MotionModel for AEDCircularMotion {
    fn calculate_position(&self, time: Duration) -> Vector3 {
        self.calculate_position(time)
    }

    fn cycle_duration(&self) -> Duration {
        Duration::from_secs_f64(1.0 / self.frequency)
    }

    fn is_cyclic(&self) -> bool {
        true
    }

    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
        Box::new((*self).clone())
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

/// A motion that combines multiple other motions by adding their positions
#[derive(Clone, Default)]
pub struct CompositeMotion {
    motions: Vec<Box<dyn MotionModel + Send + Sync>>,
    current_time: Duration,
}

impl CompositeMotion {
    pub fn new(motions: Vec<Box<dyn MotionModel + Send + Sync>>) -> Self {
        Self {
            motions,
            current_time: Duration::from_secs(0),
        }
    }

    pub fn update(&mut self, time: Duration) {
        self.current_time = time;
    }

    pub fn current_position(&self) -> Vector3 {
        self.calculate_position(self.current_time)
    }
}

impl MotionModel for CompositeMotion {
    fn calculate_position(&self, time: Duration) -> Vector3 {
        self.motions.iter()
            .map(|motion| motion.calculate_position(time))
            .fold(Vector3::zero(), |acc, pos| acc + pos)
    }

    fn cycle_duration(&self) -> Duration {
        if self.motions.is_empty() {
            Duration::from_secs(0)
        } else {
            self.motions.iter()
                .map(|motion| motion.cycle_duration())
                .max()
                .unwrap()
        }
    }

    fn is_cyclic(&self) -> bool {
        !self.motions.is_empty() && self.motions.iter().all(|motion| motion.is_cyclic())
    }

    fn clone_box(&self) -> Box<dyn MotionModel + Send + Sync> {
        Box::new((*self).clone())
    }

    fn as_any(&self) -> &dyn Any {
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use approx::assert_relative_eq;

    #[test]
    fn test_linear_motion() {
        let start = Vector3::new(0.0, 0.0, 0.0);
        let end = Vector3::new(10.0, 5.0, 2.0);
        let duration = Duration::from_secs(2);
        let mut motion = LinearMotion::new(start, end, duration);

        // Test start position
        let pos = motion.calculate_position(Duration::from_secs(0));
        assert_relative_eq!(pos.x(), 0.0);
        assert_relative_eq!(pos.y(), 0.0);
        assert_relative_eq!(pos.z(), 0.0);

        // Test halfway point
        let pos = motion.calculate_position(Duration::from_secs(1));
        assert_relative_eq!(pos.x(), 5.0);
        assert_relative_eq!(pos.y(), 2.5);
        assert_relative_eq!(pos.z(), 1.0);

        // Test end position
        let pos = motion.calculate_position(Duration::from_secs(2));
        assert_relative_eq!(pos.x(), 10.0);
        assert_relative_eq!(pos.y(), 5.0);
        assert_relative_eq!(pos.z(), 2.0);

        // Test beyond duration (should clamp to end position)
        let pos = motion.calculate_position(Duration::from_secs(3));
        assert_relative_eq!(pos.x(), 10.0);
        assert_relative_eq!(pos.y(), 5.0);
        assert_relative_eq!(pos.z(), 2.0);
    }

    #[test]
    fn test_linear_motion_properties() {
        let motion = LinearMotion::new(
            Vector3::new(0.0, 0.0, 0.0),
            Vector3::new(1.0, 1.0, 1.0),
            Duration::from_secs(1),
        );

        assert!(!motion.is_cyclic());
        assert_eq!(motion.cycle_duration(), Duration::from_secs(1));
    }

    #[test]
    fn test_circular_motion() {
        let center = Vector3::new(1.0, 1.0, 1.0);
        let radius = 2.0;
        let frequency = 0.5; // 0.5 Hz = 2 seconds per cycle
        let mut motion = CircularMotion::new(center, radius, frequency, CircularPlane::XY);

        // Test start position (t = 0)
        let pos = motion.calculate_position(Duration::from_secs(0));
        assert_relative_eq!(pos.x(), center.x() + radius); // Start at (r, 0) offset
        assert_relative_eq!(pos.y(), center.y());
        assert_relative_eq!(pos.z(), center.z());

        // Test quarter cycle (t = 0.5s, 90 degrees)
        let pos = motion.calculate_position(Duration::from_millis(500));
        assert_relative_eq!(pos.x(), center.x());
        assert_relative_eq!(pos.y(), center.y() + radius);
        assert_relative_eq!(pos.z(), center.z());

        // Test half cycle (t = 1s, 180 degrees)
        let pos = motion.calculate_position(Duration::from_secs(1));
        assert_relative_eq!(pos.x(), center.x() - radius);
        assert_relative_eq!(pos.y(), center.y());
        assert_relative_eq!(pos.z(), center.z());
    }

    #[test]
    fn test_circular_motion_planes() {
        let center = Vector3::new(0.0, 0.0, 0.0);
        let radius = 1.0;
        let frequency = 1.0;

        // Test XY plane
        let motion = CircularMotion::new(center, radius, frequency, CircularPlane::XY);
        let pos = motion.calculate_position(Duration::from_secs(0));
        assert_relative_eq!(pos.x(), radius);
        assert_relative_eq!(pos.y(), 0.0);
        assert_relative_eq!(pos.z(), 0.0);

        // Test XZ plane
        let motion = CircularMotion::new(center, radius, frequency, CircularPlane::XZ);
        let pos = motion.calculate_position(Duration::from_secs(0));
        assert_relative_eq!(pos.x(), radius);
        assert_relative_eq!(pos.y(), 0.0);
        assert_relative_eq!(pos.z(), 0.0);

        // Test YZ plane
        let motion = CircularMotion::new(center, radius, frequency, CircularPlane::YZ);
        let pos = motion.calculate_position(Duration::from_secs(0));
        assert_relative_eq!(pos.x(), 0.0);
        assert_relative_eq!(pos.y(), radius);
        assert_relative_eq!(pos.z(), 0.0);
    }
}
