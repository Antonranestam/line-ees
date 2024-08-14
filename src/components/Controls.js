import React from 'react';
import { getPathNames } from '../assets/svgPaths';

const Controls = ({
  selectedPath,
  setSelectedPath,
  noiseScale,
  setNoiseScale,
  scale,
  setScale,
  lineWidth,
  setLineWidth,
  rotation,
  setRotation,
  smoothness,
  setSmoothness,
  selectedGradient,
  setSelectedGradient,
  gradientNames,
  onRandomize,
  onRegenerate
}) => {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Controls</h2>
      
      <div style={styles.controlGroup}>
        <label>Path: </label>
        <select 
          value={selectedPath} 
          onChange={(e) => setSelectedPath(e.target.value)}
          style={styles.select}
        >
          {getPathNames().map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div style={styles.controlGroup}>
        <label>Gradient: </label>
        <select 
          value={selectedGradient} 
          onChange={(e) => setSelectedGradient(e.target.value)}
          style={styles.select}
        >
          {gradientNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div style={styles.controlGroup}>
        <label>Distortion: {noiseScale.toFixed(2)}</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={noiseScale} 
          onChange={(e) => setNoiseScale(parseFloat(e.target.value))} 
          style={styles.slider}
        />
      </div>

      <div style={styles.controlGroup}>
        <label>Scale: {scale.toFixed(2)}</label>
        <input 
          type="range" 
          min="0.1" 
          max="2" 
          step="0.01" 
          value={scale} 
          onChange={(e) => setScale(parseFloat(e.target.value))} 
          style={styles.slider}
        />
      </div>

      <div style={styles.controlGroup}>
        <label>Line Width: {lineWidth.toFixed(3)}</label>
        <input 
          type="range" 
          min="0.001" 
          max="0.4" 
          step="0.001" 
          value={lineWidth} 
          onChange={(e) => setLineWidth(parseFloat(e.target.value))} 
          style={styles.slider}
        />
      </div>

      <div style={styles.controlGroup}>
        <label>Rotation: {rotation}°</label>
        <input 
          type="range" 
          min="0" 
          max="360" 
          step="1" 
          value={rotation} 
          onChange={(e) => setRotation(parseInt(e.target.value))} 
          style={styles.slider}
        />
      </div>

      <div style={styles.controlGroup}>
        <label>Smoothness: {smoothness.toFixed(2)}</label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.01" 
          value={smoothness} 
          onChange={(e) => setSmoothness(parseFloat(e.target.value))} 
          style={styles.slider}
        />
      </div>

      <div style={styles.buttonGroup}>
        <button onClick={onRandomize} style={styles.button}>
          Randomize All
        </button>
        <button onClick={onRegenerate} style={styles.button}>
          Regenerate Path
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    color: 'white',
    padding: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '10px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  select: {
    padding: '5px 10px',
    fontSize: '14px',
    backgroundColor: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
  },
  slider: {
    width: '100%',
    appearance: 'none',
    height: '5px',
    borderRadius: '5px',
    background: '#ddd',
    outline: 'none',
    opacity: '0.7',
    transition: 'opacity .2s',
    '&:hover': {
      opacity: 1,
    },
    '&::-webkit-slider-thumb': {
      appearance: 'none',
      width: '15px',
      height: '15px',
      borderRadius: '50%',
      background: '#4CAF50',
      cursor: 'pointer',
    },
    '&::-moz-range-thumb': {
      width: '15px',
      height: '15px',
      borderRadius: '50%',
      background: '#4CAF50',
      cursor: 'pointer',
    },
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  button: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#2458d4',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#1c46a8',
    },
  },
};

export default Controls;