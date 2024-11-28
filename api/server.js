import express from 'express';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());

// POST endpoint to receive data
app.post('/post-endpoint', (req, res) => {
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


const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
    console.log('WebSocket connection established.');
    
    ws.on('message', (message) => {
        console.log('Received from client:', message);
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed.');
    });
});


const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
