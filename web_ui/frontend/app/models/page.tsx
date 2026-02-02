'use client';
import { useState, useEffect } from "react";
import {
    Box, Typography, Button, TextField, Card, CardContent,
    Table, TableBody, TableCell, TableHead, TableRow, Chip,
    Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl
} from "@mui/material";
import BoltIcon from '@mui/icons-material/Bolt';
import { useTranslation } from "react-i18next";

export default function ModelsPage() {
    const { t } = useTranslation();
    const [loadedModels, setLoadedModels] = useState<any[]>([]);
    const [quantizeOpen, setQuantizeOpen] = useState(false);

    useEffect(() => {
        fetch('http://localhost:8000/v1/models')
            .then(res => res.json())
            .then(data => setLoadedModels(data))
            .catch(e => console.error(e));
    }, []);

    return (
        <Box maxWidth="1000px" mx="auto">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">{t('models.title')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<BoltIcon />}
                    onClick={() => setQuantizeOpen(true)}
                >
                    {t('models.quantize_btn')}
                </Button>
            </Box>

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>{t('models.loaded_title')}</Typography>
                    {loadedModels.length === 0 ? (
                        <Typography color="text.secondary">{t('models.no_models')}</Typography>
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('models.table_id')}</TableCell>
                                    <TableCell>{t('models.table_status')}</TableCell>
                                    <TableCell align="right">{t('models.table_action')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loadedModels.map((m) => (
                                    <TableRow key={m.id}>
                                        <TableCell>{m.id}</TableCell>
                                        <TableCell><Chip label={t('models.loaded')} color="success" size="small" /></TableCell>
                                        <TableCell align="right">
                                            <Button
                                                color="error"
                                                size="small"
                                                onClick={() => {
                                                    fetch(`http://localhost:8000/v1/models/${encodeURIComponent(m.id)}`, { method: 'DELETE' })
                                                        .then(() => window.location.reload());
                                                }}
                                            >
                                                {t('models.unload')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <QuantizeDialog open={quantizeOpen} onClose={() => setQuantizeOpen(false)} />
        </Box>
    );
}

function QuantizeDialog({ open, onClose }: { open: boolean, onClose: () => void }) {
    const { t } = useTranslation();
    const [hfPath, setHfPath] = useState("");
    const [qBits, setQBits] = useState(4);
    const [loading, setLoading] = useState(false);

    const handleQuantize = async () => {
        setLoading(true);
        try {
            await fetch('http://localhost:8000/v1/models/quantize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hf_path: hfPath,
                    q_bits: qBits
                })
            });
            alert("Quantization started in background!");
            onClose();
        } catch (e) {
            alert("Error: " + e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t('models.quant_dialog_title')}</DialogTitle>
            <DialogContent>
                <TextField
                    label={t('models.hf_repo')}
                    fullWidth
                    margin="normal"
                    value={hfPath}
                    onChange={(e) => setHfPath(e.target.value)}
                    helperText="e.g. prince-canuma/Kokoro-82M"
                />
                <FormControl fullWidth margin="normal">
                    <InputLabel>{t('models.quant_bits')}</InputLabel>
                    <Select
                        value={qBits}
                        label={t('models.quant_bits')}
                        onChange={(e) => setQBits(Number(e.target.value))}
                    >
                        <MenuItem value={4}>4-bit</MenuItem>
                        <MenuItem value={8}>8-bit</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('models.cancel')}</Button>
                <Button variant="contained" onClick={handleQuantize} disabled={loading}>
                    {loading ? t('models.starting') : t('models.start_conversion')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
