use crate::error::Result;
use crate::Position;
use napi::bindgen_prelude::*;
use napi_derive::napi;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use super::error::AnimatorError;
use super::models::{Animation, AnimationState, TimelineState};
use crate::osc::manager::OSCManager;
use crate::osc::types::OSCMessage;

#[napi]
pub struct AnimationEngine {
    state: Arc<Mutex<AnimationState>>,
    osc_manager: Arc<Mutex<OSCManager>>,
    last_update: Arc<Mutex<Instant>>,
    config: AnimationConfig,
    current_position: Arc<Mutex<Position>>,
}

#[napi]
impl AnimationEngine {
    #[napi(constructor)]
    pub fn new(osc_manager: OSCManager, config: AnimationConfig) -> Self {
        Self {
            state: Arc::new(Mutex::new(AnimationState::default())),
            osc_manager: Arc::new(Mutex::new(osc_manager)),
            last_update: Arc::new(Mutex::new(Instant::now())),
            config,
            current_position: Arc::new(Mutex::new(Position::default())),
        }
    }

    #[napi]
    pub fn load_animation(&self, animation: Animation) -> Result<(), AnimatorError> {
        let mut state = self.state.lock().unwrap();
        state.current_animation = Some(animation);
        state.timeline = TimelineState::default();
        Ok(())
    }

    #[napi]
    pub fn play(&self) -> Result<(), AnimatorError> {
        let mut state = self.state.lock().unwrap();
        if state.current_animation.is_none() {
            return Err(AnimatorError::NoAnimationLoaded);
        }
        state.timeline.is_playing = true;
        *self.last_update.lock().unwrap() = Instant::now();
        Ok(())
    }

    #[napi]
    pub fn pause(&self) -> Result<(), AnimatorError> {
        let mut state = self.state.lock().unwrap();
        state.timeline.is_playing = false;
        Ok(())
    }

    #[napi]
    pub fn reset(&self) -> Result<(), AnimatorError> {
        let mut state = self.state.lock().unwrap();
        if let Some(animation) = &state.current_animation {
            state.timeline.current_time = 0.0;
            state.timeline.is_playing = false;
        }
        Ok(())
    }

    #[napi]
    pub fn seek(&self, time: f64) -> Result<(), AnimatorError> {
        let mut state = self.state.lock().unwrap();
        if let Some(animation) = &state.current_animation {
            state.timeline.current_time = time.max(0.0).min(animation.duration);
        }
        Ok(())
    }

    #[napi]
    pub fn update(&self) -> Result<(), AnimatorError> {
        let mut state = self.state.lock().unwrap();
        if !state.timeline.is_playing {
            return Ok(());
        }

        let now = Instant::now();
        let delta = now.duration_since(*self.last_update.lock().unwrap());
        *self.last_update.lock().unwrap() = now;

        if let Some(animation) = &state.current_animation {
            state.timeline.current_time += delta.as_secs_f64();
            if state.timeline.current_time >= animation.duration {
                if state.timeline.loop_enabled {
                    state.timeline.current_time %= animation.duration;
                } else {
                    state.timeline.current_time = animation.duration;
                    state.timeline.is_playing = false;
                }
            }

            // Send current position to OSC
            let position = animation.get_position_at_time(state.timeline.current_time)?;
            let msg = OSCMessage {
                address: format!("/source/{}/xyz", animation.track_id),
                args: vec![
                    position.x.into(),
                    position.y.into(),
                    position.z.into(),
                ],
            };
            self.osc_manager.lock().unwrap().send(msg)?;

            // Update current position
            let mut current = self.current_position.lock().await;
            *current = position;
        }

        Ok(())
    }

    #[napi]
    pub fn get_state(&self) -> Result<AnimationState, AnimatorError> {
        Ok(self.state.lock().unwrap().clone())
    }

    #[napi]
    pub fn set_loop(&self, enabled: bool) -> Result<(), AnimatorError> {
        let mut state = self.state.lock().unwrap();
        state.timeline.loop_enabled = enabled;
        Ok(())
    }

    #[napi]
    pub async fn calculate_linear_positions(
        &self,
        start: Position,
        end: Position,
        duration_ms: f64,
    ) -> Result<Vec<Position>> {
        let steps = (duration_ms / self.config.update_interval).ceil() as usize;
        let mut positions = Vec::with_capacity(steps);

        for i in 0..=steps {
            let t = i as f64 / steps as f64;
            let current = start.lerp(&end, t);
            positions.push(current);
        }

        Ok(positions)
    }

    #[napi]
    pub async fn interpolate_position(
        &self,
        start: Position,
        end: Position,
        progress: f64,
    ) -> Result<Position> {
        Ok(start.lerp(&end, progress))
    }

    #[napi]
    pub async fn update_position(&self, position: Position) -> Result<()> {
        let mut current = self.current_position.lock().await;
        *current = position;
        Ok(())
    }

    #[napi]
    pub async fn get_current_position(&self) -> Result<Position> {
        let current = self.current_position.lock().await;
        Ok((*current).clone())
    }
}

#[napi(object)]
#[derive(Clone)]
pub struct AnimationConfig {
    pub fps: i32,
    #[napi(ts_type = "number")]
    pub update_interval: f64,
    pub interpolation_steps: i32,
}
