'use client';
import { useState } from "react";
import {
    Box, Typography, Button, TextField, Tab, Tabs, Card, CardContent,
    CircularProgress, Alert, Grid
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { useTranslation } from "react-i18next";

export default function STSPage() {
    const { t } = useTranslation();
    const [tab, setTab] = useState(0);

    return (
        <Box maxWidth="1000px" mx="auto">
            <Typography variant="h4" gutterBottom>{t('sts.title')}</Typography>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label={t('sts.tab_sep')} icon={<GraphicEqIcon />} iconPosition="start" />
                    <Tab label={t('sts.tab_enh')} icon={<AutoFixHighIcon />} iconPosition="start" />
                </Tabs>
            </Box>

            {tab === 0 ? <SeparationPanel /> : <EnhancementPanel />}
        </Box>
    );
}

function SeparationPanel() {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState("A person speaking");
    const [loading, setLoading] = useState(false);

    // ... existing logic ...
    const handleSeparate = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("prompt", prompt);

        try {
            const res = await fetch("http://localhost:8000/v1/audio/sts/separation", {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "separation_results.zip";
                a.click();
            } else {
                alert("Separation failed");
            }
        } catch (e) {
            console.error(e);
            alert("Error: " + e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card variant="outlined">
            <CardContent>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Button
                            component="label"
                            variant="outlined"
                            fullWidth
                            sx={{ height: 100 }}
                        >
                            {file ? file.name : t('sts.upload_mixed')}
                            <input type="file" hidden accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </Button>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            label={t('sts.prompt')}
                            fullWidth
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            helperText="e.g. 'A person speaking', 'Dog barking'"
                        />
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 2 }}
                            onClick={handleSeparate}
                            disabled={loading || !file}
                        >
                            {loading ? <CircularProgress size={24} /> : t('sts.separate')}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

function EnhancementPanel() {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);

    // ... existing logic ...
    const handleEnhance = async () => {
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("http://localhost:8000/v1/audio/sts/enhancement", {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setEnhancedUrl(url);
            } else {
                alert("Enhancement failed");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card variant="outlined">
            <CardContent>
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                            component="label"
                            variant="outlined"
                            fullWidth
                            sx={{ height: 100 }}
                        >
                            {file ? file.name : t('sts.upload_noisy')}
                            <input type="file" hidden accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        </Button>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 2 }}
                            onClick={handleEnhance}
                            disabled={loading || !file}
                        >
                            {loading ? <CircularProgress size={24} /> : t('sts.enhance')}
                        </Button>
                    </Grid>
                    <Grid size={{ xs: 12, md: 8 }}>
                        {enhancedUrl ? (
                            <Box>
                                <Typography gutterBottom>Enhanced Audio</Typography>
                                <WaveformVisualizer audioUrl={enhancedUrl} color="#00e676" />
                                <Button href={enhancedUrl} download="enhanced.wav" sx={{ mt: 2 }}>Download</Button>
                            </Box>
                        ) : (
                            <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography color="text.secondary">{t('sts.result_placeholder')}</Typography>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}
