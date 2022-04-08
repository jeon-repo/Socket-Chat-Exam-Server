import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ChatDocument = Chat & Document;

@Schema()
export class Chat {
  @Prop()
  id: number;

  @Prop({ required: true })
  chat_id: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
