use crate::{
    animation::models::{Position, AnimationConfig},
    osc::types::OSCConfig,
};

pub struct TestPositions;

impl TestPositions {
    pub fn origin() -> Position {
        Position::zero()
    }

    pub fn unit() -> Position {
        Position::with_position(1.0, 1.0, 1.0)
    }

    pub fn x(x: f64) -> Position {
        Position::with_position(x, 0.0, 0.0)
    }

    pub fn y(y: f64) -> Position {
        Position::with_position(0.0, y, 0.0)
    }

    pub fn z(z: f64) -> Position {
        Position::with_position(0.0, 0.0, z)
    }
}

pub struct TestConfigs;

impl TestConfigs {
    pub fn osc() -> OSCConfig {
        OSCConfig::new("127.0.0.1", 9001)
    }

    pub fn linear_animation() -> AnimationConfig {
        AnimationConfig::linear(
            Position::zero(),
            Position::with_position(1.0, 1.0, 1.0),
        )
    }

    pub fn circular_animation() -> AnimationConfig {
        AnimationConfig::circular(
            Position::zero(),
            Position::with_position(1.0, 1.0, 1.0),
            1.0,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_positions() {
        let origin = TestPositions::origin();
        assert_eq!(origin, Position::zero());

        let unit = TestPositions::unit();
        assert_eq!(unit, Position::with_position(1.0, 1.0, 1.0));

        let x = TestPositions::x(2.0);
        assert_eq!(x, Position::with_position(2.0, 0.0, 0.0));

        let y = TestPositions::y(3.0);
        assert_eq!(y, Position::with_position(0.0, 3.0, 0.0));

        let z = TestPositions::z(4.0);
        assert_eq!(z, Position::with_position(0.0, 0.0, 4.0));
    }

    #[test]
    fn test_configs() {
        let osc = TestConfigs::osc();
        assert_eq!(osc.host, "127.0.0.1");
        assert_eq!(osc.port, 9001);

        let linear = TestConfigs::linear_animation();
        assert_eq!(linear.model_type, "linear");
        assert_eq!(linear.radius, 0.0);
        assert_eq!(linear.start_position, Position::zero());
        assert_eq!(linear.end_position, Position::with_position(1.0, 1.0, 1.0));

        let circular = TestConfigs::circular_animation();
        assert_eq!(circular.model_type, "circular");
        assert_eq!(circular.radius, 1.0);
        assert_eq!(circular.start_position, Position::zero());
        assert_eq!(circular.end_position, Position::with_position(1.0, 1.0, 1.0));
    }
}
