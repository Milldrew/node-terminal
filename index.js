const express = require('express');
const NEW_SOCKET_EVENT = 'new-socket';
const REMOVE_SOCKET_EVENT = 'remove-socket';
const http = require('http');
const {Server} = require('socket.io');
const pty = require('node-pty');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk').default;

const {formatLogEntry} = require('./functions.js');
const {CORS_OPTIONS, PTY_OPTIONS} = require('./constants.js');


// Set up Express and HTTP server
const app = express();
const server = http.createServer(app);


// =================================SERVE=BUNDLE================================
const PATH_TO_BUNDLE_DIR = path.join(__dirname, 'dist/browser');
//check if the directory exists
console.log(`Serving static files from ${PATH_TO_BUNDLE_DIR}`);
app.use('/app', express.static(PATH_TO_BUNDLE_DIR));
app.use('/app/*', express.static(PATH_TO_BUNDLE_DIR));

// Serve the index.html file


// Configure Socket.IO with CORS
const io = new Server(server, {
  cors: CORS_OPTIONS
});

// Define log file path
const logFilePath = path.join(__dirname, 'connection.log');

// Function to format log entry for console and file

// Function to log connection details
async function logConnection(socket, event = 'connection') {
  const {consoleLog, fileLog} = formatLogEntry(socket, event);

  // Log to console
  console.log(consoleLog);

  // Append to log file
  try {
    await fs.appendFile(logFilePath, fileLog);
  } catch (err) {
    console.error(chalk.red('Error writing to log file:'), err);
  }
}

// Serve a basic HTML page for testing (optional)
app.get('/', (req, res) => {
  res.send('WebSocket server running. Use a client to connect.');
});

// Create a zsh pseudo-terminal
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'zsh';
const ptyProcess = pty.spawn(shell, [], PTY_OPTIONS);


const socketIdToPtyChildDataListener = {

};
const socketIDtoSocket = {};

// Handle WebSocket connections
io.on('connection', (socket) => {
  socketIDtoSocket[socket.id] = socket;
  // Log connection details
  logConnection(socket, 'connection');


  // Handle input from client
  socket.on('terminalInput', (data) => {
    console.log(data)
    ptyProcess.write(data);
  });

  // Handle terminal resize from client
  socket.on('resize', ({cols, rows}) => {
    ptyProcess.resize(Math.max(cols || 80, 80), Math.max(rows || 30, 30));
  });

  // Handle client disconnect
  socket.on('disconnect', (reason) => {
    logConnection(socket, 'disconnection');
    console.log(chalk.yellow(`Client disconnected: ${socket.id} (${reason})`));
    // Remove the listener for this socket
    const terminalListener = socketIdToPtyChildDataListener[socket.id];
  });
});
ptyProcess.on('data', async (data) => {
  let sockets = await io.fetchSockets()

  console.log(data)
  sockets.forEach((socket) => {
    socket.emit('terminalOutput', data);
  });
});

//handle closed socket

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(chalk.green(`Server running on http://localhost:${PORT}`));
});
