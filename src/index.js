require('dotenv').config();

const express = require('express');
const cors = require('cors');
const asyncify = require('express-asyncify');
const jwtMiddleware = require('./middlewares/jwt.middleware');

const app = asyncify(express());

// ==> Rotas da API
const index = require('./routes/index');

const exclusions = ['/api/autenticacao'];

const origin = process.env.LOCAL ? 'http://localhost:3000' : 'https://www.jubo-solucoes.com.br';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.json({ type: 'application/vnd.api+json' }));
app.use(cors({ origin }));
app.use(jwtMiddleware({ exclusions }));

app.use('/api/', index);

module.exports = app;
