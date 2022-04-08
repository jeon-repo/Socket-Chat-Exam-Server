import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://flexsys:1f2d3s4a@localhost:27017/wlm_chat',
    ),
  ],
})
export class MongodbModule {}
