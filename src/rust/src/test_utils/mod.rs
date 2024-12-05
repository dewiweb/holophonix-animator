use std::sync::Arc;
use tokio::sync::Mutex as TokioMutex;
use crate::{
    animation::AnimationEngine,
    error::AnimatorResult,
    osc::{
        OSCServer,
        OSCMessage,
        OSCConfig,
        OSCMessageArg,
        OSCMessageArgType,
    },
    state::StateManager,
    Position,
};

use std::time::Duration;

pub struct TestContext {
    pub animation_manager: Arc<TokioMutex<AnimationEngine>>,
    pub state_manager: Arc<TokioMutex<StateManager>>,
    pub osc_server: Option<Arc<TokioMutex<dyn OSCServer + Send>>>,
}

impl TestContext {
    pub async fn new() -> AnimatorResult<Self> {
        Ok(Self {
            animation_manager: Arc::new(TokioMutex::new(AnimationEngine::new())),
            state_manager: Arc::new(TokioMutex::new(StateManager::new())),
            osc_server: None,
        })
    }

    pub async fn with_osc() -> AnimatorResult<Self> {
        let mut ctx = Self::new().await?;
        ctx.osc_server = Some(Arc::new(TokioMutex::new(mocks::MockOSCServer::new())));
        Ok(ctx)
    }

    pub async fn cleanup(&self) -> AnimatorResult<()> {
        if let Some(osc_server) = &self.osc_server {
            let mut server = osc_server.lock().await;
            if let Some(mock) = server.downcast_mut::<mocks::MockOSCServer>() {
                mock.clear_messages().await;
            }
        }
        Ok(())
    }
}

impl Default for TestContext {
    fn default() -> Self {
        TestContext {
            animation_manager: Arc::new(TokioMutex::new(AnimationEngine::new())),
            state_manager: Arc::new(TokioMutex::new(StateManager::new())),
            osc_server: None,
        }
    }
}

impl TestContext {
    pub async fn with_mock_osc() -> Self {
        let mut ctx = Self::default();
        ctx.osc_server = Some(Arc::new(TokioMutex::new(mocks::MockOSCServer::new())));
        ctx
    }

    pub async fn clear_messages(&self) {
        if let Some(server) = &self.osc_server {
            let mut server = server.lock().await;
            if let Some(mock) = server.downcast_mut::<mocks::MockOSCServer>() {
                mock.clear_messages();
            }
        }
    }
}

pub struct TestPositions;

impl TestPositions {
    pub fn origin() -> Position {
        Position {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            rx: 0.0,
            ry: 0.0,
            rz: 0.0,
        }
    }

    pub fn unit() -> Position {
        Position {
            x: 1.0,
            y: 1.0,
            z: 1.0,
            rx: 1.0,
            ry: 1.0,
            rz: 1.0,
        }
    }
}

#[cfg(test)]
pub fn create_test_position() -> Position {
    Position::new(0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
}

#[cfg(test)]
pub fn create_test_animation() -> Animation {
    let start_pos = create_test_position();
    let end_pos = Position::new(10.0, 10.0, 10.0, 0.0, 0.0, 0.0);
    let model = LinearModel {
        start_position: start_pos,
        end_position: end_pos,
        duration: Duration::from_secs(10),
    };

    Animation {
        id: "test_animation".to_string(),
        animation_type: crate::animation::models::AnimationTypeEnum::Linear,
        model: Box::new(model),
        state: crate::animation::models::AnimationStateStruct {
            current_position: start_pos,
            start_time: Duration::from_secs(0),
            end_time: Duration::from_secs(10),
            is_running: false,
        },
    }
}

#[cfg(test)]
pub fn create_test_osc_config() -> OSCConfig {
    OSCConfig {
        host: "127.0.0.1".to_string(),
        port: 9000,
    }
}

#[cfg(test)]
pub fn create_test_osc_message() -> OSCMessage {
    OSCMessage {
        address: "/test".to_string(),
        args: vec![
            OSCMessageArg {
                arg_type: OSCMessageArgType::Int,
                int_value: Some(42),
                float_value: None,
                string_value: None,
                bool_value: None,
            },
            OSCMessageArg {
                arg_type: OSCMessageArgType::Float,
                int_value: None,
                float_value: Some(3.14),
                string_value: None,
                bool_value: None,
            },
        ],
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_test_position() {
        let pos = create_test_position();
        assert_eq!(pos.x, 0.0);
        assert_eq!(pos.y, 0.0);
        assert_eq!(pos.z, 0.0);
    }

    #[test]
    fn test_create_test_animation() {
        let animation = create_test_animation();
        assert_eq!(animation.id, "test_animation");
        assert!(!animation.state.is_running);
    }

    #[test]
    fn test_create_test_osc_config() {
        let config = create_test_osc_config();
        assert_eq!(config.host, "127.0.0.1");
        assert_eq!(config.port, 9000);
    }

    #[test]
    fn test_create_test_osc_message() {
        let msg = create_test_osc_message();
        assert_eq!(msg.address, "/test");
        assert_eq!(msg.args.len(), 2);
        
        assert!(matches!(msg.args[0].arg_type, OSCMessageArgType::Int));
        assert_eq!(msg.args[0].int_value, Some(42));
        
        assert!(matches!(msg.args[1].arg_type, OSCMessageArgType::Float));
        assert!((msg.args[1].float_value.unwrap() - 3.14).abs() < f32::EPSILON);
    }
}
