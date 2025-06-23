/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect, useRef } from 'react';
import './ai-visualizer.scss';

interface AIVisualizerProps {
  isConnected: boolean;
  volume?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const AIVisualizer: React.FC<AIVisualizerProps> = ({ isConnected, volume = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    
    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width / window.devicePixelRatio,
          y: Math.random() * canvas.height / window.devicePixelRatio,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          life: Math.random() * 200,
          maxLife: 300 + Math.random() * 200,
          size: 1 + Math.random() * 1.5
        });
      }
    };

    initParticles();

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // Much more subtle volume response
      const baseRadius = Math.min(rect.width, rect.height) * 0.15;
      const volumeMultiplier = 1 + (volume * 0.3); // Reduced from 1.5 to 0.3 for subtle response
      const radius = baseRadius * volumeMultiplier;
      
      // Much slower and gentler pulse layers
      const pulse1 = Math.sin(time * 0.008) * 0.08 + 1;
      const pulse2 = Math.sin(time * 0.012 + Math.PI / 3) * 0.05 + 1;
      const pulse3 = Math.sin(time * 0.015 + Math.PI / 2) * 0.04 + 1;
      
      // Outer glow ring - more stable
      const outerRadius = radius * pulse1 * 1.6; // Reduced expansion from 1.8 to 1.6
      const outerGradient = ctx.createRadialGradient(
        centerX, centerY, outerRadius * 0.3,
        centerX, centerY, outerRadius
      );
      
      if (isConnected) {
        outerGradient.addColorStop(0, 'rgba(0, 212, 255, 0.08)'); // Reduced opacity
        outerGradient.addColorStop(0.7, 'rgba(124, 58, 237, 0.04)'); // Reduced opacity
        outerGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
      } else {
        outerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
        outerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.fillStyle = outerGradient;
      ctx.fill();
      
      // Main orb with more stable appearance
      const mainRadius = radius * pulse2;
      const mainGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, mainRadius
      );
      
      if (isConnected) {
        mainGradient.addColorStop(0, 'rgba(255, 255, 255, 0.85)'); // Slightly reduced
        mainGradient.addColorStop(0.2, 'rgba(0, 212, 255, 0.7)'); // Slightly reduced
        mainGradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.5)'); // Slightly reduced
        mainGradient.addColorStop(0.8, 'rgba(6, 255, 165, 0.3)'); // Slightly reduced
        mainGradient.addColorStop(1, 'rgba(0, 212, 255, 0.08)'); // Reduced
      } else {
        mainGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        mainGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        mainGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
      }
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, mainRadius, 0, Math.PI * 2);
      ctx.fillStyle = mainGradient;
      ctx.fill();
      
      // Rotating outer rings - much more subtle volume response
      const ringCount = 3;
      for (let i = 0; i < ringCount; i++) {
        const ringRadius = radius * (1.15 + i * 0.2) * pulse3; // Reduced spacing and expansion
        const baseOpacity = isConnected ? 0.3 - i * 0.08 : 0.15 - i * 0.04; // Reduced base opacity
        const volumeOpacityBoost = volume * 0.1; // Very subtle volume boost
        const ringOpacity = Math.min(baseOpacity + volumeOpacityBoost, baseOpacity * 1.5); // Cap the boost
        const rotation = time * (0.003 + i * 0.001) * (i % 2 === 0 ? 1 : -1);
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isConnected 
          ? `rgba(0, 212, 255, ${ringOpacity})` 
          : `rgba(255, 255, 255, ${ringOpacity})`;
        ctx.lineWidth = 1.5 + volume * 1; // Reduced volume response from 3 to 1
        ctx.setLineDash([8, 16]); // Shorter dashes for subtlety
        ctx.lineDashOffset = time * 0.1;
        ctx.stroke();
        ctx.restore();
      }
      
      // Inner core with more stable glow
      const coreRadius = mainRadius * 0.25 * pulse1;
      const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreRadius * 1.8 // Reduced glow spread
      );
      
      if (isConnected) {
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        coreGradient.addColorStop(0.4, 'rgba(0, 212, 255, 0.8)'); // Adjusted stop
        coreGradient.addColorStop(1, 'rgba(0, 212, 255, 0.15)'); // Reduced outer glow
      } else {
        coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
      }
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();
      
      // Update and draw particles - more controlled behavior
      particlesRef.current.forEach((particle, index) => {
        // Update particle with volume influence but keep it subtle
        const volumeInfluence = 1 + volume * 0.2; // Very subtle speed boost
        particle.x += particle.vx * volumeInfluence;
        particle.y += particle.vy * volumeInfluence;
        particle.life++;
        
        // Respawn particle if it dies
        if (particle.life > particle.maxLife) {
          particle.x = centerX + (Math.random() - 0.5) * radius * 1.5; // Smaller spawn area
          particle.y = centerY + (Math.random() - 0.5) * radius * 1.5;
          particle.vx = (Math.random() - 0.5) * 0.15; // Even slower
          particle.vy = (Math.random() - 0.5) * 0.15;
          particle.life = 0;
          particle.maxLife = 400 + Math.random() * 200; // Longer, more stable life
        }
        
        // Draw particle with more subtle alpha
        const baseAlpha = isConnected ? 0.25 : 0.15; // Reduced base alpha
        const volumeAlphaBoost = volume * 0.1; // Subtle volume boost
        const alpha = (1 - particle.life / particle.maxLife) * (baseAlpha + volumeAlphaBoost);
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (0.8 + volume * 0.2), 0, Math.PI * 2); // Subtle size response
        ctx.fillStyle = isConnected 
          ? `rgba(0, 212, 255, ${alpha})` 
          : `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });
      
      time += 0.5;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isConnected, volume]);

  return (
    <div className="ai-visualizer">
      <canvas ref={canvasRef} className="visualizer-canvas" />
      <div className="status-overlay">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{isConnected ? 'AI AGENT ACTIVE' : 'AI AGENT STANDBY'}</span>
        </div>
      </div>
    </div>
  );
};

export default AIVisualizer; 