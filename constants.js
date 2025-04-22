const CORS_OPTIONS = {
  origin: '*', // Allow Angular client origin
  methods: ['GET', 'POST'], // Allow necessary methods
  credentials: true // Optional: if credentials are needed
}

const PTY_OPTIONS =
{
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: process.env.HOME,
  env: process.env
}

module.exports = {
  CORS_OPTIONS,
  PTY_OPTIONS
}

