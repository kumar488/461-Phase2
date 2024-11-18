import * as winston from 'winston';
import * as dotenv from 'dotenv';
dotenv.config();

// Get log level from environment variable (default to 'info')
const logLevel = process.env.LOG_LEVEL || '1';

// Get log file path from environment variable
const logFile = process.env.LOG_FILE;

const levels = {
  0: 'silent',
  1: 'info',
  2: 'debug',
};

// Create a Winston logger instance
const logger = winston.createLogger({
  level: levels[logLevel as unknown as keyof typeof levels],
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: logFile }),
  ]
});

export default logger;
