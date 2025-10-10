use std::time::Duration;
use crate::math::vector::Vector3;
use super::motion::CircularPlane;

/// Parameters for different types of motion
#[derive(Debug, Clone, PartialEq)]
pub enum MotionParameters {
    Linear {
        start: Vector3,
        end: Vector3,
        duration: Duration,
    },
    Circular {
        center: Vector3,
        radius: f64,
        frequency: f64,
        plane: CircularPlane,
    },
    Elliptical {
        center: Vector3,
        radius_x: f64,
        radius_y: f64,
        frequency: f64,
        plane: CircularPlane,
    },
    Spiral {
        center: Vector3,
        start_radius: f64,
        end_radius: f64,
        frequency: f64,
        plane: CircularPlane,
    },
    Composite {
        motions: Vec<MotionParameters>,
    },
}

impl Default for MotionParameters {
    fn default() -> Self {
        Self::Linear {
            start: Vector3::zero(),
            end: Vector3::zero(),
            duration: Duration::from_secs(1),
        }
    }
}

impl MotionParameters {
    /// Interpolate between two motion parameters using a factor t (0 to 1)
    pub fn interpolate(from: &Self, to: &Self, t: f64) -> Self {
        match (from, to) {
            // Linear to Linear: Interpolate start and end points
            (Self::Linear { start: start1, end: end1, duration: d1 },
             Self::Linear { start: start2, end: end2, duration: d2 }) => {
                // For linear motion, we want to interpolate between the actual positions
                // at time t, not just the parameters
                let from_pos = start1.lerp(&end1, t);
                let to_pos = start2.lerp(&end2, t);
                
                Self::Linear {
                    start: from_pos,
                    end: to_pos,
                    duration: Duration::from_secs_f64(
                        d1.as_secs_f64() * (1.0 - t) + d2.as_secs_f64() * t
                    ),
                }
            }
            
            // Circular to Circular: Interpolate center, radius and frequency
            (Self::Circular { center: c1, radius: r1, frequency: f1, plane: p1 },
             Self::Circular { center: c2, radius: r2, frequency: f2, plane: p2 }) => {
                // If planes are different, use the target plane after midpoint
                let plane = if t < 0.5 { *p1 } else { *p2 };
                
                Self::Circular {
                    center: c1.lerp(&c2, t),
                    radius: r1 * (1.0 - t) + r2 * t,
                    frequency: f1 * (1.0 - t) + f2 * t,
                    plane,
                }
            }
            
            // Elliptical to Elliptical: Interpolate center, radii and frequency
            (Self::Elliptical { center: c1, radius_x: rx1, radius_y: ry1, frequency: f1, plane: p1 },
             Self::Elliptical { center: c2, radius_x: rx2, radius_y: ry2, frequency: f2, plane: p2 }) => {
                let plane = if t < 0.5 { *p1 } else { *p2 };
                
                Self::Elliptical {
                    center: c1.lerp(&c2, t),
                    radius_x: rx1 * (1.0 - t) + rx2 * t,
                    radius_y: ry1 * (1.0 - t) + ry2 * t,
                    frequency: f1 * (1.0 - t) + f2 * t,
                    plane,
                }
            }
            
            // Spiral to Spiral: Interpolate center, radii and frequency
            (Self::Spiral { center: c1, start_radius: sr1, end_radius: er1, frequency: f1, plane: p1 },
             Self::Spiral { center: c2, start_radius: sr2, end_radius: er2, frequency: f2, plane: p2 }) => {
                let plane = if t < 0.5 { *p1 } else { *p2 };
                
                Self::Spiral {
                    center: c1.lerp(&c2, t),
                    start_radius: sr1 * (1.0 - t) + sr2 * t,
                    end_radius: er1 * (1.0 - t) + er2 * t,
                    frequency: f1 * (1.0 - t) + f2 * t,
                    plane,
                }
            }
            
            // Different types: Convert to Linear motion between current positions
            _ => {
                // Default to a linear interpolation between the current positions
                // This requires calculating the current position for each motion type
                // For now, we'll just return a default linear motion
                // TODO: Implement proper conversion between different motion types
                Self::Linear {
                    start: Vector3::zero(),
                    end: Vector3::zero(),
                    duration: Duration::from_secs(1),
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_motion_parameters_default() {
        let params = MotionParameters::default();
        match params {
            MotionParameters::Linear { start, end, duration } => {
                assert_eq!(start, Vector3::zero());
                assert_eq!(end, Vector3::zero());
                assert_eq!(duration, Duration::from_secs(1));
            }
            _ => panic!("Default should be Linear motion"),
        }
    }

    #[test]
    fn test_motion_parameters_clone() {
        let params = MotionParameters::Circular {
            center: Vector3::new(1.0, 2.0, 3.0),
            radius: 5.0,
            frequency: 1.0,
            plane: CircularPlane::XY,
        };
        
        let cloned = params.clone();
        assert_eq!(params, cloned);
    }

    #[test]
    fn test_motion_parameters_debug() {
        let params = MotionParameters::Spiral {
            center: Vector3::zero(),
            start_radius: 1.0,
            end_radius: 2.0,
            frequency: 1.0,
            plane: CircularPlane::XZ,
        };
        
        let debug_str = format!("{:?}", params);
        assert!(debug_str.contains("Spiral"));
        assert!(debug_str.contains("start_radius: 1.0"));
        assert!(debug_str.contains("end_radius: 2.0"));
    }

    #[test]
    fn test_linear_interpolation() {
        let params1 = MotionParameters::Linear {
            start: Vector3::zero(),
            end: Vector3::new(1.0, 0.0, 0.0),
            duration: Duration::from_secs(1),
        };
        
        let params2 = MotionParameters::Linear {
            start: Vector3::new(1.0, 0.0, 0.0),
            end: Vector3::new(2.0, 0.0, 0.0),
            duration: Duration::from_secs(2),
        };
        
        let interpolated = MotionParameters::interpolate(&params1, &params2, 0.5);
        match interpolated {
            MotionParameters::Linear { start, end, duration } => {
                assert_eq!(start, Vector3::new(0.5, 0.0, 0.0));
                assert_eq!(end, Vector3::new(1.5, 0.0, 0.0));
                assert_eq!(duration.as_secs_f64(), 1.5);
            }
            _ => panic!("Expected Linear motion"),
        }
    }

    #[test]
    fn test_circular_interpolation() {
        let params1 = MotionParameters::Circular {
            center: Vector3::zero(),
            radius: 1.0,
            frequency: 1.0,
            plane: CircularPlane::XY,
        };
        
        let params2 = MotionParameters::Circular {
            center: Vector3::new(1.0, 0.0, 0.0),
            radius: 2.0,
            frequency: 2.0,
            plane: CircularPlane::XY,
        };
        
        let interpolated = MotionParameters::interpolate(&params1, &params2, 0.5);
        match interpolated {
            MotionParameters::Circular { center, radius, frequency, plane } => {
                assert_eq!(center, Vector3::new(0.5, 0.0, 0.0));
                assert_eq!(radius, 1.5);
                assert_eq!(frequency, 1.5);
                assert_eq!(plane, CircularPlane::XY);
            }
            _ => panic!("Expected Circular motion"),
        }
    }
}
