import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { db, closeDb } from '@castlyo/database';

@Global()
@Module({
  providers: [{ provide: 'DB', useValue: db }],
  exports: ['DB'],
})
export class DbModule implements OnModuleDestroy {
  async onModuleDestroy() {
    await closeDb();
  }
}
