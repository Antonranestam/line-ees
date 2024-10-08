// utils/colorMindApi.js

// Helper function to convert RGB to HSL
const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h, s, l];
};

// Helper function to convert HSL to RGB
const hslToRgb = (h, s, l) => {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// Function to subtly enhance vibrancy of a color
const enhanceVibrancy = (r, g, b) => {
  let [h, s, l] = rgbToHsl(r, g, b);
  
  // Subtly increase saturation
  s = Math.min(1, s * 1.1);
  
  // Adjust lightness more gently
  if (l < 0.2) l += 0.1;
  else if (l > 0.8) l -= 0.1;
  
  return hslToRgb(h, s, l);
};

// Function to check if a color is suitable for a vibrant gradient
const isSuitableColor = (r, g, b) => {
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // Allow a wider range of colors, but avoid extremely dark or light ones
  return s > 0.3 && l > 0.2 && l < 0.8;
};

export const fetchColorsFromColorMind = async () => {
  try {
    const response = await fetch('http://colormind.io/api/', {
      method: 'POST',
      body: JSON.stringify({
        model: 'default'
      })
    });
    const data = await response.json();
    
    // Process colors
    let enhancedColors = data.result.map(rgb => enhanceVibrancy(...rgb));
    
    // Filter colors, but keep at least 3 original colors
    let suitableColors = enhancedColors.filter((rgb, index) => 
      isSuitableColor(...rgb) || index < 3
    );
    
    // If we have less than 5 colors, add some until we do
    while (suitableColors.length < 5) {
      const newColor = enhanceVibrancy(
        Math.random() * 255,
        Math.random() * 255,
        Math.random() * 255
      );
      if (isSuitableColor(...newColor)) {
        suitableColors.push(newColor);
      }
    }
    
    return suitableColors.map(rgb => `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
  } catch (error) {
    console.error('Error fetching colors from ColorMind:', error);
    return null;
  }
};