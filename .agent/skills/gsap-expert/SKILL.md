---
name: gsap-expert
description: Use this skill when the user asks to implement animations, use GSAP, or create timeline sequences in the UI.
---

# GSAP Expert Skill

## Goal
To write clean, performant, and modern GSAP 3 code, specifically tailored for React applications.

## Instructions
1. **React Integration:** Always use the `@gsap/react` package and the `useGSAP()` hook for animations inside React components. This handles cleanup automatically.
2. **Modern Syntax:** Use GSAP 3 syntax exclusively (`gsap.to()`, `gsap.from()`, `gsap.timeline()`).
3. **Scroll Animations:** If scroll-based animations are requested, use the `ScrollTrigger` plugin and remember to register it via `gsap.registerPlugin(ScrollTrigger)`.
4. **Refs:** Use standard React `useRef` to target elements for animation.

## Examples
### Basic useGSAP setup:
```javascript
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

function MyComponent() {
  const container = useRef();
  
  useGSAP(() => {
    gsap.to(".box", { x: 100, duration: 1 });
  }, { scope: container });
  
  return (
    <div ref={container}>
      <div className="box">Animate Me</div>
    </div>
  );
}
```

## Constraints
- DO NOT use deprecated GSAP 1/2 syntax like `TweenMax` or `TimelineLite`.
- DO NOT use `useEffect` for GSAP animations; always use `useGSAP`.
