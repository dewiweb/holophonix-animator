# 🔍 Barycentric Variant Analysis - Redundancy Check

**Date:** November 10, 2025 - 8:18am UTC+01:00

---

## 📊 Current 4 Variants - Detailed Breakdown

| Variant | Center Source | Offsets Preserved | User Editable |
|---------|--------------|-------------------|---------------|
| **Shared** | Custom | ❌ No (always zero) | Center only |
| **Isobarycentric** | Auto-calculated | ✅ Yes (always) | Nothing |
| **Centered** | Custom | ✅ Yes (always) | Center only |
| **Custom** | Custom | ⚙️ User choice | Center + toggle |

---

## 🎯 Redundancy Analysis

### **Discovery: Overlapping Variants!**

#### **Redundancy 1: Centered = Custom (locked)**
```
Centered:
  - Custom center ✅
  - PreserveOffsets = true (locked) 🔒

Custom:
  - Custom center ✅
  - PreserveOffsets = user choice ⚙️

→ Centered is just Custom with preserveOffsets=true!
```

#### **Redundancy 2: Shared = Custom (different lock)**
```
Shared:
  - Custom center ✅
  - PreserveOffsets = false (locked) 🔒

Custom:
  - Custom center ✅
  - PreserveOffsets = user choice ⚙️

→ Shared is just Custom with preserveOffsets=false!
```

---

## 💡 Simplified Architecture Proposal

### **Option A: 2 Variants + 1 Toggle**

```
Variants (dropdown):
├─ Isobarycentric (auto-center, always preserve offsets)
└─ Custom (user-center)
   └─ Toggle: "Preserve offsets" ☑

This covers all 4 original cases:
- Isobarycentric → Isobarycentric variant
- Shared → Custom + preserveOffsets=OFF
- Centered → Custom + preserveOffsets=ON
- Custom → Custom + preserveOffsets=(user choice)
```

**Benefits:**
✅ Only 2 variants instead of 4
✅ Clear separation: auto vs manual center
✅ One toggle handles offset behavior
✅ Simpler mental model

**Drawbacks:**
⚠️ Less explicit presets
⚠️ Users must understand the toggle

---

### **Option B: 2 Toggles (No Variants)**

```
Toggles:
☑ Auto-calculate center (vs custom center)
☑ Preserve track offsets

4 Combinations:
- Auto + Preserve = Isobarycentric
- Auto + No Preserve = (not useful - auto-center with identical motion)
- Custom + Preserve = Centered
- Custom + No Preserve = Shared
```

**Benefits:**
✅ Maximum flexibility
✅ No variant dropdown
✅ Direct control

**Drawbacks:**
⚠️ One combination doesn't make sense (auto-center + no offsets)
⚠️ Less guided

---

### **Option C: Keep Current (Named Presets)**

```
Keep 4 variants as helpful presets:
- Shared (common use case: synchronized motion)
- Isobarycentric (common: rigid formation)
- Centered (common: formation around point)
- Custom (power users)
```

**Benefits:**
✅ Clear named use cases
✅ Beginner-friendly presets
✅ Advanced users have "Custom"

**Drawbacks:**
⚠️ Some redundancy in implementation
⚠️ More UI elements

---

## 🎨 Recommendation

### **Recommended: Hybrid Approach (Option A+)**

```typescript
Variants:
├─ Shared (preset: custom center, zero offsets)
├─ Isobarycentric (preset: auto center, preserve offsets)
├─ Centered (preset: custom center, preserve offsets)
└─ Advanced
   ├─ Center: [Auto-calculate ◉] [Custom ○]
   └─ ☑ Preserve track offsets
```

**How it works:**
1. **Beginner/Common use:** Pick preset (Shared/Iso/Centered)
2. **Advanced use:** Pick "Advanced" → full control with toggles

**Benefits:**
✅ Best of both worlds
✅ Presets for common cases
✅ Full control for advanced
✅ Progressive disclosure
✅ No redundancy in UI (only in presets)

---

## 📋 Implementation Comparison

### Current Implementation:
```typescript
type BarycentricVariant = 'shared' | 'isobarycentric' | 'centered' | 'custom'

// 4 separate UI buttons
// 3 of them are really presets
```

### Simplified Implementation:
```typescript
type BarycentricVariant = 'isobarycentric' | 'custom'

// Just 2 variants
// Custom has preserve offsets toggle
// Shared & Centered removed (use custom instead)
```

### Hybrid Implementation:
```typescript
type BarycentricVariant = 'shared' | 'isobarycentric' | 'centered' | 'advanced'

// 4 buttons, but "advanced" reveals toggles
// Shared/Iso/Centered are helpful presets
// Advanced gives full control
```

---

## 🧪 User Impact Analysis

### **Current Users Expect:**
- "Shared" - familiar term (all identical)
- "Isobarycentric" - technical term (formation)
- "Centered" - self-explanatory (pivot point)
- "Custom" - advanced control

### **If We Simplify to 2:**
- ✅ Cleaner architecture
- ❌ Users lose familiar presets
- ⚠️ Must explain toggle meaning

### **If We Keep Hybrid:**
- ✅ Familiar presets remain
- ✅ Advanced option for power users
- ✅ No learning curve change
- ✅ Implementation is still clean (map presets to settings)

---

## ✅ Final Recommendation

**Keep 3 presets + 1 advanced:**

```
[Shared] [Isobarycentric] [Centered] [Advanced]

When "Advanced" selected:
  Center Source: (•) Auto-calculate  ( ) Custom
  ☑ Preserve track offsets from center
  
  Custom Center Position:
  X: [___] Y: [___] Z: [___]
```

**Rationale:**
1. Common use cases get named buttons (UX win)
2. Reduces 4 variants to 3 + 1 advanced
3. Advanced reveals the underlying toggles
4. Clear migration path if we simplify further later
5. Best user experience for all skill levels

---

## 🔧 Code Impact

### Minimal Changes Needed:
```typescript
// Rename 'custom' to 'advanced'
type BarycentricVariant = 'shared' | 'isobarycentric' | 'centered' | 'advanced'

// When variant === 'advanced', show both toggles:
// - centerSource: 'auto' | 'custom'
// - preserveOffsets: boolean

// For presets, derive settings:
const settings = {
  shared: { centerSource: 'custom', preserveOffsets: false },
  isobarycentric: { centerSource: 'auto', preserveOffsets: true },
  centered: { centerSource: 'custom', preserveOffsets: true },
  advanced: { /* user controls both */ }
}
```

---

## 🎯 Summary

**Yes, variants have redundancy:**
- Shared = Custom with preserveOffsets=false
- Centered = Custom with preserveOffsets=true
- Only Isobarycentric is unique (auto-center)

**Recommendation:**
- Rename "Custom" → "Advanced"
- Advanced shows center source toggle + preserve toggle
- Keep Shared/Iso/Centered as convenient presets
- This gives best UX while acknowledging the architecture

**Alternative (simpler):**
- Just 2 variants: Isobarycentric + Custom
- Custom has preserve offsets toggle
- Remove Shared and Centered (users use Custom instead)
