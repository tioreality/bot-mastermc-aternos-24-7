// ============================================================
//   EstelarBot - Configuración de PM2 (proceso 24/7)
// ============================================================

module.exports = {
  apps: [
    {
      name: 'EstelarBot',
      script: 'dist/index.js',
      interpreter: 'node',
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 50,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
    },
  ],
};
