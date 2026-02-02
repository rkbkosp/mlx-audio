'use client';
import { useState, useRef, useEffect } from "react";
import {
    Box, Typography, Button, Grid, Card, CardContent,
    Tab, Tabs, CircularProgress, Paper, Divider
} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { useTranslation } from "react-i18next";

export default function STTPage() {
    const { t } = useTranslation();
    const [tab, setTab] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const processor = useRef<ScriptProcessorNode | null>(null);
    const source = useRef<MediaStreamAudioSourceNode | null>(null);

    // ... (logic methods kept same, just rendering changes) ...
    const handleFileUpload = async () => {
        // ... existing implementation ...
        if (!file) return;
        setLoading(true);
        setTranscript("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", "mlx-community/whisper-large-v3-turbo-asr-fp16"); // Default

        try {
            const res = await fetch("http://localhost:8000/v1/audio/transcriptions", {
                method: "POST",
                body: formData
            });

            if (!res.body) return;
            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter(l => l.trim());
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.accumulated) setTranscript(data.accumulated);
                        else if (data.text) setTranscript(prev => prev + data.text);
                    } catch (e) { }
                }
            }
        } catch (e) {
            console.error(e);
            setTranscript("Error: " + e);
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        // ... existing implementation ...
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext.current = new AudioContext({ sampleRate: 16000 });
            source.current = audioContext.current.createMediaStreamSource(stream);
            processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

            ws.current = new WebSocket("ws://localhost:8000/v1/audio/transcriptions/realtime");

            ws.current.onopen = () => {
                ws.current?.send(JSON.stringify({
                    model: "mlx-community/whisper-large-v3-turbo-asr-fp16",
                    sample_rate: 16000
                }));
                setIsRecording(true);
                setTranscript("");
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.text) {
                        if (data.is_partial) {
                            setTranscript(prev => prev + " " + data.text); // Simple append
                        } else {
                            setTranscript(prev => prev + " " + data.text);
                        }
                    }
                } catch (e) { }
            };

            processor.current.onaudioprocess = (e) => {
                if (ws.current?.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const int16Data = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        int16Data[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                    }
                    ws.current.send(int16Data.buffer);
                }
            };
            source.current.connect(processor.current);
            processor.current.connect(audioContext.current.destination);
        } catch (e) {
            console.error(e);
            alert("Microphone access failed");
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        if (processor.current) { processor.current.disconnect(); processor.current = null; }
        if (source.current) { source.current.disconnect(); source.current = null; }
        if (audioContext.current) { audioContext.current.close(); audioContext.current = null; }
        if (ws.current) { ws.current.close(); ws.current = null; }
    };

    return (
        <Box maxWidth="1000px" mx="auto">
            <Typography variant="h4" gutterBottom>{t('stt.title')}</Typography>

            <Card variant="outlined" sx={{ mb: 4 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                        <Tab label={t('stt.tab_upload')} icon={<CloudUploadIcon />} iconPosition="start" />
                        <Tab label={t('stt.tab_mic')} icon={<MicIcon />} iconPosition="start" />
                    </Tabs>
                </Box>

                <CardContent>
                    {tab === 0 && (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                sx={{ mb: 2 }}
                            >
                                {file ? file.name : t('stt.select_file')}
                                <input type="file" hidden accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            </Button>
                            <Box>
                                <Button
                                    variant="contained"
                                    disabled={!file || loading}
                                    onClick={handleFileUpload}
                                >
                                    {loading ? <CircularProgress size={24} /> : t('stt.transcribe')}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {tab === 1 && (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Button
                                variant="contained"
                                color={isRecording ? "error" : "primary"}
                                startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                                onClick={isRecording ? stopRecording : startRecording}
                                sx={{ borderRadius: '50%', width: 80, height: 80 }}
                            >
                                {isRecording ? t('stt.record_stop') : t('stt.record_start')}
                            </Button>
                            <Typography sx={{ mt: 2 }} color={isRecording ? "error" : "textSecondary"}>
                                {isRecording ? t('stt.listening') : t('stt.click_start')}
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            <Paper elevation={0} variant="outlined" sx={{ p: 3, minHeight: 300, bgcolor: 'background.paper' }}>
                <Typography variant="h6" gutterBottom color="text.secondary">{t('stt.transcript')}</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {transcript || t('stt.transcript_placeholder')}
                </Typography>
            </Paper>
        </Box>
    );
}
