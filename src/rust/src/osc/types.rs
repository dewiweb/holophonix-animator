use napi::bindgen_prelude::*;
use serde::{Deserialize, Serialize};
use rosc::{OscMessage, OscPacket, OscType};
use crate::osc::error::{OSCError, OSCErrorType};

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OSCConfig {
    #[napi]
    pub host: String,
    #[napi]
    pub port: u16,
}

impl OSCConfig {
    pub fn new(host: impl Into<String>, port: u16) -> Self {
        OSCConfig {
            host: host.into(),
            port,
        }
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OSCMessageArgType {
    Int(i32),
    Float(f64),
    String(String),
    Bool(bool),
}

impl From<&OSCMessageArgType> for OscType {
    fn from(arg: &OSCMessageArgType) -> Self {
        match arg {
            OSCMessageArgType::Int(i) => OscType::Int(*i),
            OSCMessageArgType::Float(f) => OscType::Float(*f as f32),
            OSCMessageArgType::String(s) => OscType::String(s.clone()),
            OSCMessageArgType::Bool(b) => OscType::Bool(*b),
        }
    }
}

impl From<OscType> for OSCMessageArgType {
    fn from(arg: OscType) -> Self {
        match arg {
            OscType::Int(i) => OSCMessageArgType::Int(i),
            OscType::Float(f) => OSCMessageArgType::Float(f as f64),
            OscType::String(s) => OSCMessageArgType::String(s),
            OscType::Bool(b) => OSCMessageArgType::Bool(b),
            _ => OSCMessageArgType::String("Unsupported type".to_string()),
        }
    }
}

#[napi]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OSCMessage {
    #[napi]
    pub address: String,
    #[napi]
    pub args: Vec<OSCMessageArgType>,
}

#[napi]
impl OSCMessage {
    #[napi]
    pub fn new(address: String) -> Result<Self> {
        if !address.starts_with('/') {
            return Err(Error::from_reason("OSC address must start with '/'"));
        }
        Ok(OSCMessage {
            address,
            args: Vec::new(),
        })
    }

    #[napi]
    pub fn add_int(&mut self, value: i32) {
        self.args.push(OSCMessageArgType::Int(value));
    }

    #[napi]
    pub fn add_float(&mut self, value: f64) {
        self.args.push(OSCMessageArgType::Float(value));
    }

    #[napi]
    pub fn add_string(&mut self, value: String) {
        self.args.push(OSCMessageArgType::String(value));
    }

    #[napi]
    pub fn add_bool(&mut self, value: bool) {
        self.args.push(OSCMessageArgType::Bool(value));
    }

    pub fn to_osc_packet(&self) -> OscPacket {
        OscPacket::Message(OscMessage {
            addr: self.address.clone(),
            args: self.args.iter().map(|arg| OscType::from(arg)).collect(),
        })
    }

    pub fn from_osc_packet(packet: OscPacket) -> Result<Self> {
        match packet {
            OscPacket::Message(msg) => {
                Ok(OSCMessage {
                    address: msg.addr,
                    args: msg.args.into_iter().map(OSCMessageArgType::from).collect(),
                })
            }
            _ => Err(Error::from_reason("Not an OSC message")),
        }
    }

    #[napi]
    pub fn to_bytes(&self) -> Result<Vec<u8>> {
        let packet = self.to_osc_packet();
        rosc::encoder::encode(&packet)
            .map_err(|e| Error::from_reason(format!("Failed to encode message: {}", e)))
    }

    #[napi]
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        match rosc::decoder::decode_udp(bytes) {
            Ok((_, OscPacket::Message(msg))) => {
                Ok(OSCMessage {
                    address: msg.addr,
                    args: msg.args.into_iter().map(OSCMessageArgType::from).collect(),
                })
            }
            Ok(_) => Err(Error::from_reason("Not an OSC message")),
            Err(e) => Err(Error::from_reason(e.to_string())),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_creation() {
        let result = OSCMessage::new("/test".to_string());
        assert!(result.is_ok());
        
        let result = OSCMessage::new("invalid".to_string());
        assert!(result.is_err());
    }

    #[test]
    fn test_message_args() {
        let mut msg = OSCMessage::new("/test".to_string()).unwrap();
        msg.add_int(42);
        msg.add_float(3.14);
        msg.add_string("hello".to_string());
        msg.add_bool(true);

        assert_eq!(msg.args.len(), 4);
        match &msg.args[0] {
            OSCMessageArgType::Int(i) => assert_eq!(*i, 42),
            _ => panic!("Expected Int"),
        }
    }

    #[test]
    fn test_message_conversion() {
        let mut msg = OSCMessage::new("/test".to_string()).unwrap();
        msg.add_int(42);
        
        let bytes = msg.to_bytes().unwrap();
        let decoded = OSCMessage::from_bytes(&bytes).unwrap();
        
        assert_eq!(decoded.address, "/test");
        match &decoded.args[0] {
            OSCMessageArgType::Int(i) => assert_eq!(*i, 42),
            _ => panic!("Expected Int"),
        }
    }
}
