#!/bin/bash
# Model simplification script - removes old multi-track mode conditionals

cd /home/dewi/Github/holophonix-animator/src/models/builtin

echo "🔧 Simplifying animation models..."

for file in *.ts; do
  if [ "$file" = "index.ts" ] || [ "$file" = "catmullRom_new.ts" ]; then
    continue
  fi
  
  echo "Processing $file..."
  
  # Replace the old multi-track conditional blocks with simplified logic
  # Pattern: Remove 'centered' mode check (deprecated)
  sed -i "/if (multiTrackMode === 'centered' && .*_centeredPoint)/,/}/d" "$file"
  
  # Pattern: Update 'isobarycenter' to 'formation' 
  sed -i "s/multiTrackMode === 'isobarycenter'/multiTrackMode === 'formation'/g" "$file"
  
  # Pattern: Update 'position-relative' to 'relative'
  sed -i "s/multiTrackMode === 'position-relative'/multiTrackMode === 'relative'/g" "$file"
  
  # Pattern: Update 'phase-offset-relative' to 'relative'
  sed -i "s/multiTrackMode === 'phase-offset-relative'/multiTrackMode === 'relative'/g" "$file"
  
  # Remove references to _centeredPoint (deprecated parameter)
  sed -i "/parameters._centeredPoint/d" "$file"
  sed -i "/params._centeredPoint/d" "$file"
done

echo "✅ Model simplification complete!"
echo "Models updated to use new mode names: shared, relative, formation"
