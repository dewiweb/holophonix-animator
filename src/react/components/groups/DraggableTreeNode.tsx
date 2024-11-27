import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { TreeNode } from '@blueprintjs/core';
import { GroupTreeItem } from './GroupTreeView';

interface DraggableTreeNodeProps {
  node: GroupTreeItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMove: (draggedId: string, targetId: string) => void;
  onExpand: () => void;
  onCollapse: () => void;
}

interface DragItem {
  type: string;
  id: string;
  parentId: string | null;
}

export const DraggableTreeNode: React.FC<DraggableTreeNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onMove,
  onExpand,
  onCollapse,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'GROUP',
    item: { 
      type: 'GROUP',
      id: node.id,
      parentId: node.parent_id 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'GROUP',
    canDrop: (item: DragItem) => {
      // Prevent dropping on itself or its children
      if (item.id === node.id) return false;
      
      // Check if target is a child of dragged item
      let current = node;
      while (current.parent_id) {
        if (current.parent_id === item.id) return false;
        // You'd need to implement a way to get parent node
        // current = getParentNode(current.parent_id);
      }
      
      return true;
    },
    drop: (item: DragItem) => {
      onMove(item.id, node.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  const backgroundColor = isOver && canDrop 
    ? 'var(--drop-target-background)' 
    : undefined;

  return (
    <div ref={drag}>
      <div ref={drop} style={{ opacity, backgroundColor }}>
        <TreeNode
          id={node.id}
          hasCaret={node.children.length > 0}
          icon={node.active ? "folder-open" : "folder-close"}
          isExpanded={node.isExpanded}
          isSelected={isSelected}
          label={
            <div className="group-node-label">
              <span>{node.name}</span>
              {!node.active && <span className="inactive-badge">Inactive</span>}
            </div>
          }
          onClick={() => onSelect(node.id)}
          onExpand={onExpand}
          onCollapse={onCollapse}
        >
          {node.children.map(child => (
            <DraggableTreeNode
              key={child.id}
              node={child}
              isSelected={isSelected}
              onSelect={onSelect}
              onMove={onMove}
              onExpand={onExpand}
              onCollapse={onCollapse}
            />
          ))}
        </TreeNode>
      </div>
    </div>
  );
};
