---
name: motion-react
description: Use this skill when the user asks to implement animations using Motion, Framer Motion, or explicitly requests smooth React UI animations with gestures or layout changes.
---

# Motion for React Skill (formerly Framer Motion)

## Goal
To write clean, performant, and modern declarative animations in React using the `motion` library.

## Instructions
1. **Package Import:** Always import motion components from the modern package:
   ```javascript
   import { motion } from "motion/react"
   // For exit animations:
   import { AnimatePresence } from "motion/react"
   ```
2. **Basic Animation:** Use the `<motion.[element]>` wrapper (e.g., `<motion.div>`) to unlock animation props.
3. **Core Props:**
   - `animate`: Defines the visual state to animate to (e.g., `animate={{ opacity: 1, x: 100 }}`).
   - `initial`: Defines the starting state. Set `initial={false}` to disable mount animations.
   - `transition`: Controls the physics or easing (e.g., `transition={{ duration: 0.5, type: "spring" }}`).
4. **Gestures:** Use built-in gesture props for interactions instead of standard CSS pseudo-classes or JS events:
   - `whileHover={{ scale: 1.1 }}`
   - `whileTap={{ scale: 0.95 }}`
   - `whileDrag={{ scale: 1.2 }}`
5. **Scroll Animations:**
   - For scroll-triggered (in-view): Use `whileInView={{ opacity: 1 }}`
   - For scroll-linked (parallax): Use the `useScroll()` and `useTransform()` hooks.
6. **Layout Animations:** Automatically animate layout changes (size/position) by simply adding the `layout` prop to a motion component: `<motion.div layout />`.
7. **Exit Animations:** When elements are removed from the React tree, wrap them in `<AnimatePresence>` and provide an `exit` prop on the child.
8. **Reference Examples:** When building common UI components (like Modals, Carousels, Cursors, or Buttons), try to structure them similar to the official examples at `https://motion.dev/examples` whenever possible.

## Examples
### Basic Hover and Enter Animation:
```javascript
import { motion } from "motion/react";

export function AnimatedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      Content Here
    </motion.div>
  );
}
```

### Exit Animations:
```javascript
import { motion, AnimatePresence } from "motion/react";

export function ToggleBox({ isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>
  );
}
```

## Constraints
- DO NOT use CSS transitions or standard `:hover` for complex interactions when `motion` is available.
- DO NOT use `useEffect` or manual state to manage simple mount/unmount animations—rely on `initial`, `animate`, and `AnimatePresence`.
- DO NOT mix `framer-motion` imports if the project is using the new `motion/react` package, unless dealing with legacy code.
