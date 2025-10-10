#[cfg(test)]
mod tests {
    use crate::state::{TrackRegistry, Group, GroupPattern, GroupRelation};
    use crate::math::vector::Vector3;
    use crate::animation::motion::CircularPlane;
    use std::time::Duration;

    #[derive(Clone)]
    pub struct Vector3JS {
        pub x: f64,
        pub y: f64,
        pub z: f64,
    }

    impl From<&Vector3JS> for Vector3 {
        fn from(v: &Vector3JS) -> Self {
            Vector3::new(v.x, v.y, v.z)
        }
    }

    impl From<&Vector3> for Vector3JS {
        fn from(v: &Vector3) -> Self {
            Vector3JS {
                x: v.x(),
                y: v.y(),
                z: v.z(),
            }
        }
    }

    #[derive(Clone)]
    pub struct GroupPatternJS {
        pub pattern_type: String,
        pub params: Vec<f64>,
    }

    impl Default for GroupPatternJS {
        fn default() -> Self {
            Self {
                pattern_type: "circle".to_string(),
                params: vec![1.0, 0.0, 0.0],
            }
        }
    }

    impl From<&GroupPatternJS> for GroupPattern {
        fn from(pattern: &GroupPatternJS) -> Self {
            match pattern.pattern_type.as_str() {
                "all" => GroupPattern::All,
                "pattern" => GroupPattern::Pattern(pattern.params.first().map(|p| p.to_string()).unwrap_or_default()),
                "list" => GroupPattern::List(pattern.params.iter().map(|p| p.to_string()).collect()),
                _ => GroupPattern::All,
            }
        }
    }

    #[derive(Clone)]
    pub struct GroupRelationJS {
        pub relation_type: String,
        pub params: Vec<f64>,
    }

    impl Default for GroupRelationJS {
        fn default() -> Self {
            Self {
                relation_type: "fixed".to_string(),
                params: vec![],
            }
        }
    }

    impl From<&GroupRelationJS> for GroupRelation {
        fn from(relation: &GroupRelationJS) -> Self {
            match relation.relation_type.as_str() {
                "none" => GroupRelation::None,
                "follow" => GroupRelation::Follow(relation.params.first().map(|p| p.to_string()).unwrap_or_default()),
                "offset" => {
                    if relation.params.len() >= 3 {
                        GroupRelation::Offset(Vector3::new(
                            relation.params[0],
                            relation.params[1],
                            relation.params[2],
                        ))
                    } else {
                        GroupRelation::None
                    }
                }
                "rotate" => {
                    if relation.params.len() >= 4 {
                        GroupRelation::Rotate {
                            angle: relation.params[0],
                            axis: Vector3::new(
                                relation.params[1],
                                relation.params[2],
                                relation.params[3],
                            ),
                            center: if relation.params.len() >= 7 {
                                Some(Vector3::new(
                                    relation.params[4],
                                    relation.params[5],
                                    relation.params[6],
                                ))
                            } else {
                                None
                            },
                        }
                    } else {
                        GroupRelation::None
                    }
                }
                "phase" => GroupRelation::Phase(relation.params.first().copied().unwrap_or_default()),
                "isobarycentric" => GroupRelation::Isobarycentric {
                    reference_distance: relation.params.first().copied(),
                    maintain_plane: relation.params.get(1).copied().unwrap_or_default() > 0.0,
                },
                _ => GroupRelation::None,
            }
        }
    }

    pub struct TrackRegistryJS {
        inner: TrackRegistry,
    }

    impl TrackRegistryJS {
        pub fn new() -> Self {
            Self {
                inner: TrackRegistry::new(),
            }
        }

        pub fn add_track(&mut self, track_id: String) -> bool {
            self.inner.add_track(track_id)
        }

        pub fn remove_track(&mut self, track_id: String) -> bool {
            self.inner.remove_track(&track_id)
        }

        pub fn get_track_position(&self, track_id: String) -> Option<Vector3JS> {
            self.inner.get_track(&track_id)
                .map(|track| (&track.position()).into())
        }

        pub fn update_track_position(&mut self, track_id: String, position: Vector3JS) -> bool {
            self.inner.update_track_position(&track_id, (&position).into())
        }
    }

    pub struct GroupJS {
        inner: Group,
    }

    impl GroupJS {
        pub fn new(name: String, pattern: GroupPatternJS) -> Self {
            Self {
                inner: Group::new(&name, (&pattern).into()),
            }
        }

        pub fn update_members(&mut self, registry: &TrackRegistryJS) {
            self.inner.update_members(&registry.inner);
        }

        pub fn get_members(&self) -> Vec<String> {
            self.inner.tracks().iter().cloned().collect()
        }

        pub fn set_relation(&mut self, track_id: String, relation: GroupRelationJS) {
            self.inner.set_relation(&track_id, (&relation).into());
        }

        pub fn update_positions(&mut self, registry: &mut TrackRegistryJS, time: f64) {
            self.inner.update_positions(&mut registry.inner, Duration::from_secs_f64(time));
        }
    }

    #[test]
    fn test_track_registry() {
        let mut registry = TrackRegistryJS::new();
        assert!(registry.add_track("track1".to_string()));
        assert!(registry.add_track("track2".to_string()));
        
        let pos = Vector3JS { x: 1.0, y: 2.0, z: 3.0 };
        assert!(registry.update_track_position("track1".to_string(), pos.clone()));
        
        let retrieved_pos = registry.get_track_position("track1".to_string()).unwrap();
        assert_eq!(retrieved_pos.x, pos.x);
        assert_eq!(retrieved_pos.y, pos.y);
        assert_eq!(retrieved_pos.z, pos.z);
    }

    #[test]
    fn test_group() {
        let mut registry = TrackRegistryJS::new();
        registry.add_track("track1".to_string());
        registry.add_track("track2".to_string());

        let pattern = GroupPatternJS {
            pattern_type: "all".to_string(),
            params: vec![],
        };

        let mut group = GroupJS::new("test_group".to_string(), pattern);
        group.update_members(&registry);

        let relation = GroupRelationJS {
            relation_type: "rotate".to_string(),
            params: vec![45.0, 0.0, 0.0, 1.0],
        };
        group.set_relation("track1".to_string(), relation);

        group.update_positions(&mut registry, 0.0);
        let pos = registry.get_track_position("track1".to_string()).unwrap();
        assert!(pos.x != 0.0 || pos.y != 0.0 || pos.z != 0.0);
    }
}
