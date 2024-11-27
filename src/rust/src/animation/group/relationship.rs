use crate::models::common::Position;

/// Types of relationships between tracks in a group
#[derive(Debug, Clone, PartialEq)]
pub enum RelationshipType {
    /// One track leads, others follow with optional offsets
    LeaderFollower,
    /// Tracks maintain positions relative to virtual center
    Isobarycentric,
    /// Tracks move independently but coordinate timing
    AsIndividuals,
}

/// Manages relationships between tracks in a group
pub struct Relationship {
    relationship_type: RelationshipType,
    leader_id: Option<String>,
    time_offset: f64,
    weights: Vec<f64>,
}

impl Relationship {
    pub fn new(relationship_type: RelationshipType) -> Self {
        Self {
            relationship_type,
            leader_id: None,
            time_offset: 0.0,
            weights: Vec::new(),
        }
    }

    /// Set up a leader-follower relationship
    pub fn set_leader(&mut self, leader_id: String) -> Result<(), String> {
        if self.relationship_type != RelationshipType::LeaderFollower {
            return Err("Can only set leader in LeaderFollower relationship".to_string());
        }
        self.leader_id = Some(leader_id);
        Ok(())
    }

    /// Set time offset for followers
    pub fn set_time_offset(&mut self, offset: f64) -> Result<(), String> {
        if offset < 0.0 {
            return Err("Time offset cannot be negative".to_string());
        }
        self.time_offset = offset;
        Ok(())
    }

    /// Set weights for isobarycentric relationship
    pub fn set_weights(&mut self, weights: Vec<f64>) -> Result<(), String> {
        if self.relationship_type != RelationshipType::Isobarycentric {
            return Err("Can only set weights in Isobarycentric relationship".to_string());
        }
        
        // Validate weights sum to 1.0
        let sum: f64 = weights.iter().sum();
        if (sum - 1.0).abs() > f64::EPSILON {
            return Err("Weights must sum to 1.0".to_string());
        }
        
        self.weights = weights;
        Ok(())
    }

    /// Calculate follower position based on leader
    pub fn calculate_follower_position(&self, leader_pos: &Position, offset: &Position) -> Position {
        match self.relationship_type {
            RelationshipType::LeaderFollower => {
                Position {
                    x: leader_pos.x + offset.x,
                    y: leader_pos.y + offset.y,
                    z: leader_pos.z + offset.z,
                }
            }
            _ => Position::default(),
        }
    }

    /// Calculate virtual center for isobarycentric relationship
    pub fn calculate_virtual_center(&self, positions: &[Position]) -> Result<Position, String> {
        if self.relationship_type != RelationshipType::Isobarycentric {
            return Err("Virtual center only applicable for Isobarycentric relationship".to_string());
        }

        if positions.len() != self.weights.len() {
            return Err("Number of positions must match number of weights".to_string());
        }

        let mut center = Position::default();
        for (pos, &weight) in positions.iter().zip(self.weights.iter()) {
            center.x += pos.x * weight;
            center.y += pos.y * weight;
            center.z += pos.z * weight;
        }

        Ok(center)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_leader_follower() {
        let mut rel = Relationship::new(RelationshipType::LeaderFollower);
        assert!(rel.set_leader("track_1".to_string()).is_ok());
        
        let leader_pos = Position { x: 1.0, y: 2.0, z: 3.0 };
        let offset = Position { x: 0.5, y: 0.5, z: 0.5 };
        let follower_pos = rel.calculate_follower_position(&leader_pos, &offset);
        
        assert_eq!(follower_pos.x, 1.5);
        assert_eq!(follower_pos.y, 2.5);
        assert_eq!(follower_pos.z, 3.5);
    }

    #[test]
    fn test_isobarycentric() {
        let mut rel = Relationship::new(RelationshipType::Isobarycentric);
        assert!(rel.set_weights(vec![0.5, 0.5]).is_ok());
        
        let positions = vec![
            Position { x: 0.0, y: 0.0, z: 0.0 },
            Position { x: 2.0, y: 2.0, z: 2.0 },
        ];
        
        let center = rel.calculate_virtual_center(&positions).unwrap();
        assert_eq!(center.x, 1.0);
        assert_eq!(center.y, 1.0);
        assert_eq!(center.z, 1.0);
    }
}
