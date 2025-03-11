
import { supabase } from '@/integrations/supabase/client';

// Barber color cache to reduce database queries
let barberColorsCache: Record<string, string | null> = {};

// Function to get barber color from the database or cache
export const getBarberColorFromDb = async (barberId: string): Promise<string | null> => {
  // Return from cache if available
  if (barberColorsCache[barberId] !== undefined) {
    return barberColorsCache[barberId];
  }
  
  try {
    // @ts-ignore - Supabase types issue
    const { data, error } = await supabase
      .from('barbers')
      .select('color')
      .eq('id', barberId)
      .single();
    
    if (error) {
      console.error('Error fetching barber color:', error);
      return null;
    }
    
    const color = data?.color || null;
    // Update cache
    barberColorsCache[barberId] = color;
    return color;
  } catch (error) {
    console.error('Error getting barber color:', error);
    return null;
  }
};

// Clear cache function (can be called when barber colors are updated)
export const clearBarberColorCache = () => {
  barberColorsCache = {};
};

// Generate a color based on barber ID for consistency
export const getBarberColor = (barberId: string, returnRGB: boolean = false): string => {
  // Try to get the color from cache first
  const cachedColor = barberColorsCache[barberId];
  
  if (cachedColor) {
    if (returnRGB) {
      // Convert hex to RGB
      const r = parseInt(cachedColor.slice(1, 3), 16);
      const g = parseInt(cachedColor.slice(3, 5), 16);
      const b = parseInt(cachedColor.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    }
    return cachedColor;
  }
  
  // If no cached color, use the hash-based fallback
  const hash = Array.from(barberId).reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
  );
  const hue = Math.abs(hash) % 360;
  
  const saturation = returnRGB ? '85' : '70';
  const lightness = returnRGB ? '40' : '60';
  
  if (returnRGB) {
    // Convert HSL to RGB for better control of transparency
    const h = hue / 360;
    const s = parseInt(saturation) / 100;
    const l = parseInt(lightness) / 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
      g = Math.round(hue2rgb(p, q, h) * 255);
      b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    }
    
    return `${r}, ${g}, ${b}`;
  }
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
