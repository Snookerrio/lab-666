import express from 'express';
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';

const program = new Command();
program
    .requiredOption('-h, --host <host>', 'server host')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <cache>', 'cache directory path');

program.parse(process.argv);
const { host, port, cache } = program.opts();

if (!fs.existsSync(cache)) fs.mkdirSync(cache);

const app = express();
app.use(express.text());
app.use(express.json());

// Swagger docs
const swaggerDocument = YAML.load('swagger.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve upload form
app.get('/UploadForm.html', (req, res) => {
    res.sendFile(path.resolve('UploadForm.html'));
});

// GET /notes
app.get('/notes', (req, res) => {
    const files = fs.readdirSync(cache);
    const notes = files.map((file) => {
        const text = fs.readFileSync(path.join(cache, file), 'utf8');
        return { name: file, text };
    });
    res.json(notes);
});

// GET /notes/:name
app.get('/notes/:name', (req, res) => {
    const filePath = path.join(cache, req.params.name);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);
    const content = fs.readFileSync(filePath, 'utf8');
    res.send(content);
});

// PUT /notes/:name
app.put('/notes/:name', (req, res) => {
    const filePath = path.join(cache, req.params.name);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);
    fs.writeFileSync(filePath, req.body);
    res.sendStatus(200);
});

// DELETE /notes/:name
app.delete('/notes/:name', (req, res) => {
    const filePath = path.join(cache, req.params.name);
    if (!fs.existsSync(filePath)) return res.sendStatus(404);
    fs.unlinkSync(filePath);
    res.sendStatus(200);
});

// POST /write
const upload = multer();
app.post('/write', upload.none(), (req, res) => {
    const { note_name, note } = req.body;
    const filePath = path.join(cache, note_name);
    if (fs.existsSync(filePath)) return res.sendStatus(400);
    fs.writeFileSync(filePath, note);
    res.sendStatus(201);
});

app.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}`);
});
