require('dotenv').config();
if (!process.env.JWT_SECRET) { console.error('JWT_SECRET manquant dans .env'); process.exit(1); }
const app = require('./app');
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API démarrée sur http://localhost:${port}/api`));
