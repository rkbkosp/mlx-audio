'use client';
import { Typography, Grid, Card, CardContent, CardActionArea, Box, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import Link from "next/link";
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MicIcon from '@mui/icons-material/Mic';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    fetch('http://localhost:8000/v1/system/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Failed to fetch stats", err));
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.welcome')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {t('dashboard.subtitle')}
      </Typography>

      <Grid container spacing={3}>
        {/* System Status Card */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('dashboard.system_status')}</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip label={`Memory: ${stats?.memory?.percent ?? '-'}%`} color={stats?.memory?.percent > 80 ? 'error' : 'success'} />
                <Chip label={`CPU: ${stats?.cpu?.percent ?? '-'}%`} color="default" />
                <Chip label={`Device: ${stats?.mlx?.default_device ?? 'Apple Silicon'}`} color="primary" variant="outlined" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Cards */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea component={Link} href="/tts" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <RecordVoiceOverIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                <Typography variant="h5">{t('nav.tts')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.feature_tts')}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea component={Link} href="/stt" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <MicIcon sx={{ fontSize: 60, mb: 2, color: 'secondary.main' }} />
                <Typography variant="h5">{t('nav.stt')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.feature_stt')}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardActionArea component={Link} href="/sts" sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <GraphicEqIcon sx={{ fontSize: 60, mb: 2, color: 'warning.main' }} />
                <Typography variant="h5">{t('nav.sts')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('dashboard.feature_sts')}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
