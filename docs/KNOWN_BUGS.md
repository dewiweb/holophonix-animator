# Known Bugs & Issues

**Last Updated**: 2024-11-05  
**Status**: Active tracking

---

## 🔥 **Critical Bugs** (Block Production Use)

### **BUG-001: Animation Orchestrator Integration Issues**
**Status**: 🟡 Monitoring  
**Priority**: High  
**Discovered**: 2024-11-05

**Description**:
After integrating the Animation Orchestrator, some edge cases may not be handled correctly.

**Symptoms**:
- Concurrent animations may conflict
- Track position sync issues possible
- Stop/pause behavior may be inconsistent

**Steps to Reproduce**:
1. Trigger multiple cues simultaneously
2. Stop one animation while others play
3. Observe track positions

**Expected**: Smooth coordination, no conflicts  
**Actual**: Unknown - needs testing

**Workaround**: None yet  
**Fix Priority**: High - test thoroughly first

---

### **BUG-002: Easing Animation Edge Cases**
**Status**: 🟡 Recently Fixed, Needs Testing  
**Priority**: Medium

**Description**:
Return-to-initial and go-to-start easing animations were just fixed. Edge cases may still exist.

**Potential Issues**:
- Multiple simultaneous easings may conflict
- Easing may be interrupted by new playback
- OSC messages during easing may be incorrect

**Steps to Reproduce**:
1. Stop animation (triggers ease)
2. Immediately start new animation
3. Observe track behavior

**Expected**: Clean transition  
**Actual**: Unknown

**Workaround**: Wait for easing to complete  
**Fix**: Add easing state tracking and cancellation

---

### **BUG-003: Missing Model Implementation Files**
**Status**: 🔴 Confirmed  
**Priority**: Medium

**Description**:
Model system has type definitions but missing implementation files causing lint errors.

**Error Messages**:
```
Cannot find module './validation'
Cannot find module './circular'
Cannot find module './linear'
Cannot find module './pendulum'
Cannot find module './spring'
Cannot find module './wave'
```

**Files Affected**:
- `src/models/registry.ts`
- `src/models/builtin/index.ts`

**Impact**: Model system non-functional  
**Workaround**: Don't use model system yet  
**Fix**: Complete model implementation files (Phase 3)

---

## ⚠️ **Major Bugs** (Impact Workflow)

### **BUG-004: Bundle Size Too Large**
**Status**: 🟡 Known Issue  
**Priority**: Medium

**Description**:
Bundle size is 1,144 KB (minified), which is quite large.

**Impact**:
- Slow initial load
- Memory usage
- Performance on lower-end machines

**Root Cause**:
- No code splitting
- All components loaded upfront
- Large dependencies

**Fix Strategy**:
- Implement lazy loading
- Code split by route
- Optimize dependencies
- Use dynamic imports

**Target**: <500 KB main bundle

---

### **BUG-005: Multi-Animation Playback Untested**
**Status**: 🟡 Needs Testing  
**Priority**: High

**Description**:
Multiple simultaneous animations may have issues.

**Test Cases Needed**:
- [ ] 5 animations on different tracks
- [ ] 2 animations on same track (conflict resolution)
- [ ] Stop one of many playing animations
- [ ] Pause/resume with multiple animations
- [ ] Priority conflict resolution

**Expected**: All scenarios work correctly  
**Actual**: Unknown

---

### **BUG-006: Timeline Integration Incomplete**
**Status**: 🔴 Confirmed  
**Priority**: High (for timeline feature)

**Description**:
Timeline types exist but no UI or integration.

**Missing**:
- Timeline component
- Clip playback
- Timeline-to-cue export
- Automation lanes

**Impact**: Timeline feature non-functional  
**Fix**: Implement timeline (Priority 2)

---

## 🐛 **Minor Bugs** (Annoyances)

### **BUG-007: Control Point Editor Sync Issues**
**Status**: 🟡 Intermittent  
**Priority**: Low

**Description**:
Control points in 3D editor may not sync correctly with parameter changes.

**Symptoms**:
- Moving control point doesn't update parameters
- Changing parameters doesn't move control point
- Visual glitches

**Affected Animation Types**:
- Bezier
- Catmull-Rom
- Custom paths

**Workaround**: Refresh by switching animation type  
**Fix**: Review control point update handlers

---

### **BUG-008: 3D Preview Performance**
**Status**: 🟡 Known  
**Priority**: Low

**Description**:
3D preview may lag with many tracks or complex animations.

**Symptoms**:
- Frame drops
- Stuttering
- High CPU usage

**Threshold**: 20+ tracks with active animations

**Workaround**: Hide preview during editing  
**Fix**: Optimize Three.js rendering, add LOD

---

### **BUG-009: Settings Organization**
**Status**: 🟡 UX Issue  
**Priority**: Low

**Description**:
Settings are scattered and hard to find.

**Issues**:
- No search
- Flat structure
- Inconsistent naming
- Missing tooltips

**Impact**: User confusion  
**Fix**: Redesign settings UI with categories and search

---

## 🔄 **Feature Regressions**

### **REG-001: Animation Types May Not Work with Orchestrator**
**Status**: 🟡 Needs Testing  
**Priority**: High

**Description**:
Not all 24 animation types have been tested with the new orchestrator.

**Test Plan**:
1. Test each animation type individually
2. Test with cue system
3. Test with multiple tracks
4. Test stop/pause/resume

**Animation Types to Test**:
- [ ] Linear
- [ ] Circular
- [ ] Elliptical
- [ ] Spiral
- [ ] Pendulum
- [ ] Bounce
- [ ] Spring
- [ ] Wave
- [ ] Lissajous
- [ ] Helix
- [ ] Bezier
- [ ] Catmull-Rom
- [ ] Zigzag
- [ ] Perlin Noise
- [ ] Rose Curve
- [ ] Epicycloid
- [ ] Orbit
- [ ] Formation
- [ ] Attract/Repel
- [ ] Doppler
- [ ] Circular Scan
- [ ] Zoom
- [ ] Random
- [ ] Custom

---

### **REG-002: OSC Message Optimization Untested**
**Status**: 🟡 Needs Validation  
**Priority**: Medium

**Description**:
OSC optimization was implemented but not tested with real Holophonix hardware.

**Concerns**:
- Message format may be incorrect
- Batching may not work
- Coordinate conversion issues

**Test Plan**:
- [ ] Test with real Holophonix device
- [ ] Validate message format
- [ ] Test batching performance
- [ ] Test coordinate conversions (XYZ ↔ AED)

---

### **REG-003: Track Selection Workflow Issues**
**Status**: 🟡 UX Regression  
**Priority**: Low

**Description**:
Track selection has some quirks after multi-track improvements.

**Issues**:
- Ctrl+Click order not always preserved
- Drag-and-drop reordering could be smoother
- Visual feedback could be clearer

**Impact**: Minor UX annoyance  
**Fix**: Polish track selection UI

---

## 📋 **Testing Gaps**

### **GAP-001: No Automated Tests**
**Status**: 🔴 Critical Gap  
**Priority**: High

**Missing**:
- Unit tests for core functions
- Integration tests for workflows
- E2E tests for user journeys
- Performance benchmarks

**Impact**: Hard to catch regressions  
**Fix**: Set up testing framework (Jest + Playwright)

---

### **GAP-002: No Performance Benchmarks**
**Status**: 🟡 Missing  
**Priority**: Medium

**Needed**:
- Animation calculation benchmarks
- OSC message throughput tests
- Memory leak detection
- FPS monitoring with many animations

**Fix**: Implement performance test suite

---

### **GAP-003: No Load Testing**
**Status**: 🟡 Missing  
**Priority**: Medium

**Scenarios**:
- 100+ tracks
- 50+ concurrent animations
- 1000+ OSC messages/second
- Long-running sessions (hours)

**Fix**: Create load testing scenarios

---

## 🔧 **Technical Debt**

### **DEBT-001: Too Many `any` Types**
**Status**: 🟡 Code Quality  
**Priority**: Low

**Impact**: Reduced type safety  
**Fix**: Gradually replace with proper types

---

### **DEBT-002: Missing Error Handling**
**Status**: 🟡 Reliability  
**Priority**: Medium

**Impact**: Crashes on edge cases  
**Fix**: Add try-catch blocks and error boundaries

---

### **DEBT-003: Inconsistent Naming**
**Status**: 🟡 Maintainability  
**Priority**: Low

**Impact**: Confusion  
**Fix**: Standardize naming conventions

---

## 📊 **Bug Statistics**

**Total Bugs**: 15  
**Critical**: 3  
**Major**: 3  
**Minor**: 3  
**Regressions**: 3  
**Gaps**: 3

**Status Breakdown**:
- 🔴 Confirmed: 3
- 🟡 Needs Testing: 9
- 🟢 Fixed: 3

---

## 🎯 **Bug Fixing Priority**

### **Sprint 1: Critical Stabilization** (2-3 days)
1. BUG-005: Test multi-animation playback
2. BUG-002: Test easing edge cases
3. REG-001: Test all 24 animation types
4. BUG-001: Validate orchestrator integration

### **Sprint 2: Testing Infrastructure** (2-3 days)
1. GAP-001: Set up testing framework
2. GAP-002: Create performance benchmarks
3. Implement automated tests for critical paths

### **Sprint 3: Code Quality** (1-2 days)
1. DEBT-002: Add error handling
2. DEBT-001: Fix type safety issues
3. BUG-007: Fix control point sync

### **Sprint 4: Performance** (2-3 days)
1. BUG-004: Reduce bundle size
2. BUG-008: Optimize 3D preview
3. GAP-003: Load testing

---

## 📝 **Bug Report Template**

When reporting new bugs, use this format:

```markdown
### **BUG-XXX: [Short Title]**
**Status**: 🔴/🟡/🟢  
**Priority**: Critical/High/Medium/Low

**Description**:
[Detailed description]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Observe issue]

**Expected**: [What should happen]  
**Actual**: [What actually happens]

**Environment**:
- OS: [Windows/Mac/Linux]
- Browser: [Chrome/Firefox/etc.]
- Version: [App version]

**Workaround**: [If any]  
**Fix**: [Proposed solution]
```

---

**Next Review**: After stabilization sprint  
**Goal**: <5 critical bugs before new feature development
