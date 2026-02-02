'use client';
import { useState, useEffect } from "react";
import {
    Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
    Slider, Button, Grid, Card, CardContent, CircularProgress, Alert
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WaveformVisualizer from "@/components/WaveformVisualizer";
import { useTranslation } from "react-i18next";

const MOCK_MODELS = [
    "mlx-community/Kokoro-82M-bf16",
    "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-bf16",
    "mlx-community/csm-1b",
    "mlx-community/OuteTTS-0.2-500M"
];

const KOKORO_VOICES = ["af_heart", "af_bella", "af_nova", "bm_daniel", "zf_xiaobei"];

export default function TTSPage() {
    const { t } = useTranslation();
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState(MOCK_MODELS[0]);
    const [text, setText] = useState("Hello, welcome to MLX Audio!");
    const [voice, setVoice] = useState("af_heart");
    const [speed, setSpeed] = useState(1.0);
    const [loading, setLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [refAudio, setRefAudio] = useState<File | null>(null);

    useEffect(() => {
        fetch('http://localhost:8000/v1/models')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    setModels(data.map((m: any) => m.id));
                } else {
                    setModels(MOCK_MODELS);
                }
            })
            .catch(() => setModels(MOCK_MODELS));
    }, []);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            let refAudioPath = null;
            if (refAudio) {
                const formData = new FormData();
                formData.append("file", refAudio);
                const uploadRes = await fetch("http://localhost:8000/v1/audio/speech/upload_ref", {
                    method: "POST",
                    body: formData
                });
                const uploadData = await uploadRes.json();
                refAudioPath = uploadData.file_path;
            }

            const res = await fetch("http://localhost:8000/v1/audio/speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: selectedModel,
                    input: text,
                    voice: voice,
                    speed: speed,
                    ref_audio: refAudioPath,
                    response_format: "wav"
                })
            });

            if (!res.ok) throw new Error("Generation failed");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
        } catch (e) {
            console.error(e);
            alert("Failed to generate audio");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box maxWidth="1200px" mx="auto">
            <Typography variant="h4" gutterBottom>{t('tts.title')}</Typography>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>{t('tts.config')}</Typography>

                            <FormControl fullWidth margin="normal">
                                <InputLabel>{t('tts.model')}</InputLabel>
                                <Select
                                    value={selectedModel}
                                    label={t('tts.model')}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                >
                                    {models.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth margin="normal">
                                <InputLabel>{t('tts.voice')}</InputLabel>
                                <Select
                                    value={voice}
                                    label={t('tts.voice')}
                                    onChange={(e) => setVoice(e.target.value)}
                                >
                                    {KOKORO_VOICES.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                                </Select>
                            </FormControl>

                            <Typography gutterBottom sx={{ mt: 2 }}>{t('tts.speed')}: {speed}x</Typography>
                            <Slider
                                value={speed}
                                min={0.5} max={2.0} step={0.1}
                                onChange={(_, v) => setSpeed(v as number)}
                                valueLabelDisplay="auto"
                            />

                            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>{t('tts.voice_cloning')}</Typography>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                fullWidth
                            >
                                {refAudio ? refAudio.name : t('tts.upload_ref')}
                                <input
                                    type="file"
                                    hidden
                                    accept="audio/*"
                                    onChange={(e) => setRefAudio(e.target.files?.[0] || null)}
                                />
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Card variant="outlined" sx={{ mb: 3 }}>
                        <CardContent>
                            <TextField
                                label={t('tts.input_label')}
                                multiline
                                rows={6}
                                fullWidth
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                helperText={`${text.length} characters`}
                            />
                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleGenerate}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : t('tts.generate')}
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>

                    {audioUrl && (
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>{t('tts.output')}</Typography>
                                <WaveformVisualizer audioUrl={audioUrl} />
                                <Box sx={{ mt: 2, textAlign: 'right' }}>
                                    <Button href={audioUrl} download="speech.wav">{t('tts.download')}</Button>
                                </Box>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
}
