const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();

app.use(cors());
app.use(express.json());

// Configurar pasta de uploads para ser acessível publicamente
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API
app.use(routes); 