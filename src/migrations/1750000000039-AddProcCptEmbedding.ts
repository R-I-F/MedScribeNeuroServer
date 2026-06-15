import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProcCptEmbedding1750000000039 implements MigrationInterface {
  name = "AddProcCptEmbedding1750000000039";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    await queryRunner.query(
      `ALTER TABLE "proc_cpts" ADD COLUMN IF NOT EXISTS "embedding" vector(768)`
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_proc_cpts_embedding_hnsw"
         ON "proc_cpts" USING hnsw ("embedding" vector_cosine_ops)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_proc_cpts_embedding_hnsw"`);
    await queryRunner.query(`ALTER TABLE "proc_cpts" DROP COLUMN IF EXISTS "embedding"`);
  }
}
