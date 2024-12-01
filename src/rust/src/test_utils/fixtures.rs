use crate::{
    animation::{
        models::{AnimationConfig, AnimationType},
    },
    osc::{
        types::{OSCConfig, OSCError, OSCErrorType},
        server::OSCServer,
    },
    Position,
};
use rosc::{OscMessage, OscType};

pub struct TestPositions;

impl TestPositions {
    pub fn origin() -> Position {
        Position::origin()
    }

    pub fn unit() -> Position {
        Position::with_position(1.0, 1.0, 1.0)
    }

    pub fn with_x(x: f64) -> Position {
        Position::with_position(x, 0.0, 0.0)
    }

    pub fn with_y(y: f64) -> Position {
        Position::with_position(0.0, y, 0.0)
    }

    pub fn with_z(z: f64) -> Position {
        Position::with_position(0.0, 0.0, z)
    }
}

pub struct TestOSC;

impl TestOSC {
    pub fn config() -> OSCConfig {
        OSCConfig {
            host: "127.0.0.1".to_string(),
            port: 9000,
            timeout_ms: 1000,
            server_address: "127.0.0.1".to_string(),
            server_port: 9001,
            client_address: "127.0.0.1".to_string(),
            client_port: 9002,
        }
    }

    pub fn message(addr: &str, args: Vec<OscType>) -> OscMessage {
        OscMessage {
            addr: addr.to_string(),
            args,
        }
    }

    pub fn error(error_type: OSCErrorType, message: &str) -> OSCError {
        OSCError::new(error_type, message.to_string())
    }
}

pub fn create_linear_animation_config(start: Position, end: Position) -> AnimationConfig {
    AnimationConfig {
        start_position: start,
        end_position: end,
        model_type: AnimationType::Linear,
        duration: 1000.0,
        loop_count: 1,
        radius: 1.0,
        positions: vec![],
    }
}

pub fn create_ease_inout_animation_config(start: Position, end: Position) -> AnimationConfig {
    AnimationConfig {
        start_position: start,
        end_position: end,
        model_type: AnimationType::EaseInOut,
        duration: 1000.0,
        loop_count: 1,
        radius: 1.0,
        positions: vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_positions() {
        let origin = TestPositions::origin();
        assert_eq!(origin.x, 0.0);
        assert_eq!(origin.y, 0.0);
        assert_eq!(origin.z, 0.0);

        let unit = TestPositions::unit();
        assert_eq!(unit.x, 1.0);
        assert_eq!(unit.y, 1.0);
        assert_eq!(unit.z, 1.0);

        let x_pos = TestPositions::with_x(2.0);
        assert_eq!(x_pos.x, 2.0);
        assert_eq!(x_pos.y, 0.0);
        assert_eq!(x_pos.z, 0.0);

        let y_pos = TestPositions::with_y(3.0);
        assert_eq!(y_pos.x, 0.0);
        assert_eq!(y_pos.y, 3.0);
        assert_eq!(y_pos.z, 0.0);

        let z_pos = TestPositions::with_z(4.0);
        assert_eq!(z_pos.x, 0.0);
        assert_eq!(z_pos.y, 0.0);
        assert_eq!(z_pos.z, 4.0);
    }

    #[test]
    fn test_animation_configs() {
        let start = TestPositions::origin();
        let end = TestPositions::unit();

        let linear = create_linear_animation_config(start.clone(), end.clone());
        assert_eq!(linear.model_type, AnimationType::Linear);
        assert_eq!(linear.start_position, start);
        assert_eq!(linear.end_position, end);
        assert_eq!(linear.duration, 1000.0);
        assert_eq!(linear.loop_count, 1);

        let ease = create_ease_inout_animation_config(start.clone(), end.clone());
        assert_eq!(ease.model_type, AnimationType::EaseInOut);
        assert_eq!(ease.start_position, start);
        assert_eq!(ease.end_position, end);
        assert_eq!(ease.duration, 1000.0);
        assert_eq!(ease.loop_count, 1);
    }

    #[test]
    fn test_osc_fixtures() {
        let config = TestOSC::config();
        assert_eq!(config.host, "127.0.0.1");
        assert_eq!(config.port, 9000);
        assert_eq!(config.timeout_ms, 1000);

        let msg = TestOSC::message("/test", vec![OscType::Float(1.0)]);
        assert_eq!(msg.addr, "/test");
        assert_eq!(msg.args.len(), 1);
        assert!(matches!(msg.args[0], OscType::Float(1.0)));

        let err = TestOSC::error(OSCErrorType::Network, "test error");
        assert_eq!(err.error_type, OSCErrorType::Network);
        assert_eq!(err.message, "test error");
    }
}
