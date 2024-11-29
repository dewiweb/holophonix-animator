use std::net::UdpSocket;
use rosc::{OscMessage, OscPacket, OscType};
use crate::error::AnimatorResult;
use crate::osc::types::*;

pub struct OSCClient {
    socket: UdpSocket,
    host: String,
    port: u16,
}

impl OSCClient {
    pub fn new(host: String, port: u16) -> AnimatorResult<Self> {
        let socket = UdpSocket::bind("0.0.0.0:0")?;
        Ok(Self { socket, host, port })
    }

    pub fn send_message(&self, addr: &str, args: Vec<OscType>) -> AnimatorResult<()> {
        let msg = OscMessage {
            addr: addr.to_string(),
            args,
        };
        let packet = OscPacket::Message(msg);
        let mut buf = Vec::new();
        let encoded = rosc::encoder::encode(&packet)?;
        buf.extend(encoded);
        self.socket.send_to(&buf, format!("{}:{}", self.host, self.port))?;
        Ok(())
    }

    // Position Control
    pub fn send_xyz(&self, track_id: &str, x: f64, y: f64, z: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/xyz", track_id),
            vec![
                OscType::Float(x as f32),
                OscType::Float(y as f32),
                OscType::Float(z as f32),
            ],
        )
    }

    pub fn send_aed(&self, track_id: &str, azim: f64, elev: f64, dist: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/aed", track_id),
            vec![
                OscType::Float(azim as f32),
                OscType::Float(elev as f32),
                OscType::Float(dist as f32),
            ],
        )
    }

    // Individual Coordinates
    pub fn send_x(&self, track_id: &str, value: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/x", track_id),
            vec![OscType::Float(value as f32)],
        )
    }

    pub fn send_y(&self, track_id: &str, value: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/y", track_id),
            vec![OscType::Float(value as f32)],
        )
    }

    pub fn send_z(&self, track_id: &str, value: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/z", track_id),
            vec![OscType::Float(value as f32)],
        )
    }

    pub fn send_azim(&self, track_id: &str, value: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/azim", track_id),
            vec![OscType::Float(value as f32)],
        )
    }

    pub fn send_elev(&self, track_id: &str, value: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/elev", track_id),
            vec![OscType::Float(value as f32)],
        )
    }

    pub fn send_dist(&self, track_id: &str, value: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/dist", track_id),
            vec![OscType::Float(value as f32)],
        )
    }

    // Coordinate Pairs
    pub fn send_xy(&self, track_id: &str, x: f64, y: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/xy", track_id),
            vec![OscType::Float(x as f32), OscType::Float(y as f32)],
        )
    }

    pub fn send_ae(&self, track_id: &str, azim: f64, elev: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/ae", track_id),
            vec![OscType::Float(azim as f32), OscType::Float(elev as f32)],
        )
    }

    // Relative Movement
    pub fn send_x_inc(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/x+", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_x_dec(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/x-", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_y_inc(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/y+", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_y_dec(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/y-", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_z_inc(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/z+", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_z_dec(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/z-", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_azim_inc(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/azim+", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_azim_dec(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/azim-", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_elev_inc(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/elev+", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_elev_dec(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/elev-", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_dist_inc(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/dist+", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    pub fn send_dist_dec(&self, track_id: &str, delta: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/dist-", track_id),
            vec![OscType::Float(delta as f32)],
        )
    }

    // Audio Properties
    pub fn send_gain(&self, track_id: &str, gain: f64) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/gain/value", track_id),
            vec![OscType::Float(gain as f32)],
        )
    }

    pub fn send_mute(&self, track_id: &str, mute: bool) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/mute", track_id),
            vec![OscType::Int(if mute { 1 } else { 0 })],
        )
    }

    // Visual Properties
    pub fn send_color(&self, track_id: &str, color: &Color) -> AnimatorResult<()> {
        self.send_message(
            &format!("/track/{}/color", track_id),
            vec![
                OscType::Float(color.r as f32),
                OscType::Float(color.g as f32),
                OscType::Float(color.b as f32),
                OscType::Float(color.a as f32),
            ],
        )
    }

    // State Queries
    pub fn send_query(&self, parameter_path: &str) -> AnimatorResult<()> {
        self.send_message(
            "/get",
            vec![OscType::String(parameter_path.to_string())],
        )
    }

    pub async fn send_parameters(&self, track_id: &str, params: &TrackParameters) -> AnimatorResult<()> {
        let addr = format!("/track/{}/xyz", track_id);
        let cartesian = params.cartesian.as_ref().ok_or_else(|| {
            OSCError::new(
                OSCErrorType::Protocol,
                "Cartesian coordinates not available".to_string()
            )
        })?;
        let msg = OscMessage {
            addr: addr.into(),
            args: vec![
                OscType::Float(cartesian.x as f32),
                OscType::Float(cartesian.y as f32),
                OscType::Float(cartesian.z as f32),
            ],
        };
        let encoded = rosc::encoder::encode(&OscPacket::Message(msg))?;
        self.socket.send(&encoded)?;
        Ok(())
    }

    pub async fn send_polar_parameters(&self, track_id: &str, params: &PolarCoordinates) -> AnimatorResult<()> {
        let addr = format!("/track/{}/aed", track_id);
        let msg = OscMessage {
            addr: addr.into(),
            args: vec![
                OscType::Float(params.azim as f32),
                OscType::Float(params.elev as f32),
                OscType::Float(params.dist as f32),
            ],
        };
        let encoded = rosc::encoder::encode(&OscPacket::Message(msg))?;
        self.socket.send(&encoded)?;
        Ok(())
    }
}
