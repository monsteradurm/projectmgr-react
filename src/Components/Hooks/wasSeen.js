import React, { useEffect, useState } from "react";

export const useWasSeen = () => {
    // to prevents runtime crash in IE, let's mark it true right away
    const [wasSeen, setWasSeen] = React.useState(
      typeof IntersectionObserver !== "function"
    );
  
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current && !wasSeen) {
        const observer = new IntersectionObserver(
          ([entry]) => entry.isIntersecting && setWasSeen(true)
        );
        observer.observe(ref.current);
        return () => {
          observer.disconnect();
        };
      }
    }, [wasSeen]);
    return [wasSeen, ref];
  }

export const useOnScreen = (ref, rootMargin = "0px") => {
    // State and setter for storing whether element is visible
    const [isIntersecting, setIntersecting] = useState(false);
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // Update our state when observer callback fires
          setIntersecting(entry.isIntersecting);
        },
        {
          rootMargin,
        }
      );
      if (ref.current) {
        observer.observe(ref.current);
      }
      return () => {
        observer.unobserve(ref.current);
      };
    }, []); // Empty array ensures that effect is only run on mount and unmount
    return isIntersecting;
  }