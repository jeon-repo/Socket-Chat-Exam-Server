import { Module } from '@nestjs/common';
import { ChatBackEndModule } from './chatBackEnd/chatBackEnd.module';
import { MongodbModule } from './mongodb/mongodb.module';

@Module({
  imports: [ChatBackEndModule, MongodbModule],
})
export class AppModule {}
