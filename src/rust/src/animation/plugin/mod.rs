use std::collections::HashMap;
use napi_derive::napi;
use napi::bindgen_prelude::*;
use serde::{Serialize, Deserialize};
use crate::{AnimatorError, AnimatorResult, models::position::Position3D, models::common::AnimationConfig, Animation, AnimationConfig, Position};

#[napi(object)]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PluginSettings {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub settings: HashMap<String, String>, 
}

#[napi]
#[derive(Debug, Default, Clone)]
pub struct PluginState {
    #[napi(js_name = "animations")]
    pub animations: Arc<Mutex<Vec<Animation>>>,
}

#[napi]
impl PluginState {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            animations: Arc::new(Mutex::new(Vec::new())),
        }
    }

    #[napi]
    pub fn add_animation(&mut self, animation: Animation) -> Result<()> {
        self.animations.lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock animations: {}", e)))?
            .push(animation);
        Ok(())
    }

    #[napi]
    pub fn remove_animation(&mut self, id: String) -> Result<()> {
        let mut animations = self.animations.lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock animations: {}", e)))?;
        if let Some(index) = animations.iter().position(|a| a.get_id() == id) {
            animations.remove(index);
        }
        Ok(())
    }

    #[napi]
    pub fn get_animation(&self, id: String) -> Result<Option<Animation>> {
        let animations = self.animations.lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock animations: {}", e)))?;
        Ok(animations.iter().find(|a| a.get_id() == id).cloned())
    }

    #[napi]
    pub fn get_animations(&self) -> Result<Vec<Animation>> {
        self.animations.lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock animations: {}", e)))
            .map(|guard| guard.clone())
    }

    #[napi]
    pub async fn start_animation(&mut self, id: String) -> Result<()> {
        let mut animations = self.animations.lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock animations: {}", e)))?;
        if let Some(animation) = animations.iter_mut().find(|a| a.get_id() == id) {
            animation.start().await?;
        }
        Ok(())
    }

    #[napi]
    pub async fn stop_animation(&mut self, id: String) -> Result<()> {
        let mut animations = self.animations.lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock animations: {}", e)))?;
        if let Some(animation) = animations.iter_mut().find(|a| a.get_id() == id) {
            animation.stop().await?;
        }
        Ok(())
    }

    #[napi]
    pub async fn update_animations(&mut self, current_time: f64) -> Result<HashMap<String, Position>> {
        let mut animations = self.animations.lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock animations: {}", e)))?;
        
        let mut positions = HashMap::new();
        let mut completed = Vec::new();

        for animation in animations.iter_mut() {
            match animation.update(current_time).await {
                Ok(position) => {
                    positions.insert(animation.get_id(), position);
                    if animation.is_complete().await? {
                        completed.push(animation.get_id());
                    }
                }
                Err(e) => {
                    completed.push(animation.get_id());
                    eprintln!("Error updating animation {}: {}", animation.get_id(), e);
                }
            }
        }

        // Remove completed animations
        animations.retain(|a| !completed.contains(&a.get_id()));

        Ok(positions)
    }

    #[napi]
    pub async fn get_animation_position(&self, id: String) -> Result<Option<Position>> {
        let animations = self.animations.lock()
            .map_err(|e| Error::from_reason(format!("Failed to lock animations: {}", e)))?;
        
        if let Some(animation) = animations.iter().find(|a| a.get_id() == id) {
            Ok(Some(animation.update(0.0).await?))
        } else {
            Ok(None)
        }
    }
}

impl FromNapiValue for PluginState {
    unsafe fn from_napi_value(env: sys::napi_env, napi_val: sys::napi_value) -> Result<Self> {
        let obj = Object(napi_val);
        let animations = Vec::<Animation>::from_napi_value(env, obj.get_named_property_unchecked("animations")?)?;
        Ok(Self {
            animations: Arc::new(Mutex::new(animations)),
        })
    }
}

impl ToNapiValue for PluginState {
    unsafe fn to_napi_value(env: sys::napi_env, val: Self) -> Result<sys::napi_value> {
        let mut obj = Object::new(env)?;
        let animations = val.animations.lock().map_err(|_| Error::from_reason("Failed to lock animations"))?;
        obj.set("animations", animations.to_vec())?;
        Ok(obj.0)
    }
}

#[napi]
pub struct PluginManager {
    plugins: HashMap<String, PluginSettings>,
    states: HashMap<String, PluginState>,
}

#[napi]
impl PluginManager {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            plugins: HashMap::new(),
            states: HashMap::new(),
        }
    }

    #[napi]
    pub fn register_plugin(&mut self, settings: PluginSettings) -> Result<()> {
        self.plugins.insert(settings.id.clone(), settings);
        Ok(())
    }

    #[napi]
    pub fn unregister_plugin(&mut self, id: String) -> Result<()> {
        self.plugins.remove(&id);
        Ok(())
    }

    #[napi]
    pub fn get_plugin(&self, id: String) -> Result<Option<PluginSettings>> {
        Ok(self.plugins.get(&id).cloned())
    }

    #[napi]
    pub fn create_plugin_state(&mut self, state: PluginState) -> Result<()> {
        if !self.plugins.contains_key(&state.animations.lock().map_err(|_| Error::from_reason("Failed to lock animations"))?[0].get_id()) {
            return Err(Error::from_reason(format!(
                "Plugin '{}' not found",
                state.animations.lock().map_err(|_| Error::from_reason("Failed to lock animations"))?[0].get_id()
            )));
        }
        self.states.insert(state.animations.lock().map_err(|_| Error::from_reason("Failed to lock animations"))?[0].get_id().clone(), state);
        Ok(())
    }

    #[napi]
    pub fn remove_plugin_state(&mut self, id: String) -> Result<()> {
        self.states.remove(&id);
        Ok(())
    }

    #[napi]
    pub fn get_plugin_state(&self, id: String) -> Result<Option<PluginState>> {
        Ok(self.states.get(&id).cloned())
    }

    #[napi]
    pub fn update_plugin_state(&mut self, id: String, state: PluginState) -> Result<()> {
        if !self.states.contains_key(&id) {
            return Err(Error::from_reason(format!(
                "Plugin state '{}' not found",
                id
            )));
        }
        self.states.insert(id, state);
        Ok(())
    }

    #[napi]
    pub fn get_all_plugins(&self) -> Result<Vec<PluginSettings>> {
        Ok(self.plugins.values().cloned().collect())
    }

    #[napi]
    pub fn get_all_plugin_states(&self) -> Result<Vec<PluginState>> {
        Ok(self.states.values().cloned().collect())
    }
}

#[napi]
#[derive(Debug)]
pub struct AnimationPlugin {
    state: Arc<Mutex<PluginState>>,
    timeline: Arc<Mutex<Timeline>>,
}

#[napi]
impl AnimationPlugin {
    #[napi(constructor)]
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(PluginState::new())),
            timeline: Arc::new(Mutex::new(Timeline::new())),
        }
    }

    #[napi]
    pub async fn create_animation(&self, id: String, config: AnimationConfig) -> Result<()> {
        let animation = Animation::new(id.clone(), config)
            .map_err(|e| Error::from_reason(format!("Failed to create animation: {}", e)))?;
        
        self.timeline
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock timeline"))?
            .add_animation(animation)?;
        
        Ok(())
    }

    #[napi]
    pub async fn start_animation(&self, id: String) -> Result<()> {
        let mut timeline = self.timeline
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock timeline"))?;
        
        timeline.start_animation(id.clone())?;
        
        let mut state = self.state
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))?;
        
        state.active_animations
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock active animations"))?
            .insert(id);
        
        Ok(())
    }

    #[napi]
    pub async fn pause_animation(&self, id: String) -> Result<()> {
        let mut timeline = self.timeline
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock timeline"))?;
        
        timeline.pause_animation(id.clone())?;
        
        let mut state = self.state
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))?;
        
        let mut active = state.active_animations
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock active animations"))?;
        active.remove(&id);
        
        let mut paused = state.paused_animations
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock paused animations"))?;
        paused.insert(id);
        
        Ok(())
    }

    #[napi]
    pub async fn resume_animation(&self, id: String) -> Result<()> {
        let mut timeline = self.timeline
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock timeline"))?;
        
        timeline.resume_animation(id.clone())?;
        
        let mut state = self.state
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))?;
        
        let mut paused = state.paused_animations
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock paused animations"))?;
        paused.remove(&id);
        
        let mut active = state.active_animations
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock active animations"))?;
        active.insert(id);
        
        Ok(())
    }

    #[napi]
    pub async fn stop_animation(&self, id: String) -> Result<()> {
        let mut timeline = self.timeline
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock timeline"))?;
        
        timeline.stop_animation(id.clone())?;
        
        let mut state = self.state
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))?;
        
        state.mark_animation_complete(&id)?;
        
        Ok(())
    }

    #[napi]
    pub async fn update(&self, time: f64) -> Result<PluginState> {
        if time < 0.0 {
            return Err(Error::from_reason("Time must be non-negative"));
        }

        let mut timeline = self.timeline
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock timeline"))?;
        
        let positions = timeline.update(time)?;
        
        let mut state = self.state
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))?;
        
        for (id, position) in positions {
            state.update_state(StateUpdate::new(
                id.clone(),
                id.clone(), // Using same id for track_id for now
                id,
                position.clone(),
                position, // Using same position for rotation for now
                time,
            ))?;
        }
        
        Ok(state.clone())
    }

    #[napi]
    pub async fn clear(&self) -> Result<()> {
        let mut timeline = self.timeline
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock timeline"))?;
        
        timeline.clear()?;
        
        let mut state = self.state
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))?;
        
        state.positions
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock positions"))?
            .clear();
        
        state.rotations
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock rotations"))?
            .clear();
        
        state.active_animations
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock active animations"))?
            .clear();
        
        state.paused_animations
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock paused animations"))?
            .clear();
        
        Ok(())
    }

    #[napi]
    pub async fn get_state(&self) -> Result<PluginState> {
        self.state
            .lock()
            .map_err(|_| Error::from_reason("Failed to lock state"))
            .map(|state| state.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_registration() {
        let mut manager = PluginManager::new();
        
        let settings = PluginSettings {
            id: "plugin1".to_string(),
            name: "Test Plugin".to_string(),
            settings: HashMap::new(),
        };
        
        assert!(manager.register_plugin(settings.clone()).is_ok());
        
        let retrieved = manager.get_plugin("plugin1".to_string()).unwrap().unwrap();
        assert_eq!(retrieved.id, "plugin1");
        assert_eq!(retrieved.name, "Test Plugin");
        
        assert!(manager.unregister_plugin("plugin1".to_string()).is_ok());
        assert!(manager.get_plugin("plugin1".to_string()).unwrap().is_none());
    }

    #[test]
    fn test_plugin_state() {
        let mut manager = PluginManager::new();
        
        let settings = PluginSettings {
            id: "plugin1".to_string(),
            name: "Test Plugin".to_string(),
            settings: HashMap::new(),
        };
        manager.register_plugin(settings).unwrap();
        
        let state = PluginState::new();
        
        assert!(manager.create_plugin_state(state.clone()).is_ok());
        
        let retrieved = manager.get_plugin_state("plugin1".to_string()).unwrap().unwrap();
        assert_eq!(retrieved.animations.lock().unwrap()[0].get_id(), "plugin1");
        
        assert!(manager.remove_plugin_state("plugin1".to_string()).is_ok());
        assert!(manager.get_plugin_state("plugin1".to_string()).unwrap().is_none());
    }

    #[test]
    fn test_plugin_state_impl() {
        let mut state = PluginState::new();
        
        let config = AnimationConfig {
            model_type: "linear".to_string(),
            duration_ms: 1000.0,
            start_position: Position::new(0.0, 0.0, 0.0),
            end_position: Position::new(1.0, 1.0, 1.0),
            params: serde_json::Value::Null,
        };

        // Add animation
        state.add_animation(Animation::new("test1".to_string(), config)).unwrap();

        // Start animation
        state.start_animation("test1".to_string()).unwrap();

        // Update animation
        state.update_animations(500.0).unwrap();

        // Get position
        let pos = state.get_animation_position("test1".to_string()).unwrap();
        assert!((pos.x - 0.5).abs() < 1e-10);
        assert!((pos.y - 0.5).abs() < 1e-10);
        assert!((pos.z - 0.5).abs() < 1e-10);

        // Stop animation
        state.stop_animation("test1".to_string()).unwrap();
    }

    #[test]
    async fn test_animation_plugin() {
        let plugin = AnimationPlugin::new();

        // Create test animation
        let config = AnimationConfig::new(
            Position::new(0.0, 0.0, 0.0),
            Position::new(10.0, 10.0, 10.0),
            10.0,
            "linear".to_string(),
        );

        // Test creating animation
        plugin.create_animation("test".to_string(), config).await.unwrap();

        // Test starting animation
        plugin.start_animation("test".to_string()).await.unwrap();

        // Test updating animation
        let state = plugin.update(5.0).await.unwrap();
        let positions = state.animations.lock().unwrap();
        assert!(positions.contains(&Animation::new("test".to_string(), config).unwrap()));
        let pos = positions[0].get_position().unwrap();
        assert_eq!(pos.x, 5.0);
        assert_eq!(pos.y, 5.0);
        assert_eq!(pos.z, 5.0);

        // Test completing animation
        let state = plugin.update(10.0).await.unwrap();
        let positions = state.animations.lock().unwrap();
        assert!(positions.is_empty()); // Animation should be removed after completion

        // Test clear
        plugin.clear().await.unwrap();
        let state = plugin.get_state().await.unwrap();
        assert!(state.animations.lock().unwrap().is_empty());
    }
}
