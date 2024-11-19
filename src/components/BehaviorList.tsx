import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  ListItemSecondaryAction,
  Paper,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { BehaviorCategory, BehaviorDefinition, getBehaviorsByCategory } from '../behaviors/registry';
import type { Track } from '../types/tracks';
import type { Behavior } from '../types/behaviors';

interface BehaviorListProps {
  selectedTrack: Track | null;
  selectedBehavior: Behavior | null;
  onSelectBehavior?: (behavior: Behavior) => void;
  onAddBehavior?: (behaviorDef: BehaviorDefinition) => void;
  onDeleteBehavior?: (behavior: Behavior) => void;
  onPreviewBehavior?: (behaviorDef: BehaviorDefinition | null) => void;
}

export function BehaviorList({
  selectedTrack,
  selectedBehavior,
  onSelectBehavior,
  onAddBehavior,
  onDeleteBehavior,
  onPreviewBehavior
}: BehaviorListProps) {
  const [selectedCategory, setSelectedCategory] = useState<BehaviorCategory>('1D');

  const handleCategoryChange = (category: BehaviorCategory) => {
    setSelectedCategory(category);
  };

  const handlePreviewBehavior = (behaviorDef: BehaviorDefinition) => {
    onPreviewBehavior?.(behaviorDef);
  };

  const handleAddBehavior = (behaviorDef: BehaviorDefinition) => {
    onAddBehavior?.(behaviorDef);
  };

  const behaviorsByCategory = getBehaviorsByCategory(selectedCategory);

  return (
    <div className="behavior-list">
      <Paper elevation={2} className="behavior-categories">
        <Typography variant="h6">Categories</Typography>
        <List>
          {(['1D', '2D', '3D', 'Group'] as BehaviorCategory[]).map((category) => (
            <ListItem
              key={category}
              selected={selectedCategory === category}
              onClick={() => handleCategoryChange(category)}
            >
              <ListItemText primary={category} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper elevation={2} className="available-behaviors">
        <Typography variant="h6">Available Behaviors</Typography>
        <List>
          {behaviorsByCategory.map((behaviorDef) => (
            <ListItem
              key={behaviorDef.type}
              onMouseEnter={() => handlePreviewBehavior(behaviorDef)}
              onMouseLeave={() => onPreviewBehavior?.(null)}
              onClick={() => handleAddBehavior(behaviorDef)}
            >
              <ListItemText primary={behaviorDef.name} secondary={behaviorDef.description} />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleAddBehavior(behaviorDef)}>
                  <AddIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      {selectedTrack && (
        <Paper elevation={2} className="active-behaviors">
          <Typography variant="h6">Active Behaviors</Typography>
          <List>
            {selectedTrack.behaviors.map((behavior) => (
              <ListItem
                key={behavior.id}
                selected={selectedBehavior?.id === behavior.id}
                onClick={() => onSelectBehavior?.(behavior)}
              >
                <ListItemText primary={behavior.name} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => onDeleteBehavior?.(behavior)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
}
