"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  vy: number;
  radius: number;
  brightness: number;
  color: string;
  trail: { x: number; y: number; opacity: number }[];
  orbitCenter?: { x: number; y: number };
  orbitRadius?: number;
  orbitAngle?: number;
  orbitSpeed?: number;
  beingSucked?: boolean;
  suckTarget?: { x: number; y: number };
  suckSpeed?: number;
}

interface CelestialBody {
  x: number;
  y: number;
  radius: number;
  type: "moon" | "saturn" | "earth" | "jupiter" | "asteroid" | "blackhole";
  rotation: number;
  suckRadius?: number;
  suckStrength?: number;
}

/**
 * Galaxy-like star field with parallax scroll effect and interactive celestial bodies.
 * Click to turn planets into black holes that suck in stars.
 */
export default function StarfallBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();
  const stars = useRef<Star[]>([]);
  const celestialBodies = useRef<CelestialBody[]>([]);
  const scrollY = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let scrollTimeout: number;
    let lastFrameTime = 0;
    const targetFPS = 30; // Limit to 30 FPS for better performance
    const frameInterval = 1000 / targetFPS;

    const handleScroll = () => {
      // Throttle scroll events to reduce lag
      if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
      }

      scrollTimeout = window.requestAnimationFrame(() => {
        scrollY.current = window.scrollY;
      });
    };

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      console.log(`Click detected at: ${x}, ${y}`);

      // Check if click is on a celestial body
      celestialBodies.current.forEach((body, index) => {
        if (body.type !== "blackhole") {
          const distance = Math.sqrt((x - body.x) ** 2 + (y - body.y) ** 2);
          const clickRadius = body.radius * 1.5; // Larger click area

          console.log(
            `Body ${index} (${body.type}) at ${body.x}, ${body.y}, radius: ${body.radius}, distance: ${distance}, clickRadius: ${clickRadius}`
          );

          if (distance <= clickRadius) {
            console.log(`Transforming ${body.type} into black hole!`);

            // Transform into black hole
            body.type = "blackhole";
            body.suckRadius = body.radius * 3; // Suck radius is 3x body radius
            body.suckStrength = 0.02 + Math.random() * 0.03; // Random suck strength

            // Start sucking nearby stars
            stars.current.forEach((star) => {
              const starDistance = Math.sqrt(
                (star.x - body.x) ** 2 + (star.y - body.y) ** 2
              );
              if (starDistance <= body.suckRadius!) {
                star.beingSucked = true;
                star.suckTarget = { x: body.x, y: body.y };
                star.suckSpeed = body.suckStrength!;
              }
            });
          }
        }
      });
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initStars();
      initCelestialBodies();
    };

    const initStars = () => {
      const logicalW = window.innerWidth;
      const logicalH = window.innerHeight;
      const baseCount = Math.floor((logicalW * logicalH) / 25000); // Reduced density
      const STAR_COUNT = Math.max(15, Math.min(baseCount, 60)); // Reduced max stars
      stars.current = Array.from({ length: STAR_COUNT }).map(() =>
        createStar()
      );
    };

    const initCelestialBodies = () => {
      const logicalW = window.innerWidth;
      const logicalH = window.innerHeight;

      // Create 2-3 moons - smaller size
      const moonCount = 2 + Math.floor(Math.random() * 2);
      const moons = Array.from({ length: moonCount }, () => ({
        x: Math.random() * logicalW,
        y: Math.random() * logicalH,
        radius: 8 + Math.random() * 12, // Smaller moons (8-20px)
        type: "moon" as const,
        rotation: Math.random() * Math.PI * 2,
      }));

      // Create 1-2 Saturns - smaller size
      const saturnCount = 1 + Math.floor(Math.random() * 2);
      const saturns = Array.from({ length: saturnCount }, () => ({
        x: Math.random() * logicalW,
        y: Math.random() * logicalH,
        radius: 12 + Math.random() * 18, // Smaller Saturns (12-30px)
        type: "saturn" as const,
        rotation: Math.random() * Math.PI * 2,
      }));

      // Create 1-2 Earth-like planets
      const earthCount = 1 + Math.floor(Math.random() * 2);
      const earths = Array.from({ length: earthCount }, () => ({
        x: Math.random() * logicalW,
        y: Math.random() * logicalH,
        radius: 10 + Math.random() * 15, // Earth-like planets (10-25px)
        type: "earth" as const,
        rotation: Math.random() * Math.PI * 2,
      }));

      // Create 1 Jupiter (gas giant)
      const jupiters = Array.from({ length: 1 }, () => ({
        x: Math.random() * logicalW,
        y: Math.random() * logicalH,
        radius: 15 + Math.random() * 20, // Jupiter (15-35px)
        type: "jupiter" as const,
        rotation: Math.random() * Math.PI * 2,
      }));

      // Create 3-5 asteroids
      const asteroidCount = 3 + Math.floor(Math.random() * 3);
      const asteroids = Array.from({ length: asteroidCount }, () => ({
        x: Math.random() * logicalW,
        y: Math.random() * logicalH,
        radius: 3 + Math.random() * 6, // Small asteroids (3-9px)
        type: "asteroid" as const,
        rotation: Math.random() * Math.PI * 2,
      }));

      celestialBodies.current = [
        ...moons,
        ...saturns,
        ...earths,
        ...jupiters,
        ...asteroids,
      ];
    };

    const createStar = (): Star => {
      const logicalW = window.innerWidth;
      const logicalH = window.innerHeight;
      const starTypes = [
        { color: "rgba(255,255,255,", radius: 0.6 + Math.random() * 0.8 }, // White stars
        { color: "rgba(173,216,230,", radius: 0.8 + Math.random() * 1.0 }, // Light blue stars
        { color: "rgba(255,182,193,", radius: 0.7 + Math.random() * 0.9 }, // Light pink stars
        { color: "rgba(255,255,224,", radius: 0.5 + Math.random() * 0.7 }, // Yellow stars
      ];
      const starType = starTypes[Math.floor(Math.random() * starTypes.length)];

      // 60% chance to orbit around a celestial body
      const shouldOrbit =
        Math.random() < 0.6 && celestialBodies.current.length > 0;

      if (shouldOrbit) {
        const body =
          celestialBodies.current[
            Math.floor(Math.random() * celestialBodies.current.length)
          ];
        const orbitRadius = body.radius * (1.5 + Math.random() * 2.5); // 1.5x to 4x body radius
        const orbitAngle = Math.random() * Math.PI * 2;
        const orbitSpeed =
          (0.005 + Math.random() * 0.015) * (Math.random() < 0.5 ? 1 : -1); // Clockwise or counter-clockwise

        return {
          x: body.x + Math.cos(orbitAngle) * orbitRadius,
          y: body.y + Math.sin(orbitAngle) * orbitRadius,
          vy: 0.1 + Math.random() * 0.3, // Slower for orbiting stars
          radius: starType.radius,
          brightness: 0.4 + Math.random() * 0.6,
          color: starType.color,
          trail: [],
          orbitCenter: { x: body.x, y: body.y },
          orbitRadius: orbitRadius,
          orbitAngle: orbitAngle,
          orbitSpeed: orbitSpeed,
        };
      } else {
        // Regular falling star
        return {
          x: Math.random() * logicalW,
          y: Math.random() * logicalH,
          vy: 0.3 + Math.random() * 0.8,
          radius: starType.radius,
          brightness: 0.4 + Math.random() * 0.6,
          color: starType.color,
          trail: [],
        };
      }
    };

    const drawMoon = (ctx: CanvasRenderingContext2D, body: CelestialBody) => {
      // Moon glow - make it more visible
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.shadowBlur = 25;
      ctx.shadowColor = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Moon surface - brighter
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fill();

      // Clickable indicator - pulsing ring
      const pulseOpacity = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
      ctx.strokeStyle = `rgba(255,255,255,${pulseOpacity})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();

      // Moon craters
      ctx.fillStyle = "rgba(200,200,200,0.4)";
      ctx.shadowBlur = 0;
      for (let i = 0; i < 3; i++) {
        const angle = body.rotation + (i * Math.PI) / 3;
        const distance = body.radius * 0.6;
        const craterX = body.x + Math.cos(angle) * distance;
        const craterY = body.y + Math.sin(angle) * distance;
        ctx.beginPath();
        ctx.arc(craterX, craterY, 3 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawSaturn = (ctx: CanvasRenderingContext2D, body: CelestialBody) => {
      // Saturn glow - make it more visible
      ctx.fillStyle = "rgba(255,255,224,0.2)";
      ctx.shadowBlur = 30;
      ctx.shadowColor = "rgba(255,255,224,0.4)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Clickable indicator - pulsing ring
      const pulseOpacity = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
      ctx.strokeStyle = `rgba(255,255,224,${pulseOpacity})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(255,255,224,0.6)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.4, 0, Math.PI * 2);
      ctx.stroke();

      // Saturn rings
      ctx.strokeStyle = "rgba(255,255,224,0.7)";
      ctx.lineWidth = 5;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(255,255,224,0.5)";
      ctx.beginPath();
      ctx.ellipse(
        body.x,
        body.y,
        body.radius * 1.4,
        body.radius * 0.4,
        body.rotation,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Saturn planet
      ctx.fillStyle = "rgba(255,255,224,0.95)";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(255,255,224,0.6)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fill();

      // Saturn bands
      ctx.strokeStyle = "rgba(255,200,100,0.5)";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 0;
      for (let i = 0; i < 3; i++) {
        const y = body.y - body.radius * 0.3 + i * body.radius * 0.3;
        ctx.beginPath();
        ctx.ellipse(body.x, y, body.radius * 0.8, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawBlackHole = (
      ctx: CanvasRenderingContext2D,
      body: CelestialBody
    ) => {
      // Black hole event horizon
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fill();

      // Black hole accretion disk
      ctx.strokeStyle = "rgba(255,100,0,0.8)";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(255,100,0,0.6)";
      ctx.beginPath();
      ctx.ellipse(
        body.x,
        body.y,
        body.radius * 1.2,
        body.radius * 0.4,
        body.rotation,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Black hole glow
      ctx.fillStyle = "rgba(255,100,0,0.1)";
      ctx.shadowBlur = 30;
      ctx.shadowColor = "rgba(255,100,0,0.4)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Suck radius indicator (subtle)
      if (body.suckRadius) {
        ctx.strokeStyle = "rgba(255,100,0,0.2)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(body.x, body.y, body.suckRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const drawEarth = (ctx: CanvasRenderingContext2D, body: CelestialBody) => {
      // Earth glow
      ctx.fillStyle = "rgba(100,150,255,0.2)";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(100,150,255,0.4)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Clickable indicator - pulsing ring
      const pulseOpacity = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
      ctx.strokeStyle = `rgba(100,150,255,${pulseOpacity})`;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(100,150,255,0.6)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();

      // Earth surface - blue-green
      ctx.fillStyle = "rgba(100,150,255,0.9)";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(100,150,255,0.5)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fill();

      // Continents
      ctx.fillStyle = "rgba(50,200,100,0.6)";
      ctx.shadowBlur = 0;
      for (let i = 0; i < 4; i++) {
        const angle = body.rotation + (i * Math.PI) / 2;
        const distance = body.radius * 0.7;
        const continentX = body.x + Math.cos(angle) * distance;
        const continentY = body.y + Math.sin(angle) * distance;
        ctx.beginPath();
        ctx.arc(continentX, continentY, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawJupiter = (
      ctx: CanvasRenderingContext2D,
      body: CelestialBody
    ) => {
      // Jupiter glow
      ctx.fillStyle = "rgba(255,200,100,0.2)";
      ctx.shadowBlur = 25;
      ctx.shadowColor = "rgba(255,200,100,0.4)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Clickable indicator - pulsing ring
      const pulseOpacity = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
      ctx.strokeStyle = `rgba(255,200,100,${pulseOpacity})`;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(255,200,100,0.6)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.4, 0, Math.PI * 2);
      ctx.stroke();

      // Jupiter surface - orange-yellow
      ctx.fillStyle = "rgba(255,200,100,0.9)";
      ctx.shadowBlur = 12;
      ctx.shadowColor = "rgba(255,200,100,0.5)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fill();

      // Jupiter bands
      ctx.strokeStyle = "rgba(255,150,50,0.6)";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      for (let i = 0; i < 4; i++) {
        const y = body.y - body.radius * 0.4 + i * body.radius * 0.25;
        ctx.beginPath();
        ctx.ellipse(body.x, y, body.radius * 0.9, 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Great Red Spot
      ctx.fillStyle = "rgba(255,100,100,0.7)";
      ctx.beginPath();
      ctx.ellipse(
        body.x - body.radius * 0.3,
        body.y - body.radius * 0.2,
        body.radius * 0.3,
        body.radius * 0.15,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    const drawAsteroid = (
      ctx: CanvasRenderingContext2D,
      body: CelestialBody
    ) => {
      // Asteroid glow
      ctx.fillStyle = "rgba(150,150,150,0.15)";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "rgba(150,150,150,0.3)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Clickable indicator - pulsing ring
      const pulseOpacity = 0.3 + 0.2 * Math.sin(Date.now() * 0.005);
      ctx.strokeStyle = `rgba(150,150,150,${pulseOpacity})`;
      ctx.lineWidth = 1;
      ctx.shadowBlur = 4;
      ctx.shadowColor = "rgba(150,150,150,0.5)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 1.2, 0, Math.PI * 2);
      ctx.stroke();

      // Asteroid surface - gray
      ctx.fillStyle = "rgba(150,150,150,0.8)";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "rgba(150,150,150,0.4)";
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fill();

      // Asteroid craters
      ctx.fillStyle = "rgba(100,100,100,0.5)";
      ctx.shadowBlur = 0;
      for (let i = 0; i < 2; i++) {
        const angle = body.rotation + i * Math.PI;
        const distance = body.radius * 0.6;
        const craterX = body.x + Math.cos(angle) * distance;
        const craterY = body.y + Math.sin(angle) * distance;
        ctx.beginPath();
        ctx.arc(craterX, craterY, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll);
    canvas.addEventListener("click", handleClick);

    const animate = (currentTime: number) => {
      if (!ctx) return;

      // Calculate delta time for frame rate limiting
      const deltaTime = currentTime - lastFrameTime;
      if (deltaTime < frameInterval) {
        requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Calculate scroll-based slowdown factor - optimized calculation
      const scrollFactor = Math.max(0.2, 1 - scrollY.current * 0.0005);

      // Draw celestial bodies first (background)
      celestialBodies.current.forEach((body) => {
        if (body.type === "moon") {
          drawMoon(ctx, body);
        } else if (body.type === "saturn") {
          drawSaturn(ctx, body);
        } else if (body.type === "blackhole") {
          drawBlackHole(ctx, body);
        } else if (body.type === "earth") {
          drawEarth(ctx, body);
        } else if (body.type === "jupiter") {
          drawJupiter(ctx, body);
        } else if (body.type === "asteroid") {
          drawAsteroid(ctx, body);
        }
      });

      // Optimize star updates by reducing calculations
      stars.current.forEach((star) => {
        // Check if star is being sucked by any black hole - only check if not already being sucked
        if (!star.beingSucked) {
          for (const body of celestialBodies.current) {
            if (body.type === "blackhole" && body.suckRadius) {
              const dx = star.x - body.x;
              const dy = star.y - body.y;
              const distanceSquared = dx * dx + dy * dy;

              if (distanceSquared <= body.suckRadius * body.suckRadius) {
                star.beingSucked = true;
                star.suckTarget = { x: body.x, y: body.y };
                star.suckSpeed = body.suckStrength || 0.02;
                break; // Only check one black hole at a time
              }
            }
          }
        }

        // Add current position to trail
        star.trail.push({ x: star.x, y: star.y, opacity: 1.0 });

        // Keep only last 4 trail points for better performance
        if (star.trail.length > 4) {
          star.trail.shift();
        }

        // Draw galaxy trail - simplified for performance
        star.trail.forEach((trailPoint, index) => {
          const opacity = (index / star.trail.length) * 0.3 * star.brightness;
          ctx.fillStyle = `${star.color}${opacity})`;
          ctx.shadowBlur = 3; // Reduced shadow blur
          ctx.shadowColor = `${star.color}${opacity * 0.3})`;

          ctx.beginPath();
          ctx.arc(
            trailPoint.x,
            trailPoint.y,
            star.radius * 0.5, // Smaller trail points
            0,
            Math.PI * 2
          );
          ctx.fill();
        });

        // Draw main star with simplified glow
        const starOpacity = 0.8 * star.brightness;
        ctx.fillStyle = `${star.color}${starOpacity})`;
        ctx.shadowBlur = 8; // Reduced shadow blur
        ctx.shadowColor = `${star.color}${starOpacity * 0.4})`;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();

        // Update position based on star type - optimized calculations
        if (star.beingSucked && star.suckTarget && star.suckSpeed) {
          // Star is being sucked into black hole
          const dx = star.suckTarget.x - star.x;
          const dy = star.suckTarget.y - star.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 2) {
            // Move star towards black hole
            const speed = star.suckSpeed * 10;
            star.x += (dx / distance) * speed;
            star.y += (dy / distance) * speed;
          } else {
            // Star has been consumed - reset it
            star.x = Math.random() * window.innerWidth;
            star.y = -star.radius;
            star.beingSucked = false;
            star.suckTarget = undefined;
            star.suckSpeed = undefined;
            star.trail = [];
          }
        } else if (
          star.orbitCenter &&
          star.orbitRadius &&
          star.orbitAngle &&
          star.orbitSpeed
        ) {
          // Orbiting star
          star.orbitAngle += star.orbitSpeed * scrollFactor;
          star.x =
            star.orbitCenter.x + Math.cos(star.orbitAngle) * star.orbitRadius;
          star.y =
            star.orbitCenter.y + Math.sin(star.orbitAngle) * star.orbitRadius;
        } else {
          // Falling star
          star.y += star.vy * scrollFactor;
          if (star.y - star.radius > window.innerHeight) {
            star.x = Math.random() * window.innerWidth;
            star.y = -star.radius;
            star.vy = 0.3 + Math.random() * 0.8;
            star.brightness = 0.4 + Math.random() * 0.6;
            star.trail = [];
          }
        }
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (scrollTimeout) window.cancelAnimationFrame(scrollTimeout);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      canvas.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-100 pointer-events-auto cursor-pointer"
      />
    </div>
  );
}
