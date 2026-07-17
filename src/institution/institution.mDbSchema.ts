import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 * Institution (KA spoke — single row).
 *
 * The app serves exactly ONE institution (Kasr Al Ainy / Cairo University). Multi-tenancy
 * is gone: there is no per-institution routing, no DataSourceManager, no `institutionId` on
 * requests. This table is the single documented source of truth for the institution's
 * *feature variables* — `isAcademic` / `isPractical` / `isClinical` (which academic/practical/
 * clinical modules KA runs), plus its display name/code/department. Loaded once and cached by
 * `institution.service.ts`.
 *
 * The PK is kept identical to the historical `INSTITUTION_ID` (`550e8400-…`) so any in-flight
 * JWT that still carries a stale `institutionId` claim stays coherent. There is deliberately
 * NO per-tenant `database{}` block here — connections come from the one `AppDataSource`.
 */
@Entity("institutions")
export class InstitutionEntity {
  @PrimaryColumn({ type: "uuid" })
  id!: string;

  @Column({ type: "varchar", length: 100 })
  code!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  department!: string | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "boolean", default: true })
  isAcademic!: boolean;

  @Column({ type: "boolean", default: true })
  isPractical!: boolean;

  @Column({ type: "boolean", default: true })
  isClinical!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
