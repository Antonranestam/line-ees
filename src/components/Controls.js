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
      <div style={styles.buttonGroup}>
        <button onClick={onRandomize} style={styles.button}>
          Randomize Path
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
  },
  slider: {
    width: '100%',
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
  },
};

export default Controls;