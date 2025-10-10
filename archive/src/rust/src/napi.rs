#[cfg(feature = "node-api")]
mod napi_bindings {
    use napi_derive::napi;
    use napi::bindgen_prelude::*;
    use serde::{Serialize, Deserialize};
    use crate::js_bindings::*;

    impl ObjectFinalize for GroupJSNapi {}
    impl ObjectFinalize for TrackRegistryJSNapi {}

    #[napi]
    pub fn init() -> napi::Result<()> {
        Ok(())
    }

    #[napi(object)]
    #[derive(Clone, Serialize, Deserialize)]
    #[derive(Default)]
    pub struct Vector3JSNapi {
        pub x: f64,
        pub y: f64,
        pub z: f64,
    }

    impl From<Vector3JSNapi> for Vector3JS {
        fn from(v: Vector3JSNapi) -> Self {
            Vector3JS {
                x: v.x,
                y: v.y,
                z: v.z,
            }
        }
    }

    impl From<Vector3JS> for Vector3JSNapi {
        fn from(v: Vector3JS) -> Self {
            Vector3JSNapi {
                x: v.x,
                y: v.y,
                z: v.z,
            }
        }
    }

    #[napi(object)]
    #[derive(Clone, Serialize, Deserialize)]
    #[derive(Default)]
    pub struct GroupJSNapi {
        pub name: String,
        pub pattern_type: String,
    }

    #[napi]
    impl GroupJSNapi {
        #[napi(constructor)]
        pub fn new() -> Self {
            Self {
                name: "default".to_string(),
                pattern_type: "default".to_string(),
            }
        }

        #[napi]
        pub fn create_group(name: String, pattern: String) -> Self {
            Self {
                name,
                pattern_type: pattern,
            }
        }

        #[napi]
        pub fn add_track(track_id: String) -> bool {
            true
        }

        #[napi]
        pub fn remove_track(track_id: String) -> bool {
            true
        }

        #[napi]
        pub fn get_track_position(track_id: String) -> Option<Vector3JSNapi> {
            None
        }

        #[napi]
        pub fn update_track_position(track_id: String, position: Vector3JSNapi) -> bool {
            true
        }
    }

    #[napi(object)]
    #[derive(Clone, Serialize, Deserialize)]
    #[derive(Default)]
    pub struct TrackRegistryJSNapi {
        pub id: String,
    }

    #[napi]
    impl TrackRegistryJSNapi {
        #[napi(constructor)]
        pub fn new() -> Self {
            Self {
                id: "default".to_string(),
            }
        }

        #[napi]
        pub fn get_members() -> Vec<String> {
            vec![]
        }

        #[napi]
        pub fn update_positions() -> bool {
            true
        }
    }

    #[napi(object)]
    #[derive(Clone, Serialize, Deserialize)]
    #[derive(Default)]
    pub struct GroupPatternJSNapi {
        pub pattern_type: String,
        pub params: Vec<f64>,
    }

    impl From<GroupPatternJS> for GroupPatternJSNapi {
        fn from(p: GroupPatternJS) -> Self {
            Self {
                pattern_type: p.pattern_type,
                params: p.params,
            }
        }
    }

    impl From<GroupPatternJSNapi> for GroupPatternJS {
        fn from(p: GroupPatternJSNapi) -> Self {
            Self {
                pattern_type: p.pattern_type,
                params: p.params,
            }
        }
    }

    #[napi(object)]
    #[derive(Clone, Serialize, Deserialize)]
    #[derive(Default)]
    pub struct GroupRelationJSNapi {
        pub relation_type: String,
        pub params: Vec<f64>,
    }

    impl From<GroupRelationJS> for GroupRelationJSNapi {
        fn from(r: GroupRelationJS) -> Self {
            Self {
                relation_type: r.relation_type,
                params: r.params,
            }
        }
    }

    impl From<GroupRelationJSNapi> for GroupRelationJS {
        fn from(r: GroupRelationJSNapi) -> Self {
            Self {
                relation_type: r.relation_type,
                params: r.params,
            }
        }
    }
}

#[cfg(feature = "node-api")]
pub use napi_bindings::*;

