// Controls.js
import React from 'react';

const Controls = ({ shape, setShape, noiseScale, setNoiseScale, onRegenerate }) => {
  return (
    <div style={{ marginTop: '20px' }}>
      <select value={shape} onChange={(e) => setShape(e.target.value)} style={styles.select}>
        <option value="circle">Circle</option>
        <option value="ellipse">Ellipse</option>
        <option value="figureEight">Figure Eight</option>
        <option value="trefoil">Trefoil</option>
      </select>
      <input 
        type="range" 
        min="0" 
        max="0.2" 
        step="0.01" 
        value={noiseScale} 
        onChange={(e) => setNoiseScale(parseFloat(e.target.value))} 
        style={styles.slider}
      />
      <button onClick={onRegenerate} style={styles.button}>
        Regenerate Path
      </button>
    </div>
  );
};

const styles = {
  select: {
    padding: '5px 10px',
    marginRight: '10px',
    fontSize: '14px',
  },
  slider: {
    width: '200px',
    marginRight: '10px',
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
