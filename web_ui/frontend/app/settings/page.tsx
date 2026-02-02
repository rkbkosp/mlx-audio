'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, TextField, Switch, FormControlLabel, Button, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
    const { t, i18n } = useTranslation();
    const [apiPort, setApiPort] = useState("8000");
    const [darkMode, setDarkMode] = useState(true);
    const [language, setLanguage] = useState(i18n.language || 'en');

    useEffect(() => {
        setLanguage(i18n.language);
    }, [i18n.language]);

    const handleSave = () => {
        // Persist language change if needed, though changeLanguage usually persists to localStorage via detector
        alert(t('settings.saved'));
    };

    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
    };

    return (
        <Box maxWidth="800px" mx="auto">
            <Typography variant="h4" gutterBottom>{t('settings.title')}</Typography>

            <Card variant="outlined">
                <CardContent>
                    <Grid container spacing={4}>
                        <Grid size={12}>
                            <Typography variant="h6">{t('settings.general')}</Typography>
                            <TextField
                                label={t('settings.api_port')}
                                fullWidth
                                margin="normal"
                                value={apiPort}
                                onChange={(e) => setApiPort(e.target.value)}
                                helperText={t('settings.api_port_helper')}
                            />
                            <FormControl fullWidth margin="normal">
                                <InputLabel>{t('settings.language')}</InputLabel>
                                <Select
                                    value={language}
                                    label={t('settings.language')}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                >
                                    <MenuItem value="en">English</MenuItem>
                                    <MenuItem value="zh">简体中文 (Simplified Chinese)</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <Typography variant="h6">{t('settings.appearance')}</Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={darkMode}
                                        onChange={(e) => setDarkMode(e.target.checked)}
                                    />
                                }
                                label={t('settings.dark_mode')}
                            />
                        </Grid>
                        <Grid size={12}>
                            <Button variant="contained" onClick={handleSave}>
                                {t('settings.save')}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
}
