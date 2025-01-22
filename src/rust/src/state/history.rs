use std::collections::VecDeque;
use crate::state::Track;

const MAX_HISTORY_SIZE: usize = 100;

#[derive(Clone)]
pub enum HistoryAction {
    AddTrack(Track),
    RemoveTrack(Track),
    ModifyTrack {
        before: Track,
        after: Track,
    },
}

pub struct History {
    undo_stack: VecDeque<HistoryAction>,
    redo_stack: VecDeque<HistoryAction>,
}

impl History {
    pub fn new() -> Self {
        History {
            undo_stack: VecDeque::with_capacity(MAX_HISTORY_SIZE),
            redo_stack: VecDeque::new(),
        }
    }

    pub fn record_add(&mut self, track: Track) {
        self.push_action(HistoryAction::AddTrack(track));
    }

    pub fn record_remove(&mut self, track: Track) {
        self.push_action(HistoryAction::RemoveTrack(track));
    }

    pub fn record_modify(&mut self, before: Track, after: Track) {
        self.push_action(HistoryAction::ModifyTrack { before, after });
    }

    fn push_action(&mut self, action: HistoryAction) {
        if self.undo_stack.len() >= MAX_HISTORY_SIZE {
            self.undo_stack.pop_front();
        }
        self.undo_stack.push_back(action);
        self.redo_stack.clear();
    }

    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }

    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }

    pub fn undo(&mut self) -> Option<HistoryAction> {
        if let Some(action) = self.undo_stack.pop_back() {
            self.redo_stack.push_back(action.clone());
            Some(action)
        } else {
            None
        }
    }

    pub fn redo(&mut self) -> Option<HistoryAction> {
        if let Some(action) = self.redo_stack.pop_back() {
            self.undo_stack.push_back(action.clone());
            Some(action)
        } else {
            None
        }
    }

    pub fn clear(&mut self) {
        self.undo_stack.clear();
        self.redo_stack.clear();
    }
}
