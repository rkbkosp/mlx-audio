import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Roboto } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import NavigationDrawer from "@/components/NavigationDrawer";
import Box from "@mui/material/Box";
import I18nProvider from "@/components/I18nProvider";


const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "MLX Audio Studio",
  description: "Web Interface for MLX Audio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={roboto.variable}>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <I18nProvider>
              <Box sx={{ display: 'flex' }}>
                <NavigationDrawer />
                <Box component="main" sx={{ flexGrow: 1, p: 3, pt: 10 }}>
                  {children}
                </Box>
              </Box>
            </I18nProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
