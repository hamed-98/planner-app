import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from '@prisma/config';

// تابع کمکی خواندن متغیرها بدون وابستگی خارجی
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val.trim();
          }
        }
      });
    }
  }
}

loadEnv();

const dbUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  'postgresql://sayeban_user:sayeban_password123@localhost:5433/sayeban_db?schema=public';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
});