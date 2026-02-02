'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    cssVariables: true,
    palette: {
        mode: 'dark',
        primary: {
            main: '#6750a4', // Deep Purple 40
            light: '#eaddff', // Deep Purple 90 (Surface Container)
            dark: '#21005d',
        },
        secondary: {
            main: '#625b71',
            light: '#e8def8',
            dark: '#1d192b',
        },
        background: {
            default: '#141218',
            paper: '#1d1b20',
        },
    },
    typography: {
        fontFamily: 'var(--font-roboto)',
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 20, // Tonal/Filled buttons usually have pill shape
                    textTransform: 'none',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    backgroundImage: 'none',
                }
            }
        }
    },
});

export default theme;
