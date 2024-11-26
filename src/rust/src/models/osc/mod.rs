use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OSCConfig {
    pub host: String,
    pub port: u16,
    pub protocol: OSCProtocol,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum OSCProtocol {
    UDP,
    TCP,
}
