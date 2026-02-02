'use client';
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Box, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

interface WaveformVisualizerProps {
    audioUrl?: string | null;
    height?: number;
    color?: string;
}

export default function WaveformVisualizer({ audioUrl, height = 100, color = '#6750a4' }: WaveformVisualizerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurfer = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        wavesurfer.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: color,
            progressColor: '#d0bcff',
            cursorColor: '#ffffff',
            height: height,
            barWidth: 2,
            barGap: 3,
            url: audioUrl || undefined,
        });

        wavesurfer.current.on('play', () => setIsPlaying(true));
        wavesurfer.current.on('pause', () => setIsPlaying(false));
        wavesurfer.current.on('finish', () => setIsPlaying(false));

        return () => {
            wavesurfer.current?.destroy();
        };
    }, []);

    useEffect(() => {
        if (wavesurfer.current && audioUrl) {
            wavesurfer.current.load(audioUrl);
        }
    }, [audioUrl]);

    const togglePlay = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <IconButton onClick={togglePlay} color="primary" sx={{ bgcolor: 'secondary.container' }}>
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <Box ref={containerRef} sx={{ flexGrow: 1 }} />
        </Box>
    );
}
