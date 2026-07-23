import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the Active-Users signup cap (docs/ACTIVE_USERS_ANALYTICS_PLAN.md, Stage A4).
 * NULL = no cap (unlimited). When set, signups lock while the rolling quarterly
 * (trailing 3 months) distinct active-users count meets or exceeds it, and unlock
 * automatically when it falls below. The open/closed state is derived live, never stored.
 */
export class AddInstitutionMaxActiveUsers1783782610200
  implements MigrationInterface
{
  name = "AddInstitutionMaxActiveUsers1783782610200";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "institutions" ADD "maxActiveUsers" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "institutions" DROP COLUMN "maxActiveUsers"`
    );
  }
}
