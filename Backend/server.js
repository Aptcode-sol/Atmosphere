const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connect } = require('./index');
const middleware = require('./middleware');
const routes = require('./routes');

const PORT = process.env.PORT || 4000;

async function start() {
    await connect();
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(morgan('dev'));
    app.use(middleware.requestLogger);

    app.get('/', (req, res) => {
        const uptime = process.uptime();
        const version = process.env.npm_package_version || '0.0.0';
        res.json({ status: 'ok', uptime, version });
    });

    app.use('/api', routes);

    app.use(middleware.notFound);
    app.use(middleware.errorHandler);

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

start().catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
});
