'use client';
import { useState, useEffect } from "react";
import {
    Box, Typography, Button, Card, CardContent,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, IconButton, Alert
} from "@mui/material";
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useRouter } from "next/navigation";

import { useTranslation } from "react-i18next";

export default function InterviewsPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploadOpen, setUploadOpen] = useState(false);

    const fetchInterviews = () => {
        setLoading(true);
        fetch("http://localhost:8000/v1/interviews")
            .then(res => res.json())
            .then(data => setRows(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchInterviews();
    }, []);

    const handleDelete = (id: number) => {
        if (!confirm(t('interviews.delete_confirm'))) return;
        fetch(`http://localhost:8000/v1/interviews/${id}`, { method: "DELETE" })
            .then(() => fetchInterviews());
    };

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'filename', headerName: t('interviews.table_filename'), width: 200 },
        { field: 'interviewee', headerName: t('interviews.table_interviewee'), width: 150 },
        { field: 'project_name', headerName: t('interviews.table_project'), width: 150 },
        {
            field: 'date', headerName: t('interviews.table_date'), width: 180,
            valueFormatter: (params: any) => {
                if (!params.value) return '';
                return new Date(params.value).toLocaleString();
            }
        },
        {
            field: 'status', headerName: t('interviews.table_status'), width: 120, renderCell: (params) => {
                const color = params.value === 'completed' ? 'success' : params.value === 'failed' ? 'error' : 'warning';
                const statusKey = `interviews.status_${params.value}`;
                return <Chip label={t(statusKey as any)} color={color} size="small" />;
            }
        },
        {
            field: 'actions', headerName: t('interviews.table_actions'), width: 150, renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <IconButton color="primary" onClick={() => router.push(`/interviews/${params.row.id}`)}>
                        <VisibilityIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(params.row.id as number)}>
                        <DeleteIcon />
                    </IconButton>
                </Box>
            )
        }
    ];

    return (
        <Box maxWidth="1200px" mx="auto">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">{t('interviews.title')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setUploadOpen(true)}
                >
                    {t('interviews.new_btn')}
                </Button>
            </Box>

            <Card variant="outlined" sx={{ height: 600 }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={loading}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    disableRowSelectionOnClick
                />
            </Card>

            <UploadDialog
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onSuccess={() => { setUploadOpen(false); fetchInterviews(); }}
            />
        </Box>
    );
}

function UploadDialog({ open, onClose, onSuccess }: { open: boolean, onClose: () => void, onSuccess: () => void }) {
    const { t } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [interviewee, setInterviewee] = useState("");
    const [project, setProject] = useState("");
    const [date, setDate] = useState("");
    const [uploading, setUploading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("interviewee", interviewee || "Unknown");
        formData.append("project_name", project || "Default Project");
        if (date) formData.append("date", date);

        try {
            const res = await fetch("http://localhost:8000/v1/interviews", {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                onSuccess();
            } else {
                alert("Upload failed");
            }
        } catch (e) {
            console.error(e);
            alert("Error: " + e);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{t('interviews.upload_title')}</DialogTitle>
            <DialogContent>
                <Button variant="outlined" component="label" fullWidth sx={{ mb: 2, mt: 1 }} startIcon={<CloudUploadIcon />}>
                    {file ? file.name : t('interviews.select_file')}
                    <input type="file" hidden accept="audio/*" onChange={e => setFile(e.target.files?.[0] || null)} />
                </Button>
                <TextField label={t('interviews.table_interviewee')} fullWidth margin="normal" value={interviewee} onChange={e => setInterviewee(e.target.value)} />
                <TextField label={t('interviews.table_project')} fullWidth margin="normal" value={project} onChange={e => setProject(e.target.value)} />
                <TextField type="date" label={t('interviews.table_date')} fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={date} onChange={e => setDate(e.target.value)} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('interviews.cancel')}</Button>
                <Button variant="contained" onClick={handleUpload} disabled={uploading || !file}>
                    {uploading ? t('interviews.uploading') : t('interviews.upload_transcribe')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
