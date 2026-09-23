import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });

export async function sendChat(question, history = [], topK = 5) {
  const { data } = await api.post('/chat', { question, history, top_k: topK });
  return data;
}

export async function uploadFile(file, onProgress) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/ingest/file', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  });
  return data;
}

export async function ingestText(text, sourceName) {
  const { data } = await api.post('/ingest/text', { text, source_name: sourceName });
  return data;
}

export async function getSources() {
  const { data } = await api.get('/sources');
  return data.sources;
}

export async function deleteSource(name) {
  const { data } = await api.delete(`/sources/${encodeURIComponent(name)}`);
  return data;
}

export async function getHealth() {
  const { data } = await api.get('/health');
  return data;
}
