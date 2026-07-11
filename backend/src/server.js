require('dotenv').config();
const createContainer = require('./container');
const createApp = require('./interfaces/http/app');

const PORT = process.env.PORT || 4000;

async function start() {
  const container = createContainer();
  const app = createApp({ ...container, frontendDist: process.env.FRONTEND_DIST });
  try {
    await container.sequelize.authenticate();
    await container.sequelize.sync({ alter: true });
    app.listen(PORT, () => console.log(`PharmaStock API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }
}

start();
