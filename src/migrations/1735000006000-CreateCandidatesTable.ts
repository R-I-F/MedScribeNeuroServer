import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { Rank, RegDegree } from "../cand/cand.interface";
import { UserRole } from "../types/role.types";

export class CreateCandidatesTable1735000006000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get enum values as strings for SQL
    const rankValues = Object.values(Rank).map(r => `'${r}'`).join(',');
    const regDegreeValues = Object.values(RegDegree).map(r => `'${r}'`).join(',');
    const roleValues = Object.values(UserRole).map(r => `'${r}'`).join(',');

    await queryRunner.createTable(
      new Table({
        name: "candidates",
        columns: [
          {
            name: "id",
            type: "char",
            length: "36",
            isPrimary: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "timeStamp",
            type: "datetime",
            isNullable: true,
          },
          {
            name: "email",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "password",
            type: "varchar",
            length: "255",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "fullName",
            type: "varchar",
            length: "255",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "regNum",
            type: "varchar",
            length: "50",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "phoneNum",
            type: "varchar",
            length: "50",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "nationality",
            type: "varchar",
            length: "100",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "rank",
            type: "enum",
            enum: Object.values(Rank),
            isNullable: false,
          },
          {
            name: "regDeg",
            type: "enum",
            enum: Object.values(RegDegree),
            isNullable: false,
          },
          {
            name: "google_uid",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "approved",
            type: "boolean",
            isNullable: false,
            default: false,
          },
          {
            name: "role",
            type: "enum",
            enum: Object.values(UserRole),
            isNullable: false,
            default: `'${UserRole.CANDIDATE}'`,
          },
          {
            name: "termsAcceptedAt",
            type: "datetime",
            isNullable: true,
            comment: "Timestamp when user accepted Terms of Service",
          },
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("candidates");
  }
}
