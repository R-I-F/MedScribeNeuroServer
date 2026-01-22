import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { UserRole } from "../types/role.types";

export class CreateClerksTable1735000050002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const roleValues = Object.values(UserRole).map(r => `'${r}'`).join(',');

    await queryRunner.createTable(
      new Table({
        name: "clerks",
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
            name: "phoneNum",
            type: "varchar",
            length: "50",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
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
            default: `'${UserRole.CLERK}'`,
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
    await queryRunner.dropTable("clerks");
  }
}
