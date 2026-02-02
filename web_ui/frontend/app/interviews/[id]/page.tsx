'use client';
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Box, Typography, Card, CardContent, Button,
    CircularProgress, Paper, Divider, IconButton
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { useTranslation } from "react-i18next";

export default function InterviewDetailPage() {
    const { t } = useTranslation();
    const params = useParams();
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [transcript, setTranscript] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:8000/v1/interviews/${params.id}`)
            .then(res => {
                if (!res.ok) throw new Error("Not found");
                return res.json();
            })
            .then(data => {
                setSession(data.session);
                setTranscript(data.transcript);
            })
            .catch(e => {
                console.error(e);
                alert("Failed to load interview");
                router.push("/interviews");
            })
            .finally(() => setLoading(false));
    }, [params.id, router]);

    const handleSeek = (time: number) => {
        const event = new CustomEvent('seek-audio', { detail: time });
        window.dispatchEvent(event);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;
    if (!session) return null;

    const audioUrl = `http://localhost:8000/files/${session.filename}`;

    return (
        <Box maxWidth="1400px" mx="auto" sx={{ height: 'calc(100vh - 120px)' }}>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => router.push("/interviews")} sx={{ mr: 2 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5">{session.filename}</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, height: '100%' }}>
                {/* Left Panel: Metadata & Player */}
                <Box sx={{ width: { xs: '100%', md: '33%' }, display: 'flex', flexDirection: 'column' }}>
                    <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">{t('interviews.table_interviewee')}</Typography>
                            <Typography variant="body1" gutterBottom>{session.interviewee}</Typography>

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="subtitle2" color="text.secondary">{t('interviews.table_project')}</Typography>
                            <Typography variant="body1" gutterBottom>{session.project_name}</Typography>

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="subtitle2" color="text.secondary">{t('interviews.table_date')}</Typography>
                            <Typography variant="body1">{new Date(session.date).toLocaleDateString()}</Typography>

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="subtitle2" color="text.secondary">{t('interviews.table_status')}</Typography>
                            <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                {t(`interviews.status_${session.status}` as any)}
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom>{t('interviews.player')}</Typography>
                            <WaveformVisualizer audioUrl={audioUrl} />
                        </CardContent>
                    </Card>
                </Box>

                {/* Right Panel: Transcript */}
                <Box sx={{ width: { xs: '100%', md: '67%' }, height: '100%' }}>
                    <Paper variant="outlined" sx={{ height: '100%', overflow: 'auto', p: 3, bgcolor: 'background.default' }}>
                        <Typography variant="h6" gutterBottom sx={{ position: 'sticky', top: 0, bgcolor: 'background.default', zIndex: 1 }}>
                            {t('interviews.transcript')}
                        </Typography>
                        {transcript.length === 0 ? (
                            <Typography color="text.secondary" sx={{ fontStyle: 'italic', mt: 4, textAlign: 'center' }}>
                                {session.status === 'pending' || session.status === 'processing'
                                    ? t('interviews.status_processing') + "..."
                                    : t('interviews.no_transcript')
                                }
                            </Typography>
                        ) : (
                            transcript.map((seg: any, idx: number) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        p: 2,
                                        mb: 1,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                    onClick={() => handleSeek(seg.start)}
                                >
                                    <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                                        {formatTime(seg.start)} - {formatTime(seg.end)}
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                                        {seg.text}
                                    </Typography>
                                </Box>
                            ))
                        )}
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
