import React, { useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'

const AnimatedCounter = ({ value, formatter = (v) => Math.floor(v), duration = 1.2, delay = 0 }) => {
  const textRef = useRef(null);
  const proxy = useRef({ val: 0 });

  useGSAP(() => {
    // Restart from 0 to ensure the animation is visible
    proxy.current.val = 0;

    gsap.to(proxy.current, {
      val: value || 0,
      duration: duration,
      delay: delay,
      ease: "power2.out",
      onUpdate: () => {
        if (textRef.current) {
          textRef.current.innerText = formatter(proxy.current.val);
        }
      }
    });
  }, { dependencies: [value, delay] });

  return <span ref={textRef}>{formatter(0)}</span>;
};

export default AnimatedCounter
