require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/usersRoutes'));
app.use('/api/categories', require('./routes/categoriesRoutes'));
app.use('/api/ouvrages', require('./routes/ouvragesRoutes'));
app.use('/api/panier', require('./routes/panierRoutes'));
app.use('/api/commandes', require('./routes/commandesRoutes'));
app.use('/api/listes', require('./routes/listesRoutes'));
app.use('/api/commentaires', require('./routes/commentairesRoutes'));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
