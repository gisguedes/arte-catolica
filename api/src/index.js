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
const authRouter = require('./routes/auth');
const ordersRouter = require('./routes/orders');
const addressesRouter = require('./routes/addresses');
const paymentMethodsRouter = require('./routes/payment-methods');
const cartRouter = require('./routes/cart');

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

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
app.use('/api/orders', ordersRouter);
app.use('/api/addresses', addressesRouter);
app.use('/api/payment-methods', paymentMethodsRouter);
app.use('/api/cart', cartRouter);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});



