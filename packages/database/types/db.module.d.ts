import { OnModuleDestroy } from '@nestjs/common';
export declare class DbModule implements OnModuleDestroy {
    onModuleDestroy(): Promise<void>;
}
