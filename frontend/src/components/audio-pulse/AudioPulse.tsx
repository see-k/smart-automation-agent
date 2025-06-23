/**
 * Copyright 2024 Google LLC
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

import "./audio-pulse.scss";
import React from "react";
import { useEffect, useRef, useState } from "react";
import c from "classnames";

const barCount = 5;
const waveformPoints = 32;

export type AudioPulseProps = {
  active: boolean;
  volume: number;
  hover?: boolean;
};

export default function AudioPulse({ active, volume, hover }: AudioPulseProps) {
  const barsRef = useRef<HTMLDivElement[]>([]);
  const waveformRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualMode, setVisualMode] = useState<'bars' | 'waveform' | 'circular'>('bars');
  const animationRef = useRef<number>();

  // Generate random frequency data for visualization
  const generateFrequencyData = () => {
    const data = new Array(barCount).fill(0);
    for (let i = 0; i < barCount; i++) {
      const baseHeight = volume * (i === Math.floor(barCount / 2) ? 400 : 200);
      data[i] = Math.max(4, baseHeight + Math.random() * volume * 100);
    }
    return data;
  };

  // Update bar visualization
  useEffect(() => {
    if (!active || visualMode !== 'bars') return;

    let timeout: number | null = null;
    const update = () => {
      const frequencyData = generateFrequencyData();
      barsRef.current.forEach((bar, i) => {
        if (bar) {
          bar.style.height = `${Math.min(40, frequencyData[i])}px`;
          bar.style.opacity = `${0.3 + (frequencyData[i] / 40) * 0.7}`;
        }
      });
      timeout = window.setTimeout(update, 50);
    };

    update();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [volume, active, visualMode]);

  // Circular visualization
  useEffect(() => {
    if (!active || visualMode !== 'circular' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 8;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const time = Date.now() * 0.001;
      const rings = 3;
      
      for (let ring = 0; ring < rings; ring++) {
        const radius = baseRadius + ring * 4 + volume * 20;
        const opacity = (1 - ring * 0.3) * (0.4 + volume * 1.5);
        
        // Only draw rings that fit within the canvas
        if (radius < centerX - 2) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Add rotating dots (fewer and smaller)
          for (let i = 0; i < 6; i++) {
            const angle = (time + ring * 0.5 + i * Math.PI / 3) % (Math.PI * 2);
            const dotX = centerX + Math.cos(angle) * radius;
            const dotY = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.arc(dotX, dotY, 1, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(124, 58, 237, ${opacity})`;
            ctx.fill();
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [volume, active, visualMode]);

  // Waveform visualization
  useEffect(() => {
    if (!active || visualMode !== 'waveform') return;

    let timeout: number | null = null;
    const update = () => {
      if (waveformRef.current) {
        const children = waveformRef.current.children;
        for (let i = 0; i < children.length; i++) {
          const element = children[i] as HTMLElement;
          const phase = (Date.now() * 0.005 + i * 0.2) % (Math.PI * 2);
          const amplitude = 4 + volume * 20;
          const height = 4 + Math.sin(phase) * amplitude;
          element.style.height = `${Math.max(2, height)}px`;
        }
      }
      timeout = window.setTimeout(update, 50);
    };

    update();
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [volume, active, visualMode]);

  const cycleVisualization = () => {
    const modes: Array<'bars' | 'waveform' | 'circular'> = ['bars', 'waveform', 'circular'];
    const currentIndex = modes.indexOf(visualMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setVisualMode(modes[nextIndex]);
  };

  return (
    <div 
      className={c("audioPulse", { active, hover })} 
      onClick={cycleVisualization}
      title="Click to cycle visualization modes"
    >
      {visualMode === 'bars' && (
        <div className="bars-container">
          {Array(barCount)
            .fill(null)
            .map((_, i) => (
              <div
                key={i}
                className="frequency-bar"
                ref={(el) => (barsRef.current[i] = el!)}
                style={{ 
                  animationDelay: `${i * 100}ms`,
                  '--bar-index': i 
                } as React.CSSProperties}
              />
            ))}
        </div>
      )}
      
      {visualMode === 'waveform' && (
        <div className="waveform-container" ref={waveformRef}>
          {Array(waveformPoints)
            .fill(null)
            .map((_, i) => (
              <div
                key={i}
                className="waveform-point"
                style={{ '--point-index': i } as React.CSSProperties}
              />
            ))}
        </div>
      )}
      
      {visualMode === 'circular' && (
        <div className="circular-container">
          <canvas 
            ref={canvasRef} 
            width={36} 
            height={36}
            className="circular-canvas"
          />
        </div>
      )}
      
      <div className="visualization-indicator">
        <div className={c("mode-dot", { active: visualMode === 'bars' })} />
        <div className={c("mode-dot", { active: visualMode === 'waveform' })} />
        <div className={c("mode-dot", { active: visualMode === 'circular' })} />
      </div>
    </div>
  );
}
