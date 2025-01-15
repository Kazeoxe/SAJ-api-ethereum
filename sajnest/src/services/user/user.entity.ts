import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({ unique: true})
  email: string;

  @Column()
  password: string;

  @Column({default: false})
  enabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  wallet: string;
}