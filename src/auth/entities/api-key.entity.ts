import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'KIS' })
  provider: string;

  @Column({ type: 'text' })
  access_token: string;

  @Column({ type: 'timestamp' })
  expired_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}