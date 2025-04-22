// client.js
const io = require('socket.io-client');
const readline = require('readline');

// Connect to the WebSocket server
const socket = io('http://localhost:3000');

// Set up readline interface for terminal input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to server');

  // Send terminal input from stdin
  rl.on('line', (input) => {
    socket.emit('terminalInput', input + '\n');
  });

  // Optionally send initial resize
  socket.emit('resize', {cols: 80, rows: 30});
});

// Handle terminal output from server
socket.on('terminalOutput', (data) => {
  process.stdout.write(data);
});

// Handle terminal exit
socket.on('terminalExit', ({code}) => {
  console.log(`Terminal exited with code ${code}`);
  socket.disconnect();
  rl.close();
  process.exit();
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from server');
  rl.close();
  process.exit();
});
