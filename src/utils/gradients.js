// utils/gradients.js

export const gradients = [
    {
      name: "Sunset",
      colors: ["#ffbe0b", "#fb5607", "#ff006e", "#8338ec", "#3a86ff"]
    },
    {
      name: "Ocean",
      colors: ['#008967', '#2458d4', '#eb4836', '#f3b2d1', '#f4bb54', '#ea4b36']
    },
    {
      name: "Vivid Pink",
      colors: ["#390099", "#9e0059", "#ff0054", "#ff5400", "#ffbd00"]
    },
    {
      name: "Lush Green",
      colors: ["#56AB2F", "#A8E063"]
    },
    {
      name: "Purple Haze",
      colors: ["#7303c0", "#EC38BC", "#FDEFF9"]
    },
    {
      name: "Electric Blue",
      colors: ["#0099F7", "#F11712"]
    },
    {
      name: "Citrus Splash",
      colors: ["#FDC830", "#F37335"]
    },
    {
      name: "Cosmic Fusion",
      colors: ["#FF00CC", "#333399"]
    },
    {
      name: "Fire and Ice",
      colors: ["#FF4B2B", "#53A0FD"]
    },
    {
      name: "Tropical Paradise",
      colors: ["#00F260", "#0575E6"]
    },
    {
      name: "Cherry Blossom",
      colors: ["#FFC0CB", "#FF69B4", "#FF1493"]
    },
    {
      name: "Golden Hour",
      colors: ["#FDBB2D", "#22C1C3"]
    }
  ];
  
  export const getRandomGradient = () => {
    return gradients[Math.floor(Math.random() * gradients.length)];
  };
  
  export const getGradientByName = (name) => {
    return gradients.find(gradient => gradient.name === name) || gradients[0];
  };
  
  export const getAllGradientNames = () => {
    return gradients.map(gradient => gradient.name);
  };