import winston from 'winston';
import config from './index';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'order-matching-engine' },
  transports: [
    new winston.transports.Console({
      format:
        config.server.env === 'development'
          ? winston.format.combine(winston.format.colorize(), winston.format.simple())
          : winston.format.json(),
    }),
  ],
});

if (config.server.env !== 'test') {
  logger.add(
    new winston.transports.File({ filename: 'logs/app.log', maxsize: 10_000_000, maxFiles: 5 })
  );
}

export default logger;

// prevent race condition in order matching - revision 20
