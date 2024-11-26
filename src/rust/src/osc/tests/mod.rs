// OSC protocol and server tests
pub mod protocol;
pub mod server;
pub mod integration;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::osc::{OSCConfig, OSCMessage, OSCMessageArg};
}
