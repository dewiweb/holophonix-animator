import React, { useEffect, useState } from 'react';
import { Tree } from '@blueprintjs/core';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { GroupData } from '../../../bindings';
import { useGroupManager } from '../../hooks/useGroupManager';
import { DraggableTreeNode } from './DraggableTreeNode';
import './GroupTreeView.css';

interface GroupTreeItem extends GroupData {
  children: GroupTreeItem[];
  isExpanded?: boolean;
}

interface GroupTreeViewProps {
  onGroupSelect?: (groupId: string) => void;
  selectedGroupId?: string;
}

export const GroupTreeView: React.FC<GroupTreeViewProps> = ({
  onGroupSelect,
  selectedGroupId,
}) => {
  const groupManager = useGroupManager();
  const [treeData, setTreeData] = useState<GroupTreeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Convert flat group data into tree structure
  const buildTreeData = async () => {
    try {
      const allGroups = await groupManager.getActiveGroups();
      
      const groupMap = new Map<string, GroupTreeItem>();
      allGroups.forEach(group => {
        groupMap.set(group.id, {
          ...group,
          children: [],
          isExpanded: true,
        });
      });

      const rootNodes: GroupTreeItem[] = [];
      allGroups.forEach(group => {
        const treeItem = groupMap.get(group.id)!;
        if (group.parent_id) {
          const parent = groupMap.get(group.parent_id);
          if (parent) {
            parent.children.push(treeItem);
          }
        } else {
          rootNodes.push(treeItem);
        }
      });

      setTreeData(rootNodes);
    } catch (error) {
      console.error('Error building group tree:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buildTreeData();
  }, []);

  const handleMove = async (draggedId: string, targetId: string) => {
    try {
      const success = await groupManager.moveGroup(draggedId, targetId);
      if (success) {
        buildTreeData(); // Refresh the tree
      }
    } catch (error) {
      console.error('Error moving group:', error);
    }
  };

  const handleExpand = (nodeId: string) => {
    const newData = [...treeData];
    const updateExpanded = (items: GroupTreeItem[]) => {
      for (const item of items) {
        if (item.id === nodeId) {
          item.isExpanded = true;
          break;
        }
        if (item.children) {
          updateExpanded(item.children);
        }
      }
    };
    updateExpanded(newData);
    setTreeData(newData);
  };

  const handleCollapse = (nodeId: string) => {
    const newData = [...treeData];
    const updateCollapsed = (items: GroupTreeItem[]) => {
      for (const item of items) {
        if (item.id === nodeId) {
          item.isExpanded = false;
          break;
        }
        if (item.children) {
          updateCollapsed(item.children);
        }
      }
    };
    updateCollapsed(newData);
    setTreeData(newData);
  };

  if (loading) {
    return <div className="group-tree-loading">Loading groups...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="group-tree-view">
        <Tree>
          {treeData.map(node => (
            <DraggableTreeNode
              key={node.id}
              node={node}
              isSelected={selectedGroupId === node.id}
              onSelect={(id) => onGroupSelect?.(id)}
              onMove={handleMove}
              onExpand={() => handleExpand(node.id)}
              onCollapse={() => handleCollapse(node.id)}
            />
          ))}
        </Tree>
      </div>
    </DndProvider>
  );
};
