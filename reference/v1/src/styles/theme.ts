import { createTheme } from '@mui/material/styles';

// Get CSS variables
const getCssVar = (name: string) => {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4A90E2', // Professional blue color
    },
    background: {
      default: '#1E1E1E', // Dark background
      paper: '#2D2D2D',   // Slightly lighter dark
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  components: {
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-rail': {
            width: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          },
          '& .MuiSlider-track': {
            width: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            border: 'none',
          },
          '& .MuiSlider-thumb': {
            width: 24,
            height: 16,
            backgroundColor: '#fff',
            borderRadius: 2,
            '&:hover': {
              boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.1)',
            },
            '&.Mui-active': {
              boxShadow: '0 0 0 12px rgba(255, 255, 255, 0.2)',
            },
          },
          '& .MuiSlider-mark': {
            width: 8,
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
          },
          '& .MuiSlider-markLabel': {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.75rem',
          },
        },
      },
    },
  },
});
