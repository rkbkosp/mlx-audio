'use client';
import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'; // TTS
import MicIcon from '@mui/icons-material/Mic'; // STT
import GraphicEqIcon from '@mui/icons-material/GraphicEq'; // STS
import InventoryIcon from '@mui/icons-material/Inventory'; // Models
import SettingsIcon from '@mui/icons-material/Settings';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';

const drawerWidth = 240;

export default function NavigationDrawer() {
    const pathname = usePathname();
    const { t } = useTranslation();

    const menuItems = [
        { text: t('nav.dashboard'), icon: <DashboardIcon />, path: '/' },
        { text: t('nav.tts'), icon: <RecordVoiceOverIcon />, path: '/tts' },
        { text: t('nav.stt'), icon: <MicIcon />, path: '/stt' },
        { text: t('nav.sts'), icon: <GraphicEqIcon />, path: '/sts' },
        { text: t('nav.models'), icon: <InventoryIcon />, path: '/models' },
    ];

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
            }}
        >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.path} disablePadding>
                            <ListItemButton
                                component={Link}
                                href={item.path}
                                selected={pathname === item.path}
                            >
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                <Divider />
                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            component={Link}
                            href="/settings"
                            selected={pathname === '/settings'}
                        >
                            <ListItemIcon><SettingsIcon /></ListItemIcon>
                            <ListItemText primary={t('nav.settings')} />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </Drawer>
    );
}
