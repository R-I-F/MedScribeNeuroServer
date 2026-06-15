import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

function getStagingMigrationsConfig(): DataSourceOptions {
  const sslCaPath = process.env.SSL_CA_PATH;
  const sslOpts =
    sslCaPath && fs.existsSync(path.resolve(process.cwd(), sslCaPath))
      ? {
          ssl: {
            ca: fs.readFileSync(path.resolve(process.cwd(), sslCaPath), "utf8"),
            rejectUnauthorized: true,
          },
        }
      : {};

  return {
    type: "postgres",
    host: process.env.PSQL_HOST_DEFAULT!,
    port: parseInt(process.env.PSQL_PORT_DEFAULT || "5432", 10),
    username: process.env.PSQL_USERNAME_DEFAULT!,
    password: process.env.PSQL_PASSWORD_DEFAULT!,
    database: process.env.PSQL_DB_NAME_DEFAULT || "defaultdb",
    synchronize: false,
    logging: ["error", "warn", "migration"],
    entities: [],
    migrations: [
      __dirname + "/../migrations/1750000000001-CreateDepartmentsTable.ts",
      __dirname + "/../migrations/1750000000002-CreateMainDiagsTable.ts",
      __dirname + "/../migrations/1750000000003-CreateDiagnosesTable.ts",
      __dirname + "/../migrations/1750000000004-FixDiagnosesArabic.ts",
      __dirname + "/../migrations/1750000000005-CreateDeptDiagnosesTable.ts",
      __dirname + "/../migrations/1750000000006-FixBrainTerminology.ts",
      __dirname + "/../migrations/1750000000007-CreateMainDiagDiagnosesTable.ts",
      __dirname + "/../migrations/1750000000008-FixUrologyCode.ts",
      __dirname + "/../migrations/1750000000009-FixGA10AndBPH.ts",
      __dirname + "/../migrations/1750000000010-AddDiagnosisEmbeddings.ts",
      __dirname + "/../migrations/1750000000011-AddNeurosurgeryHighVolumeDiagnoses.ts",
      __dirname + "/../migrations/1750000000012-FillGeneralSurgeryCoverage.ts",
      __dirname + "/../migrations/1750000000013-FillHepatobiliaryCoverage.ts",
      __dirname + "/../migrations/1750000000014-FillMaxillofacialCoverage.ts",
      __dirname + "/../migrations/1750000000015-FillObgynCoverage.ts",
      __dirname + "/../migrations/1750000000016-FillOphthalmologyCoverage.ts",
      __dirname + "/../migrations/1750000000017-FillOrthopedicsCoverage.ts",
      __dirname + "/../migrations/1750000000018-FillEntCoverage.ts",
      __dirname + "/../migrations/1750000000019-FillPlasticsCoverage.ts",
      __dirname + "/../migrations/1750000000020-FillSurgicalOncologyCoverage.ts",
      __dirname + "/../migrations/1750000000021-FillTransplantCoverage.ts",
      __dirname + "/../migrations/1750000000022-FillUrologyCoverage.ts",
      __dirname + "/../migrations/1750000000023-FillVascularCoverage.ts",
      __dirname + "/../migrations/1750000000024-FixMismappedIcdCodes.ts",
      __dirname + "/../migrations/1750000000025-StrengthenHbpThin.ts",
      __dirname + "/../migrations/1750000000026-FixAuditedMismapsBatch1.ts",
      __dirname + "/../migrations/1750000000027-RemodelCardiovascularCodes.ts",
      __dirname + "/../migrations/1750000000028-StrengthenEntThin.ts",
      __dirname + "/../migrations/1750000000029-StrengthenOphthalmologyThin.ts",
      __dirname + "/../migrations/1750000000030-StrengthenOrthoThin.ts",
      __dirname + "/../migrations/1750000000031-StrengthenSocUrolThin.ts",
      __dirname + "/../migrations/1750000000032-StrengthenPedsurgThin.ts",
      __dirname + "/../migrations/1750000000033-StrengthenGsPrsThin.ts",
      __dirname + "/../migrations/1750000000034-FixVascAvfMismapAndStrengthenRemaining.ts",
      __dirname + "/../migrations/1750000000035-FixAuditedMismapsBatch2.ts",
      __dirname + "/../migrations/1750000000036-FixGsBiliaryRecodes.ts",
      __dirname + "/../migrations/1750000000037-CreateProcCptsTable.ts",
      __dirname + "/../migrations/1750000000038-CreateMainDiagProcsTable.ts",
      __dirname + "/../migrations/1750000000039-AddProcCptEmbedding.ts",
      __dirname + "/../migrations/1750000000040-ImportNsProcCpts.ts",
      __dirname + "/../migrations/1750000000041-LinkNsProcCptsToMainDiags.ts",
      __dirname + "/../migrations/1750000000042-FixProcCptCasingDuplicates.ts",
      __dirname + "/../migrations/1750000000043-FixCptCodeMismatches.ts",
      __dirname + "/../migrations/1750000000044-ResolvePartialCptMatches.ts",
    ],
    subscribers: [],
    extra: { max: 5 },
    ...sslOpts,
  };
}

export const StagingMigrationsDataSource = new DataSource(getStagingMigrationsConfig());
