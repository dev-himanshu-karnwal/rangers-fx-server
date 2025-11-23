import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserClosure } from './entities/closure.entity';

@Injectable()
export class UserClosureService {
  constructor(
    @InjectRepository(UserClosure)
    private readonly userClosureRepository: Repository<UserClosure>,
  ) {}

  /**
   * Create a single user closure entry (ancestor -> descendant).
   * This expects the complete data for one user closure row.
   * Will throw ConflictException if the PK (ancestor, descendant) already exists.
   */
  async createUserClosureEntry(entry: UserClosure): Promise<UserClosure> {
    const { ancestorId, descendantId } = entry;

    // basic validation
    if (!ancestorId || !descendantId) {
      throw new BadRequestException('ancestorId and descendantId are required');
    }

    // check existing
    const existing = await this.userClosureRepository.findOne({
      where: { ancestorId, descendantId },
    });
    if (existing) {
      throw new ConflictException(`User closure entry (${ancestorId} -> ${descendantId}) already exists`);
    }

    const entity = this.userClosureRepository.create(entry);
    return this.userClosureRepository.save(entity);
  }

  /**
   * Create all user closure rows for a newly inserted user node.
   *
   * Behaviour:
   * - Always creates the self row: (userId, userId, depth = 0)
   * - If parentId is provided (not null), it fetches all closure rows where descendant = parentId
   *   and creates rows for each ancestor -> newUser with depth = parentDepth + 1.
   *
   * Important notes:
   * - This method uses only repository queries (no raw SQL).
   * - It assumes existing user closure rows for the parent exist (i.e., the parent's ancestor chain is present).
   * - rootChildId for the new rows is set using this logic:
   *     - when parentRow.depth === 0 (i.e. ancestor == parent), rootChildId := parentId
   *     - otherwise, rootChildId := parentRow.rootChildId (so we propagate the parent's root_child mapping)
   */
  async createClosuresForUser(userId: number, parentId?: number | null): Promise<UserClosure[]> {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    // 1) create self row (depth = 0)
    const selfRow = this.userClosureRepository.create({
      ancestorId: userId,
      descendantId: userId,
      depth: 0,
      rootChildId: null,
    });

    const rowsToSave: UserClosure[] = [selfRow];

    // 2) if parentId provided, load all parent's ancestor rows and create new rows for each ancestor
    if (parentId) {
      // fetch all closure rows where descendant = parentId (the parent's ancestor chain)
      const parentAncestors: Pick<UserClosure, 'ancestorId' | 'depth' | 'rootChildId'>[] =
        await this.userClosureRepository.find({
          where: { descendantId: parentId },
          select: ['ancestorId', 'depth', 'rootChildId'],
        });

      if (!parentAncestors || parentAncestors.length === 0) {
        // if parent has no closure rows, that's unexpected if you rely on closure table for parent
        // but still we can create the single parent -> child link
        // create (parent -> user) with depth = 1 and rootChildId = user (or null? we set to user)
        const fallback = this.userClosureRepository.create({
          ancestorId: parentId,
          descendantId: userId,
          depth: 1,
          rootChildId: userId, // immediate child under parent is the new user
        });
        rowsToSave.push(fallback);
      } else {
        // For each ancestor row of parent, create a row for that ancestor -> new user.
        for (const pa of parentAncestors) {
          // pa: ancestor = pa.ancestorId, descendant = parentId, pa.depth
          // new depth is pa.depth + 1
          // decide rootChildId:
          //  - if pa.depth === 0 (pa.ancestorId === parentId), rootChildId := parentId
          //  - else propagate pa.rootChildId (so that ancestor's root child remains correct)
          const newRootChildId = pa.depth === 0 ? parentId : (pa.rootChildId ?? null);

          const newRow = this.userClosureRepository.create({
            ancestorId: pa.ancestorId,
            descendantId: userId,
            depth: pa.depth + 1,
            rootChildId: newRootChildId,
          });
          rowsToSave.push(newRow);
        }
      }
    }

    // 3) Save all rows in one operation (TypeORM will batch).
    // If any PK conflict occurs, save() will throw; caller should handle/propagate.
    return this.userClosureRepository.save(rowsToSave);
  }

  /**
   * Get all descendants of a user (including self row).
   * Returns array of UserClosure entries ordered by depth ascending (self -> children -> grandchildren ...)
   */
  async getAllDescendentsOfUser(userId: number): Promise<UserClosure[]> {
    if (!userId) throw new BadRequestException('userId is required');

    return this.userClosureRepository.find({
      where: { ancestorId: userId },
      order: { depth: 'ASC', descendantId: 'ASC' },
    });
  }

  /**
   * Get all ancestors of a user (including self row).
   * Returns array of UserClosure entries ordered by depth ascending
   * Note: depth here is distance from ancestor -> descendant (so ancestor depth increases as you go up)
   */
  async getAllAscendentsOfUser(userId: number): Promise<UserClosure[]> {
    if (!userId) throw new BadRequestException('userId is required');

    return this.userClosureRepository.find({
      where: { descendantId: userId },
      order: { depth: 'ASC', ancestorId: 'ASC' },
    });
  }

  /**
   * Get all direct descendants (immediate children only) of a user.
   * Returns UserClosure rows where ancestor = userId and depth = 1
   */
  async getAllDirectDescendentsOfUser(userId: number): Promise<UserClosure[]> {
    if (!userId) throw new BadRequestException('userId is required');

    return this.userClosureRepository.find({
      where: { ancestorId: userId, depth: 1 },
      order: { descendantId: 'ASC' },
    });
  }

  /**
   * Helper: find one by PK. Kept for internal use / backwards compatibility.
   */
  private async findOne(ancestorId: number, descendantId: number): Promise<UserClosure | null> {
    return this.userClosureRepository.findOne({ where: { ancestorId, descendantId } });
  }
}
