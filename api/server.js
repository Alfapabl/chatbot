const { app } = require('@azure/functions');
const express = require('express');
const { WebSocketServer } = require('ws');

const serverApp = express();
const wss = new WebSocketServer({ noServer: true });

serverApp.use(express.json());

// POST endpoint to receive data
serverApp.post('/post-endpoint', (req, res) => {
    const data = req.body;
    console.log('Received data:', data);

    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });

    res.json({
        message: 'Data received successfully!',
        receivedData: data
    });
});

// Handle WebSocket upgrades
serverApp.server = serverApp.listen(3000, () => {
    console.log('Server is running on port 3000');
});

serverApp.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Export the Azure Function
module.exports = async function (context, req) {
    return new Promise((resolve, reject) => {
        serverApp(req, context.res, () => {
            resolve(context.res);
        });
    });
};
