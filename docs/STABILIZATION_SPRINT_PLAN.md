# Stabilization Sprint Plan

**Duration**: 5-7 days  
**Goal**: Stable foundation + Legacy-to-Model Migration  
**Start Date**: 2024-11-05

---

## 🎯 **Objectives**

### **Primary Goals**
1. ✅ Fix all critical bugs
2. ✅ Migrate 24 legacy animations to model system
3. ✅ Test multi-animation playback thoroughly
4. ✅ Validate core workflows
5. ✅ Performance optimization

### **Why Model Migration Now?**
- ✅ Simplifies future development
- ✅ Single source of truth for animations
- ✅ Enables user-created models to work seamlessly
- ✅ Cleaner codebase
- ✅ Better maintainability

---

## 📋 **Day-by-Day Plan**

### **Day 1: Model System Foundation** 🏗️

**Morning: Create Missing Model Files**
- [ ] Create `src/models/validation.ts` (validation system)
- [ ] Create `src/models/builtin/linear.ts`
- [ ] Create `src/models/builtin/circular.ts`
- [ ] Create `src/models/builtin/pendulum.ts`
- [ ] Create `src/models/builtin/spring.ts`
- [ ] Create `src/models/builtin/wave.ts`
- [ ] Fix imports in `src/models/registry.ts` and `builtin/index.ts`

**Afternoon: Implement Basic Models**
- [ ] Linear model (start, end positions)
- [ ] Circular model (center, radius, angles)
- [ ] Validation system tests
- [ ] Registry loading tests

**Success Criteria**:
- ✅ No TypeScript errors in models/
- ✅ 5 basic models load correctly
- ✅ Validation system works

---

### **Day 2: Complete All 24 Built-in Models** 🎨

**Morning: Implement 12 Models**
- [ ] Elliptical (3 radii)
- [ ] Spiral (expanding/contracting)
- [ ] Bounce (physics-based)
- [ ] Lissajous (parametric curves)
- [ ] Helix (3D spiral)
- [ ] Bezier (cubic curves)
- [ ] Catmull-Rom (smooth splines)
- [ ] Zigzag (back-and-forth)
- [ ] Perlin Noise (procedural)
- [ ] Rose Curve (polar equation)
- [ ] Epicycloid (rolling circle)
- [ ] Random (bounded random walk)

**Afternoon: Implement Remaining 12**
- [ ] Orbit (around point)
- [ ] Formation (isobarycenter)
- [ ] Attract/Repel (force-based)
- [ ] Doppler (spatial audio effect)
- [ ] Circular Scan (scanning pattern)
- [ ] Zoom (towards/away)
- [ ] Custom (user-defined paths)
- [ ] Wave 2 (additional wave type if different)
- [ ] Plus any specialized models needed

**Success Criteria**:
- ✅ All 24 models implemented
- ✅ Each model has proper parameter definitions
- ✅ Each model has calculatePosition() function
- ✅ All models validate correctly

---

### **Day 3: Runtime Integration** 🔌

**Morning: Connect Models to Animation Engine**
- [ ] Update `src/runtime/animationRuntime.ts` (if exists) OR
- [ ] Update `src/stores/animationStore.ts` to use models
- [ ] Implement model lookup by animation type
- [ ] Add fallback to legacy if model not found (temporary)
- [ ] Test model-based position calculation

**Afternoon: Multi-Track Mode Support**
- [ ] Ensure models work with position-relative
- [ ] Ensure models work with isobarycenter
- [ ] Ensure models work with phase-offset
- [ ] Ensure models work with centered mode
- [ ] Test all 6 multi-track modes with models

**Success Criteria**:
- ✅ Animation engine uses models when available
- ✅ Legacy fallback works
- ✅ All multi-track modes functional
- ✅ No performance regression

---

### **Day 4: Testing & Validation** 🧪

**Morning: Test All Animation Types**
```
For each of 24 animation types:
1. Create animation in editor
2. Preview in 3D
3. Save animation
4. Trigger via cue
5. Test with multiple tracks
6. Test stop/pause/resume
7. Test easing return
```

**Test Matrix**: 24 types × 6 modes × 3 workflows = 432 test cases (sample)

**Afternoon: Automated Testing Framework**
- [ ] Set up testing framework (Vitest or Jest)
- [ ] Create model validation tests
- [ ] Create position calculation tests
- [ ] Create integration tests
- [ ] Run all tests and fix issues

**Success Criteria**:
- ✅ All 24 types work with models
- ✅ No broken animations
- ✅ Test suite passes
- ✅ Documented test results

---

### **Day 5: Legacy Code Removal** 🗑️

**Morning: Identify Legacy Code**
- [ ] Find all legacy animation calculation functions
- [ ] List files to be removed/refactored
- [ ] Create backup branch
- [ ] Document migration path

**Legacy Code Locations**:
- `src/utils/animations/*.ts` (24 calculation files)
- `src/utils/calculatePosition.ts` (main switch statement)
- Any other animation-specific utilities

**Afternoon: Remove Legacy Code**
- [ ] Delete legacy calculation functions
- [ ] Update imports throughout codebase
- [ ] Ensure all code uses model system
- [ ] Remove fallback to legacy
- [ ] Clean up unused utilities

**Success Criteria**:
- ✅ Legacy code removed
- ✅ No compilation errors
- ✅ All tests still pass
- ✅ Build succeeds

---

### **Day 6: Performance & Optimization** ⚡

**Morning: Performance Profiling**
- [ ] Profile animation calculation performance
- [ ] Compare model vs legacy (if any remain)
- [ ] Test with 20+ concurrent animations
- [ ] Test with 50+ tracks
- [ ] Identify bottlenecks

**Performance Targets**:
- 60 FPS with 20 tracks, 5 concurrent animations
- <50ms animation calculation time
- <10ms model lookup time
- Smooth playback at all times

**Afternoon: Optimization**
- [ ] Cache model instances
- [ ] Optimize position calculations
- [ ] Reduce unnecessary re-renders
- [ ] OSC message batching validation
- [ ] Memory leak check

**Success Criteria**:
- ✅ Meets performance targets
- ✅ No memory leaks
- ✅ Smooth 60 FPS playback
- ✅ Efficient OSC communication

---

### **Day 7: Bug Fixes & Polish** 🐛

**Morning: Critical Bug Fixes**
From KNOWN_BUGS.md:
- [ ] BUG-001: Orchestrator integration issues
- [ ] BUG-002: Easing edge cases
- [ ] BUG-005: Multi-animation playback
- [ ] REG-001: Test all 24 types with orchestrator

**Afternoon: Final Polish**
- [ ] Fix any remaining TypeScript errors
- [ ] Update documentation
- [ ] Create migration guide
- [ ] Test complete workflows end-to-end
- [ ] Create release notes

**Complete Workflow Tests**:
1. Create project → Add tracks → Create animation → Save
2. Load project → Edit animation → Preview → Update
3. Create cue → Trigger → Stop → Ease back
4. Multiple cues → Concurrent playback → Priority handling
5. Timeline integration (if ready)

**Success Criteria**:
- ✅ Zero critical bugs
- ✅ All workflows functional
- ✅ Documentation updated
- ✅ Ready for timeline development

---

## 📁 **Model Implementation Details**

### **Model File Structure**

Each model file should follow this pattern:

```typescript
// src/models/builtin/linear.ts

import { AnimationModel, Position, AnimationParameters } from '../types'

export const linearModel: AnimationModel = {
  id: 'linear',
  name: 'Linear',
  description: 'Linear movement from start to end position',
  version: '1.0.0',
  author: 'Holophonix Animator',
  
  category: 'basic',
  tags: ['movement', 'path', 'simple'],
  
  parameters: [
    {
      key: 'startPosition',
      name: 'Start Position',
      description: 'Starting position of the movement',
      type: 'position',
      required: true,
      defaultValue: { x: -5, y: 0, z: 0 }
    },
    {
      key: 'endPosition',
      name: 'End Position',
      description: 'Ending position of the movement',
      type: 'position',
      required: true,
      defaultValue: { x: 5, y: 0, z: 0 }
    }
  ],
  
  multiTrackModes: ['identical', 'position-relative', 'phase-offset', 'centered'],
  
  calculatePosition(time: number, duration: number, params: AnimationParameters): Position {
    const progress = Math.min(time / duration, 1)
    
    const start = params.startPosition as Position
    const end = params.endPosition as Position
    
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress,
      z: start.z + (end.z - start.z) * progress
    }
  },
  
  // Optional lifecycle hooks
  initialize(params: AnimationParameters) {
    // Called when animation starts
    return {}
  },
  
  cleanup(state: any) {
    // Called when animation ends
  }
}
```

### **All 24 Models to Implement**

**Basic Movement** (5):
1. ✅ Linear - straight line movement
2. ✅ Circular - circular motion
3. ✅ Elliptical - elliptical paths
4. ✅ Spiral - expanding/contracting spiral
5. ✅ Random - bounded random walk

**Physics-Based** (3):
6. ✅ Pendulum - swinging motion
7. ✅ Bounce - bouncing physics
8. ✅ Spring - spring oscillation

**Wave-Based** (3):
9. ✅ Wave - sine wave motion
10. ✅ Lissajous - parametric curves
11. ✅ Helix - 3D spiral

**Curves & Paths** (3):
12. ✅ Bezier - cubic bezier curves
13. ✅ Catmull-Rom - smooth splines
14. ✅ Zigzag - back-and-forth pattern

**Procedural** (3):
15. ✅ Perlin Noise - smooth noise-based
16. ✅ Rose Curve - polar rose patterns
17. ✅ Epicycloid - rolling circle curves

**Interactive** (3):
18. ✅ Orbit - orbit around point
19. ✅ Formation - isobarycenter formation
20. ✅ Attract/Repel - force-based movement

**Spatial Audio** (3):
21. ✅ Doppler - doppler effect simulation
22. ✅ Circular Scan - scanning patterns
23. ✅ Zoom - zoom in/out

**Custom** (1):
24. ✅ Custom - user-defined paths

---

## 🔄 **Migration Strategy**

### **Phase 1: Parallel System** (Days 1-3)
```
Animation Engine
    ↓
Check if model exists?
    ├─ YES → Use model system ✨
    └─ NO  → Use legacy calculation (fallback)
```

### **Phase 2: Full Migration** (Days 4-5)
```
Animation Engine
    ↓
Model System ONLY ✨
    ↓
All 24 types as models
```

### **Phase 3: Cleanup** (Day 5)
```
Delete legacy code:
    ✅ src/utils/animations/*.ts
    ✅ calculatePosition.ts switch statement
    ✅ Unused animation utilities
```

---

## 🧪 **Testing Strategy**

### **Unit Tests** (Model-Level)
```typescript
describe('Linear Model', () => {
  it('should move from start to end', () => {
    const position = linearModel.calculatePosition(0.5, 10, {
      startPosition: { x: 0, y: 0, z: 0 },
      endPosition: { x: 10, y: 0, z: 0 }
    })
    expect(position.x).toBe(5)
  })
  
  it('should validate parameters', () => {
    const result = validateModel(linearModel)
    expect(result.valid).toBe(true)
  })
})
```

### **Integration Tests** (Engine-Level)
```typescript
describe('Animation Engine with Models', () => {
  it('should play linear animation', () => {
    const engine = new AnimationEngine()
    engine.play('linear', ['track-1'], { /* params */ })
    // Assert position updates
  })
  
  it('should support multi-track modes', () => {
    // Test position-relative mode
  })
})
```

### **E2E Tests** (Workflow-Level)
```typescript
describe('Complete Animation Workflow', () => {
  it('should create, save, and play animation', () => {
    // User flow simulation
  })
})
```

---

## 📊 **Success Metrics**

### **Code Quality**
- ✅ Zero TypeScript errors
- ✅ Zero console errors
- ✅ All tests passing
- ✅ 80%+ code coverage (goal)

### **Performance**
- ✅ 60 FPS sustained
- ✅ <50ms calculation time
- ✅ No memory leaks
- ✅ Smooth concurrent playback

### **Functionality**
- ✅ All 24 types working
- ✅ All 6 multi-track modes working
- ✅ All workflows functional
- ✅ Zero critical bugs

### **Architecture**
- ✅ Single animation system (models only)
- ✅ Clean separation of concerns
- ✅ Extensible for user models
- ✅ Well-documented

---

## 🎯 **Deliverables**

### **Code**
- ✅ 24 model implementation files
- ✅ Validation system
- ✅ Runtime integration
- ✅ Test suite
- ✅ Legacy code removed

### **Documentation**
- ✅ Model system architecture doc
- ✅ Migration guide
- ✅ API documentation
- ✅ Testing guide
- ✅ Release notes

### **Testing**
- ✅ Unit tests for all models
- ✅ Integration tests for engine
- ✅ E2E workflow tests
- ✅ Performance benchmarks
- ✅ Test coverage report

---

## 🚧 **Risks & Mitigation**

### **Risk 1: Breaking Changes**
**Impact**: High  
**Mitigation**: 
- Create backup branch before deletion
- Thorough testing at each step
- Keep legacy as fallback initially

### **Risk 2: Performance Regression**
**Impact**: Medium  
**Mitigation**:
- Benchmark before/after
- Profile regularly
- Optimize hot paths

### **Risk 3: Scope Creep**
**Impact**: Medium  
**Mitigation**:
- Stick to 7-day timeline
- Focus on 24 core models only
- Defer enhancements to later

### **Risk 4: Incomplete Testing**
**Impact**: High  
**Mitigation**:
- Test matrix for all combinations
- Automated test suite
- Manual workflow validation

---

## 📅 **Daily Checklist Template**

### **Daily Standup Questions**
1. What did I complete yesterday?
2. What am I working on today?
3. Are there any blockers?
4. Am I on track with the schedule?

### **Daily End-of-Day**
- [ ] Commit all changes
- [ ] Update progress in this doc
- [ ] Document any issues found
- [ ] Plan tomorrow's work
- [ ] Celebrate progress! 🎉

---

## 🎉 **End of Sprint Goals**

### **Technical**
- ✅ Complete model system with 24 models
- ✅ Legacy code removed
- ✅ All tests passing
- ✅ Performance optimized

### **Functional**
- ✅ All animation types working
- ✅ Multi-animation playback stable
- ✅ Core workflows validated
- ✅ Zero critical bugs

### **Readiness**
- ✅ Ready for timeline development
- ✅ Ready for user model creation
- ✅ Ready for advanced features
- ✅ Confidence in stability

---

## 📝 **Notes & Learnings**

*Update this section daily with insights, challenges, and solutions*

### **Day 1 Notes**:
- 

### **Day 2 Notes**:
- 

### **Day 3 Notes**:
- 

### **Day 4 Notes**:
- 

### **Day 5 Notes**:
- 

### **Day 6 Notes**:
- 

### **Day 7 Notes**:
- 

---

**Sprint Start**: 2024-11-05  
**Sprint End**: 2024-11-12 (target)  
**Status**: 🟢 Ready to begin!

Let's build a solid foundation! 🚀
