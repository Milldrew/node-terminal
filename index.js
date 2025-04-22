const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const pty = require('node-pty');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

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
  cors: {
    origin: '*', // Allow Angular client origin
    methods: ['GET', 'POST'], // Allow necessary methods
    credentials: true // Optional: if credentials are needed
  }
});

// Define log file path
const logFilePath = path.join(__dirname, 'connection.log');

// Function to format log entry for console and file
function formatLogEntry(socket, event = 'connection') {
  const clientIp = socket.handshake.address;
  const socketId = socket.id;
  const timestamp = new Date().toISOString();
  const userAgent = socket.handshake.headers['user-agent'] || 'Unknown';

  // Common log data
  const logData = {
    event,
    timestamp,
    clientIp,
    socketId,
    userAgent
  };

  // Console formatting with chalk
  const consoleLog = [
    chalk.blue(`[${timestamp}]`),
    event === 'connection' ? chalk.green('CONNECTION') : chalk.red('DISCONNECTION'),
    chalk.gray('IP:') + chalk.cyan(clientIp),
    chalk.gray('Socket:') + chalk.yellow(socketId),
    chalk.gray('UA:') + chalk.white(userAgent)
  ].join(' ');

  // File formatting (aligned, human-readable)
  const fileLog = [
    `Event: ${event.padEnd(12)}`,
    `Time: ${timestamp}`,
    `IP: ${clientIp.padEnd(15)}`,
    `Socket: ${socketId.padEnd(20)}`,
    `UA: ${userAgent}`
  ].join(' | ') + '\n';

  return {consoleLog, fileLog, logData};
}

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

const socketToPtySubProcess = {}

// Handle WebSocket connections
io.on('connection', (socket) => {


  // Log connection details
  logConnection(socket, 'connection');

  // Send terminal output to client
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });
  socket['socket'] = ptyProcess;
  console.log('===================================CONNECTIONS=================================')
  console.table(socketToPtySubProcess)
  ptyProcess.on('data', (data) => {
    socket.emit('terminalOutput', data);
  });

  // Handle input from client
  socket.on('terminalInput', (data) => {
    ptyProcess.write(data);
  });

  // Handle terminal resize from client
  socket.on('resize', ({cols, rows}) => {
    ptyProcess.resize(Math.max(cols || 80, 80), Math.max(rows || 30, 30));
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    logConnection(socket, 'disconnection');
  });

  // Handle terminal exit
  ptyProcess.on('exit', (code) => {
    socket.emit('terminalExit', {code});
    console.log(chalk.magenta(`Terminal exited with code ${code}`));
  });
});
io.on('disconnect', (socket) => {
  // Log disconnection details
  logConnection(socket, 'disconnection');
})

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(chalk.green(`Server running on http://localhost:${PORT}`));
});
