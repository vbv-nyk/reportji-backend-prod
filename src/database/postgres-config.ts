import pg from 'pg'
import {config} from 'dotenv'
config({ path: `.env.${process.env.CURRENT_MODE}` });
const {Pool} = pg


export const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
});

