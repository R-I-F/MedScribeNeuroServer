import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";
import { UserRole } from "../types/role.types";

export class CreatePasswordResetTokensTable1735000050003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get enum values for userRole
    const roleValues = Object.values(UserRole)
      .filter(role => ["candidate", "supervisor", "superAdmin", "instituteAdmin"].includes(role))
      .map(r => `'${r}'`)
      .join(',');

    await queryRunner.createTable(
      new Table({
        name: "password_reset_tokens",
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
            name: "userId",
            type: "char",
            length: "36",
            isNullable: false,
            comment: "UUID reference to user (candidate, supervisor, superAdmin, or instituteAdmin)",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "userRole",
            type: "enum",
            enum: ["candidate", "supervisor", "superAdmin", "instituteAdmin"],
            isNullable: false,
            comment: "Role of the user requesting password reset",
          },
          {
            name: "token",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
            comment: "Unique secure token for password reset",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "expiresAt",
            type: "datetime",
            isNullable: false,
            comment: "Token expiration timestamp",
          },
          {
            name: "used",
            type: "boolean",
            isNullable: false,
            default: false,
            comment: "Whether the token has been used",
          },
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            comment: "Token creation timestamp",
          },
          {
            name: "updatedAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
            comment: "Token last update timestamp",
          },
        ],
      }),
      true
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      "password_reset_tokens",
      new TableIndex({
        name: "IDX_password_reset_tokens_token",
        columnNames: ["token"],
        isUnique: true,
      })
    );

    await queryRunner.createIndex(
      "password_reset_tokens",
      new TableIndex({
        name: "IDX_password_reset_tokens_userId",
        columnNames: ["userId"],
      })
    );

    await queryRunner.createIndex(
      "password_reset_tokens",
      new TableIndex({
        name: "IDX_password_reset_tokens_expiresAt",
        columnNames: ["expiresAt"],
      })
    );

    // Composite index for finding valid tokens by user
    await queryRunner.createIndex(
      "password_reset_tokens",
      new TableIndex({
        name: "IDX_password_reset_tokens_userId_expiresAt_used",
        columnNames: ["userId", "expiresAt", "used"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex("password_reset_tokens", "IDX_password_reset_tokens_userId_expiresAt_used");
    await queryRunner.dropIndex("password_reset_tokens", "IDX_password_reset_tokens_expiresAt");
    await queryRunner.dropIndex("password_reset_tokens", "IDX_password_reset_tokens_userId");
    await queryRunner.dropIndex("password_reset_tokens", "IDX_password_reset_tokens_token");
    
    // Drop table
    await queryRunner.dropTable("password_reset_tokens");
  }
}
