const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connect } = require('./index');
const middleware = require('./middleware');
const routes = require('./routes');
const startupRoutes = require('./routes/startup');
const opportunitiesRouter = require('./routes/opportunities');

const PORT = process.env.PORT || 4000;

async function start() {
    await connect();
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(morgan('dev'));
    app.use(middleware.requestLogger);

    app.use('/api', routes);
    app.use('/api/startup', startupRoutes);
    app.use('/api/opportunities', opportunitiesRouter);

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
