# Three.js Control Point Editor Migration Plan

## Executive Summary

**Objective**: Migrate from dual 2D canvas-based control point editors to a unified Three.js-based editing system.

**Benefits**: 
- ~40% code reduction in animation editor
- Single source of truth (one scene for edit + preview)
- Better visual consistency
- Industry-standard editing tools (gizmos, like Blender/Maya)

**Timeline**: 4-6 weeks (80-120 hours)

**Risk**: Medium - Significant but isolated refactor

---

## Current vs Target Architecture

### Before (Dual System)
```
2D Canvas Editors (PlaneEditor.tsx ~1700 lines)
    ↓
Pixel coords → Animation coords conversion
    ↓
Separate 3D Preview (Three.js)
```

**Problems**: Duplication, maintenance burden, visual inconsistency

### After (Unified System)
```
Single Three.js Scene (~1600 lines cleaner)
    ↓
Direct 3D editing with gizmos
    ↓
Multiple camera views (top/side/front/perspective)
```

**Benefits**: One system, no conversion, perfect consistency

---

## Phase 1: Foundation (Week 1-2, 20-30 hours)

### Goal: Working Prototype

#### Tasks:
1. **Scene Manager** (6-8h) - `useControlPointScene.ts`
   - Initialize Three.js scene with grid/axes
   - Render control points as spheres
   - Draw curve between points

2. **Multi-View Cameras** (6-8h) - `useMultiViewCameras.ts`
   - 4 cameras: top/front/side orthographic + perspective
   - 2x2 grid viewport layout
   - Per-view controls

3. **Point Selection** (8-10h) - `useControlPointSelection.ts`
   - Raycasting for click detection
   - Visual feedback for selected point
   - Works in all viewports

4. **Transform Gizmos** (6-8h) - `useTransformControls.ts`
   - Three.js TransformControls integration
   - Translate/rotate modes
   - Updates animation on drag

### Deliverables:
- ✅ Functional prototype component
- ✅ 50+ control points at 60fps
- ✅ Demo video for review

---

## Phase 2: Feature Parity (Week 3-4, 30-40 hours)

### Goal: Match all PlaneEditor features

#### Tasks:
1. **CRUD Operations** (10-12h)
   - Add control point (Shift+Click, toolbar)
   - Delete (Select + Delete key)
   - Duplicate (Ctrl+D)
   - Numerical position input
   - Undo/redo integration

2. **Curve Visualization** (8-10h)
   - THREE.CatmullRomCurve3 rendering
   - Color gradient by time/velocity
   - Direction indicators
   - Performance: 100+ point curve at 60fps

3. **Viewport Controls** (10-12h)
   - Toolbar: Translate/Rotate/Frame buttons
   - Keyboard shortcuts (G=translate, R=rotate, F=frame)
   - Grid snapping (configurable)
   - Frame selected/all functionality

4. **Context Menu** (6-8h)
   - Right-click actions
   - Add/Delete/Duplicate
   - Align to axis
   - Insert between points

### Deliverables:
- ✅ Complete feature set
- ✅ Test suite
- ✅ User docs

---

## Phase 3: Integration (Week 5, 20-30 hours)

### Goal: Production-ready integration

#### Tasks:
1. **Data Migration** (8-10h)
   ```typescript
   // Migrate old 2D format to 3D
   migrateAnimationTo3D(oldAnimation: AnimationV2): AnimationV3
   
   // Backward compat if needed
   exportAs2D(animation3D: AnimationV3): AnimationV2
   ```
   - Auto-migrate on app load
   - Create backup before migration
   - No data loss

2. **Feature Flags** (4-6h)
   ```typescript
   FEATURE_FLAGS = {
     USE_THREEJS_EDITOR: true,
     SHOW_OLD_EDITOR_FALLBACK: true,
     ENABLE_PARALLEL_MODE: true // Side-by-side comparison
   }
   ```
   - Toggle between old/new
   - Easy rollback
   - Analytics tracking

3. **Integration Tests** (8-10h)
   - Load existing animations
   - Edit sync to store
   - Save/load persistence
   - Backward compatibility

### Deliverables:
- ✅ Full integration complete
- ✅ Migration tested
- ✅ Both editors work together
- ✅ All tests pass

---

## Phase 4: Cleanup (Week 6, 10-15 hours)

### Goal: Production polish

#### Tasks:
1. **Remove Old Code** (6-8h)
   - Delete PlaneEditor.tsx (~1700 lines)
   - Update imports
   - Bundle size: -15-20%

2. **Performance** (6-8h)
   - Instanced rendering for many points
   - LOD for distant points
   - Throttle curve updates
   - Web Worker for heavy calc
   - Target: 200+ points at 60fps

3. **Documentation** (2-3h)
   - User guide
   - Migration notes
   - API docs

---

## Technical Details

### Key Components

```
src/components/animation-editor/components/threejs-editor/
├── ThreeJsControlPointEditor.tsx      [Main component]
├── MultiViewRenderer.tsx              [4-viewport manager]
├── ControlPointManager.tsx            [Point CRUD logic]
├── TransformGizmoController.tsx       [Gizmo wrapper]
└── hooks/
    ├── useControlPointScene.ts        [Scene setup]
    ├── useMultiViewCameras.ts         [Camera management]
    ├── useControlPointSelection.ts    [Selection + raycasting]
    └── useTransformControls.ts        [TransformControls wrapper]
```

### Data Format Change

**V2 (Old - 2D per plane)**:
```typescript
{
  topPlanePoints: [{x, z}],
  frontPlanePoints: [{x, y}],
  sidePlanePoints: [{y, z}]
}
```

**V3 (New - Unified 3D)**:
```typescript
{
  version: 3,
  controlPoints: [THREE.Vector3(x, y, z)]
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Control Points | 200+ at 60fps |
| Curve Resolution | 500 segments |
| Viewport Render | <16ms (4 views) |
| Memory Usage | <100MB |
| Bundle Size Reduction | -15-20% |

---

## Migration Checklist

### Pre-Migration
- [ ] Backup all project files
- [ ] Test existing animations work
- [ ] Document current behavior
- [ ] Set up feature flag

### During Migration
- [ ] Phase 1: Prototype approved
- [ ] Phase 2: Feature parity verified
- [ ] Phase 3: Integration tests pass
- [ ] Phase 4: Performance benchmarks met

### Post-Migration
- [ ] User testing (beta users)
- [ ] Monitor for bugs
- [ ] Collect feedback
- [ ] Remove old code (after 2 weeks stability)

---

## Risk Mitigation

### Risk: Data Loss During Migration
**Mitigation**: 
- Auto-backup before migration
- Migration is reversible
- Keep old format export capability

### Risk: Performance Regression
**Mitigation**:
- Benchmark early in Phase 1
- Optimize in Phase 4
- Fallback to old editor if needed

### Risk: User Learning Curve
**Mitigation**:
- Tooltips for all tools
- Video tutorials
- Gradual rollout with toggle
- In-app help

### Risk: Breaking Changes
**Mitigation**:
- Feature flags for safe rollout
- Parallel mode for testing
- Versioned data format
- Backward compatibility layer

---

## Success Criteria

✅ **Functional**
- All PlaneEditor features replicated
- No data loss
- Backward compatible

✅ **Performance**
- 200+ control points at 60fps
- <16ms render time
- Smooth interactions

✅ **Quality**
- 90%+ test coverage
- No critical bugs
- Positive user feedback

✅ **Code**
- 40% code reduction
- Better maintainability
- Clear documentation

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|----------------|
| 1. Foundation | 2 weeks | Working prototype |
| 2. Feature Parity | 2 weeks | Complete feature set |
| 3. Integration | 1 week | Production ready |
| 4. Cleanup | 1 week | Polished & optimized |
| **Total** | **6 weeks** | **Ready for prod** |

---

## Next Steps

1. **Review this plan** with team
2. **Approve timeline** and resources
3. **Start Phase 1** - Create prototype
4. **Demo at end of Week 2** for feedback
5. **Iterate based on feedback**
6. **Full rollout by Week 6**

---

## Questions for Stakeholders

1. Is 6-week timeline acceptable?
2. Can we use feature flag for gradual rollout?
3. How long to keep old editor as fallback?
4. Should we do beta testing with subset of users?
5. Any specific UX requirements not covered?

---

**Document Version**: 1.0  
**Date**: 2025-01-08  
**Author**: Development Team  
**Status**: Draft - Awaiting Approval
