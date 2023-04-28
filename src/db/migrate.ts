import fs from 'fs';
import path from 'path';
import { query, disconnectDb } from '../config/database';
import logger from '../config/logger';

async function migrate(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');
    logger.info(`Running migration: ${file}`);
    await query(sql);
    logger.info(`Completed migration: ${file}`);
  }

  await disconnectDb();
  logger.info('All migrations complete');
}

migrate().catch((err) => {
  logger.error('Migration failed', { error: err.message });
  process.exit(1);
});
