
const chalk = require('chalk').default;
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


module.exports = {
  formatLogEntry
}
