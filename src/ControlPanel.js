import React from 'react';

const ControlPanel = ({ onRandomize }) => (
  <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
    <button 
      onClick={onRandomize} 
      style={{ 
        padding: '10px 20px', 
        fontSize: '16px', 
        backgroundColor: '#2458d4', 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px', 
        cursor: 'pointer' 
      }}
    >
      Randomize Poster
    </button>
  </div>
);

export default ControlPanel;