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

import React, { useRef, useState } from "react";
import "./App.scss";
import { LiveAPIProvider, useLiveAPIContext } from "./contexts/LiveAPIContext";
import SidePanel from "./components/side-panel/SidePanel";
import ControlTray from "./components/control-tray/ControlTray";
import AIVisualizer from "./components/ai-visualizer/AIVisualizer";
import cn from "classnames";

// Wrapper component to connect AIVisualizer to LiveAPI context
function AIVisualizerWrapper() {
  const { connected, volume } = useLiveAPIContext();
  return <AIVisualizer isConnected={connected} volume={volume} />;
}

// Floating Console Component
function FloatingConsole({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const consoleRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.console-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  return (
    <div 
      ref={consoleRef}
      className="floating-console"
      style={{ 
        left: position.x, 
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="console-header">
        <h3>Console</h3>
        <button onClick={onClose} className="close-btn">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="console-content">
        <SidePanel embedded={true} />
      </div>
    </div>
  );
}

// Floating Config Component
function FloatingConfig({ 
  isOpen, 
  onClose, 
  serverUrl, 
  setServerUrl, 
  userId, 
  setUserId 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  userId: string;
  setUserId: (id: string) => void;
}) {
  const [position, setPosition] = useState({ x: 200, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const configRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.config-header')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  return (
    <div 
      ref={configRef}
      className="floating-config"
      style={{ 
        left: position.x, 
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="config-header">
        <h3>Configuration</h3>
        <button onClick={onClose} className="close-btn">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="config-content">
        <div className="config-section">
          <div className="input-group">
            <label htmlFor="floating-server-url">Server URL</label>
            <input
              id="floating-server-url"
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="Enter server URL"
              className="modern-input"
            />
          </div>
          <div className="input-group">
            <label htmlFor="floating-user-id">User ID</label>
            <input
              id="floating-user-id"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="modern-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const defaultHost = "localhost:8000";
const defaultUri = `ws://${defaultHost}/`;

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [serverUrl, setServerUrl] = useState<string>(defaultUri);
  const [runId] = useState<string>(crypto.randomUUID());
  const [userId, setUserId] = useState<string>("user1");

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Feedback state
  const [feedbackScore, setFeedbackScore] = useState<number>(10);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [sendFeedback, setShowFeedback] = useState(false);

  const submitFeedback = async () => {
    const feedbackUrl = new URL('feedback', serverUrl.replace('ws', 'http')).href;
    
    try {
      const response = await fetch(feedbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: feedbackScore,
          text: feedbackText,
          run_id: runId,
          user_id: userId,
          log_type: "feedback"
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to submit feedback: Server returned status ${response.status} ${response.statusText}`);
      }

      // Clear feedback after successful submission
      setFeedbackScore(10);
      setFeedbackText("");
      setShowFeedback(false);
      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(`Failed to submit feedback:  ${error}`);
    }
  };

  const handleMenuItemClick = (item: string) => {
    setIsMenuOpen(false);
    if (item === 'console') {
      setIsConsoleOpen(true);
    } else if (item === 'config') {
      setIsConfigOpen(true);
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  return (
    <div className="App">
      <LiveAPIProvider url={serverUrl} userId={userId}>
        <div className="ai-agent-interface">
          {/* Background Effects */}
          <div className="background-effects">
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
          </div>

          {/* Header */}
          <header className="app-header">
            <div className="header-content">
              <div className="logo-section">
                <div className="ai-logo">
                  <div className="logo-core"></div>
                  <div className="logo-ring ring-1"></div>
                  <div className="logo-ring ring-2"></div>
                </div>
                <div className="app-title">
                  <h1>Copilot</h1>
                  <span className="subtitle">Smart Automation Assistant</span>
                  <p>by Google Gemini</p>
                </div>
              </div>
              
              <div className="header-controls">
                <div className="menu-container" ref={menuRef}>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="menu-btn"
                  >
                    <span className="material-symbols-outlined">menu</span>
                    Menu
                  </button>
                  
                  {isMenuOpen && (
                    <div className="menu-dropdown">
                      <button 
                        onClick={() => handleMenuItemClick('console')}
                        className="menu-item"
                      >
                        <span className="material-symbols-outlined">terminal</span>
                        Console
                      </button>
                      <button 
                        onClick={() => handleMenuItemClick('config')}
                        className="menu-item"
                      >
                        <span className="material-symbols-outlined">settings</span>
                        Config
                      </button>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setShowFeedback(!sendFeedback)}
                  className="feedback-btn"
                >
                  <span className="material-symbols-outlined">feedback</span>
                  Feedback
                </button>
              </div>
            </div>
          </header>

          <div className="main-interface">
            <main className="central-area">
              {videoStream ? (
                <div className="video-container">
                  <video
                    className="stream-video"
                    ref={videoRef}
                    autoPlay
                    playsInline
                  />
                  <div className="video-overlay">
                    <div className="video-frame"></div>
                  </div>
                </div>
              ) : (
                <AIVisualizerWrapper />
              )}
            </main>
          </div>

          <ControlTray
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
          />

          {/* Floating Components */}
          <FloatingConsole 
            isOpen={isConsoleOpen} 
            onClose={() => setIsConsoleOpen(false)} 
          />
          
          <FloatingConfig
            isOpen={isConfigOpen}
            onClose={() => setIsConfigOpen(false)}
            serverUrl={serverUrl}
            setServerUrl={setServerUrl}
            userId={userId}
            setUserId={setUserId}
          />

          {/* Feedback Modal */}
          {sendFeedback && (
            <div className="modal-overlay">
              <div className="feedback-modal">
                <div className="modal-header">
                  <h3>Share Your Feedback</h3>
                  <button 
                    onClick={() => setShowFeedback(false)}
                    className="close-btn"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                <div className="modal-content">
                  <div className="rating-section">
                    <label htmlFor="feedback-score">Rating</label>
                    <div className="rating-input">
                      <input
                        id="feedback-score"
                        type="range"
                        min="0"
                        max="10"
                        value={feedbackScore}
                        onChange={(e) => setFeedbackScore(Number(e.target.value))}
                        className="rating-slider"
                      />
                      <span className="rating-value">{feedbackScore}/10</span>
                    </div>
                  </div>
                  
                  <div className="comment-section">
                    <label htmlFor="feedback-text">Comments</label>
                    <textarea
                      id="feedback-text"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Tell us about your experience..."
                      className="feedback-textarea"
                    />
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button
                    onClick={submitFeedback}
                    className="submit-btn"
                  >
                    <span className="material-symbols-outlined">send</span>
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </LiveAPIProvider>
    </div>
  );
}

export default App;
