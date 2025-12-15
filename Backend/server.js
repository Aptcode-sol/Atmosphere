const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const { connect } = require('./index');
const middleware = require('./middleware');
const routes = require('./routes');
const { initializeSocket } = require('./services/socketServer');

const PORT = process.env.PORT || 4000;

async function start() {
    await connect();
    const app = express();
    
    // Create HTTP server for both Express and Socket.IO
    const server = http.createServer(app);
    
    // Initialize Socket.IO with CORS
    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });
    
    // Initialize WebSocket handlers
    initializeSocket(io);
    
    // Make io available to routes if needed
    app.set('io', io);
    
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(morgan('dev'));
    app.use(middleware.requestLogger);

    app.use('/api', routes);

    app.use(middleware.notFound);
    app.use(middleware.errorHandler);

    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        console.log(`WebSocket server ready`);
    });
}

start().catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
});
