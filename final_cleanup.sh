#\!/bin/bash
cd /home/dewi/Github/holophonix-animator

echo "Final cleanup..."

# Fix AnimationEditor centerPoint references
sed -i "/centerPoint,$/d" src/components/animation-editor/AnimationEditor.tsx
sed -i "/setCenterPoint,$/d" src/components/animation-editor/AnimationEditor.tsx

# Fix saveAnimationHandler completely
F="src/components/animation-editor/handlers/saveAnimationHandler.ts"
sed -i "s/centerPoint = { x: 0, y: 0, z: 0 },//g" "$F"
sed -i "/centerPoint:/d" "$F"
sed -i "/centeredData/d" "$F"

# Fix trackPositionHandler mode checks  
sed -i "s/=== 'identical' || multiTrackMode === 'phase-offset' || multiTrackMode === 'shared'/=== 'shared'/g" src/components/animation-editor/handlers/trackPositionHandler.ts

echo "✅ Cleanup complete - try build now"
