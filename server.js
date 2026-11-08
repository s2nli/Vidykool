
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const TARGET = "https://vidyakool.streamfiles.eu.org";
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0';

// Proxy for /api/*.php
app.all('/api/*', async (req, res) => {
    try {
        const response = await axios({
            method: req.method,
            url: `${TARGET}${req.originalUrl}`,
            data: req.body,
            headers: { 'User-Agent': UA, 'Referer': TARGET, 'Origin': TARGET,
                       'Content-Type': req.headers['content-type'] || 'application/json' },
            timeout: 20000,
            validateStatus: () => true
        });
        const ct = response.headers['content-type'] || '';
        if (ct.includes('json') || typeof response.data === 'object') {
            res.status(response.status).json(response.data);
        } else {
            res.status(response.status).send(response.data);
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Proxy for /play.php
app.all('/play.php', async (req, res) => {
    try {
        const response = await axios({
            method: req.method,
            url: `${TARGET}${req.originalUrl}`,
            data: req.body,
            headers: { 'User-Agent': UA, 'Referer': TARGET, 'Origin': TARGET,
                       'Content-Type': req.headers['content-type'] || 'application/json' },
            timeout: 20000,
            validateStatus: () => true,
            maxRedirects: 5
        });
        const ct = response.headers['content-type'] || '';
        if (ct.includes('json')) {
            res.status(response.status).json(response.data);
        } else if (ct.includes('html')) {
            res.status(response.status).send(response.data);
        } else {
            res.status(response.status).send(response.data);
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Static + SPA fallback
app.get('*', (req, res) => {
    const reqPath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(reqPath) && fs.statSync(reqPath).isFile()) {
        return res.sendFile(reqPath);
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Live on ' + PORT));
