import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'; 

// Defining the AboutEntity class to represent the "About" section in the database
@Entity('about')
export class AboutEntity {

  // Id column as primary key
  @PrimaryGeneratedColumn({ name: 'about_id', type: 'int' })
  aboutId: number;

  // Section title column of varchar type with character limit of 50 and not nullable
  @Column({ name: 'section', type: 'varchar', length: 50, nullable: false })
  section: string;

  // Section position column of decimal type with precision and scale, unique and default value of 0
  // Decimal always stored as string in the DB, so we use a transformer to convert to/from number
  @Column({
    name: 'section_position',
    type: 'decimal',
    precision: 20,
    scale: 10,
    unique: true,
    transformer: {
      to: (value: number) => value,           // to means from entity to DB. So it stores number as is in DB
      from: (value: string) => Number(value), // from means from DB to entity. So it converts string from DB to number
    },
  })
  sectionPosition: number;


  // Content text column of text type and not nullable
  @Column({ name: 'content_text', type: 'text', nullable: false })
  contentText: string;

  // Timestamps for record creation and last update
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}