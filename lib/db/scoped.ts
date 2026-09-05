// lib/db/scoped.ts
import { prisma } from './prisma';

export function getScopedDb(userId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, _model, _operation }: any) {
          return prisma.$transaction(async (tx) => {
            // مقیدسازی سشن روی موتور دیتابیس
            await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
            return query(args);
          });
        },
      },
    },
  });
}