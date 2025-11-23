import { Entity, PrimaryColumn, Column, Index, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'user_closure' })
@Index('idx_uc_ancestor_rootchild', ['ancestorId', 'rootChildId'])
@Index('idx_uc_ancestor_depth_descendant', ['ancestorId', 'depth', 'descendantId'])
@Index('idx_uc_descendant', ['descendantId'])
export class UserClosure {
  @PrimaryColumn({ type: 'int', name: 'ancestor_id', nullable: false })
  ancestorId!: number;

  @PrimaryColumn({ type: 'int', name: 'descendant_id', nullable: false })
  descendantId!: number;

  @Column({ type: 'int', nullable: false, default: 0 })
  depth!: number;

  @Column({ type: 'int', name: 'root_child_id', nullable: true })
  rootChildId?: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
