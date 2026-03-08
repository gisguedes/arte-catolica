const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

const productsRouter = require('./routes/products');
const vendorsRouter = require('./routes/vendors');
const categoriesRouter = require('./routes/categories');
const materialsRouter = require('./routes/materials');
const colorsRouter = require('./routes/colors');
const artistTypesRouter = require('./routes/artist-types');
const techniquesRouter = require('./routes/techniques');
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const addressesRouter = require('./routes/addresses');
const vendorAddressesRouter = require('./routes/vendor-addresses');
const paymentMethodsRouter = require('./routes/payment-methods');
const cartRouter = require('./routes/cart');
const favoritesRouter = require('./routes/favorites');

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(morgan('dev'));
// Límite 10MB para permitir avatares en base64 (por defecto 100KB)
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use('/api', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/artists', vendorsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/colors', colorsRouter);
app.use('/api/artist-types', artistTypesRouter);
app.use('/api/techniques', techniquesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/vendor-addresses', vendorAddressesRouter);
app.use('/api/payment-methods', paymentMethodsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/favorites', favoritesRouter);

// Manejador global de errores: evita filtrar base64 u otros datos sensibles
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({ message: 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});






