import { Pool } from 'pg';
import { config } from './index';

const pool = new Pool({
    connectionString: config.databaseUrl,
});

export default pool;
