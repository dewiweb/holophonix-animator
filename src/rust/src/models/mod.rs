pub mod common;
pub mod animation;
pub mod position;
pub mod state;
pub mod osc;

// Re-export common types
pub use animation::Animation;
pub use animation::AnimationConfig;
pub use position::Position;
pub use state::TrackParameters;
pub use position::Position3D;
