pub mod math {
    pub mod vector;
}

pub mod animation;
pub mod state;
pub mod js_bindings;

#[cfg(not(test))]
pub mod napi;

pub use animation::{
    motion::{
        LinearMotion, CircularMotion, EllipticalMotion, SpiralMotion, CompositeMotion,
        CircularPlane,
    },
    models::MotionModel,
};

pub use state::Track;
