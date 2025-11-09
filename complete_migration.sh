#!/bin/bash
# Complete migration script - fixes AnimationEditor.tsx

cd /home/dewi/Github/holophonix-animator
F="src/components/animation-editor/AnimationEditor.tsx"

echo "Starting complete AnimationEditor migration..."

# 1. Remove old imports
sed -i "/import.*AnimationPreview3D/d" "$F"
sed -i "/import.*ControlPointEditor/d" "$F"

# 2. Fix all mode string comparisons
sed -i "s/multiTrackMode === 'position-relative' || multiTrackMode === 'phase-offset-relative'/multiTrackMode === 'relative'/g" "$F"
sed -i "s/'position-relative'/'relative'/g" "$F"
sed -i "s/'phase-offset-relative'/'relative'/g" "$F"
sed -i "s/'isobarycenter'/'formation'/g" "$F"
sed -i "s/'centered'/'shared'/g" "$F"
sed -i "s/multiTrackMode.includes('phase-offset')/phaseOffsetSeconds > 0/g" "$F"

# 3. Remove centerPoint references
sed -i "s/, centerPoint,/,/g" "$F"
sed -i "s/, setCenterPoint,/,/g" "$F"  
sed -i "/centerPoint:/d" "$F"
sed -i "/setCenterPoint(/d" "$F"

# 4. Remove old render functions (lines ~720-784)
# Find and delete previewPane function
sed -i '/const previewPane = (/,/)$/d' "$F"
# Find and delete controlPaneContent function  
sed -i '/const controlPaneContent = supportsControlPoints \? (/,/)$/d' "$F"

# 5. Fix references to removed panes
sed -i "s/USE_UNIFIED_EDITOR ? unifiedPane : (activeWorkPane === 'preview' ? previewPane : controlPaneContent)/unifiedPane/g" "$F"
sed -i "s/{previewPane}/{unifiedPane}/g" "$F"
sed -i "s/{controlPaneContent}/{unifiedPane}/g" "$F"

echo "✅ Migration complete!"
echo "Run 'npm run build' to test"
