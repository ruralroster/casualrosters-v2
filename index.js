const express = require('express');
const app = express();
app.use(express.json());

console.log('App starting...');

// Health check - responds immediately, no auth needed
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Rural Rosters API' });
});

// Simple test endpoint
app.post('/', (req, res) => {
  const { action } = req.body;
  console.log('Action received:', action);
  res.status(200).json({ received: action, status: 'working' });
});

const PORT = process.env.PORT || 8080;

try {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} catch (err) {
  console.error('Failed to start:', err);
  process.exit(1);
}
