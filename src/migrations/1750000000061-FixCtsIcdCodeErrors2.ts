import { MigrationInterface, QueryRunner } from "typeorm";

// 22 ICD-11 code corrections found during CTS audit (mig-057 codes + pre-existing BC43.x).
// All confirmed via findacode.com on 2026-06-16.
//
// Key discoveries:
//  - BC43 codes were off-by-one since initial migrations:
//      BC43.0=Dilated, BC43.1=HCM, BC43.2=Restrictive, BC43.3=Endocardial fibroelastosis,
//      BC43.4=Drug-induced CMP, BC43.6=ARVC (BC43.5=Stress/Takotsubo)
//  - 1B range = Infectious/Parasitic diseases; rheumatic valve codes belong in BB range
//  - BB83 = Tricuspid valvular abscess; BB24 = Haemopericardium
//  - CB24 = Chylous effusion (not pneumothorax); CB25 = Fibrothorax; CB21.0 = spontaneous tension PTX
//  - BD50.4 = Abdominal AA (not thoracoabdominal); BD50.5Z = thoracoabdominal unspecified
//  - BD10 = Heart failure block; post-MI complications are BA60.x
//  - BD11 = Left ventricular failure; BD13 = Right ventricular failure
//  - LA89.1 = Tricuspid atresia (not LA89.0); LA86.20/21 = TAPVR/PAPVR (not LA93.x); LA89.3 = HLHS

export class FixCtsIcdCodeErrors21750000000061 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── BC43 CASCADE: codes off by one since initial migrations ─────────────
    // Must execute in this exact order to avoid unique-key conflicts.

    // Step 1: BC43.1 "dilated" → BC43.0 (correct ICD-11 code for DCM)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"       = 'BC43.0',
        "icdName"       = 'Dilated cardiomyopathy',
        "icdArName"     = 'اعتلال عضلة القلب التوسعي',
        "embedding"     = NULL
      WHERE "icdCode" = 'BC43.1'
    `);

    // Step 2: BC43.2 "hypertrophic" → BC43.1 (correct ICD-11 code for HCM; BC43.1 now free)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"       = 'BC43.1',
        "icdName"       = 'Hypertrophic cardiomyopathy',
        "icdArName"     = 'اعتلال عضلة القلب الضخامي',
        "embedding"     = NULL
      WHERE "icdCode" = 'BC43.2'
    `);

    // Step 3: BC43.3 "restrictive" → BC43.2 (correct ICD-11 code for RCM; BC43.2 now free)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BC43.2',
        "embedding" = NULL
      WHERE "icdCode" = 'BC43.3'
    `);

    // Step 4: BC43.4 "ARVC" → BC43.6 (correct ICD-11 code for ARVC; BC43.4 = drug-induced CMP)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"       = 'BC43.6',
        "icdName"       = 'Arrhythmogenic ventricular cardiomyopathy',
        "icdArName"     = 'اعتلال عضلة القلب البطيني اللانظمي',
        "embedding"     = NULL
      WHERE "icdCode" = 'BC43.4'
    `);

    // ── RHEUMATIC VALVE CODES (1B = Infectious diseases — wrong chapter) ────

    // 1B11.0 → BB70.0 (Rheumatic aortic valve stenosis)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'BB70.0', "embedding" = NULL
      WHERE "icdCode" = '1B11.0'
    `);

    // 1B11.1 → BB71.0 (Rheumatic aortic valve insufficiency)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'BB71.0', "embedding" = NULL
      WHERE "icdCode" = '1B11.1'
    `);

    // 1B12.Z → BB82.0 (Rheumatic tricuspid stenosis with insufficiency — most surgical form)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BB82.0',
        "icdName"   = 'Rheumatic tricuspid valve stenosis with insufficiency',
        "icdArName" = 'تضيق وقلس الصمام ثلاثي الشرفات الروماتيزمي',
        "embedding" = NULL
      WHERE "icdCode" = '1B12.Z'
    `);

    // 1B13.Z → BC20.1 (Rheumatic heart disease, unspecified — ICD-11 multi-valve)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BC20.1',
        "icdName"   = 'Rheumatic heart disease, unspecified',
        "icdArName" = 'مرض القلب الروماتيزمي - غير محدد',
        "embedding" = NULL
      WHERE "icdCode" = '1B13.Z'
    `);

    // ── MITRAL VALVE ─────────────────────────────────────────────────────────

    // BB63.2 → BB62.Z (Mitral valve prolapse, unspecified; BB63 = stenosis+insufficiency block)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BB62.Z',
        "icdName"   = 'Mitral valve prolapse, unspecified',
        "icdArName" = 'هبوط الصمام التاجي - غير محدد',
        "embedding" = NULL
      WHERE "icdCode" = 'BB63.2'
    `);

    // ── ARRHYTHMIA ────────────────────────────────────────────────────────────

    // BC53 → BC80.20 (Sick sinus syndrome; BC53 does not exist in ICD-11)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'BC80.20', "embedding" = NULL
      WHERE "icdCode" = 'BC53'
    `);

    // ── CAD COMPLICATIONS (BD10 = Heart failure, not MI complications) ───────

    // BD10.2 → BA60.3 (Ventricular septal defect as current complication following acute MI)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BA60.3',
        "icdName"   = 'Ventricular septal defect as current complication following acute myocardial infarction',
        "icdArName" = 'عيب الحاجز البطيني كمضاعفة حالية تلو احتشاء عضلة القلب الحاد',
        "embedding" = NULL
      WHERE "icdCode" = 'BD10.2'
    `);

    // BD10.3 → BA60.2 (Ventricular aneurysm as current complication following acute MI)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BA60.2',
        "icdName"   = 'Ventricular aneurysm as current complication following acute myocardial infarction',
        "icdArName" = 'أم دم البطين كمضاعفة حالية تلو احتشاء عضلة القلب الحاد',
        "embedding" = NULL
      WHERE "icdCode" = 'BD10.3'
    `);

    // ── HEART FAILURE (BD11 = Left ventricular failure, BD13 = Right) ────────

    // BD11.1 → BD13 (Right ventricular failure; BD11.1 does not exist — BD11 = LVF block)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'BD13', "embedding" = NULL
      WHERE "icdCode" = 'BD11.1'
    `);

    // ── PERICARDIAL (BB83 = Tricuspid valvular abscess, not haemopericardium) ─

    // BB83 → BB24 (Haemopericardium)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'BB24', "embedding" = NULL
      WHERE "icdCode" = 'BB83'
    `);

    // ── CONGENITAL CYANOTIC ───────────────────────────────────────────────────

    // LA89.0 → LA89.1 (Tricuspid atresia; LA89.1 confirmed on findacode)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'LA89.1', "embedding" = NULL
      WHERE "icdCode" = 'LA89.0'
    `);

    // LA93.0 → LA86.21 (Partial anomalous pulmonary venous connection; LA86.21 confirmed)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'LA86.21', "embedding" = NULL
      WHERE "icdCode" = 'LA93.0'
    `);

    // LA93.1 → LA86.20 (Total anomalous pulmonary venous connection; LA86.20 confirmed)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'LA86.20', "embedding" = NULL
      WHERE "icdCode" = 'LA93.1'
    `);

    // LA8F → LA89.3 (Hypoplastic left heart syndrome; confirmed in prior session)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'LA89.3', "embedding" = NULL
      WHERE "icdCode" = 'LA8F'
    `);

    // ── AORTIC ANEURYSM (BD50.4 = Abdominal AA, not thoracoabdominal) ────────

    // BD50.4 → BD50.5Z (Thoracoabdominal aortic aneurysm, unspecified)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BD50.5Z',
        "icdName"   = 'Thoracoabdominal aortic aneurysm, unspecified',
        "icdArName" = 'أم دم الأبهر الصدري البطني - غير محدد',
        "embedding" = NULL
      WHERE "icdCode" = 'BD50.4'
    `);

    // ── PLEURAL / PNEUMOTHORAX ────────────────────────────────────────────────

    // CB24.2 → CB21.0 (Spontaneous tension pneumothorax; CB24 = Chylous effusion block)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'CB21.0',
        "icdName"   = 'Spontaneous tension pneumothorax',
        "icdArName" = 'استرواح الصدر التوتري التلقائي',
        "embedding" = NULL
      WHERE "icdCode" = 'CB24.2'
    `);

    // CB28.Z → CB25 (Fibrothorax; CB25 confirmed as fibrothorax; CB28 is a different entity)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'CB25',
        "icdName"   = 'Fibrothorax',
        "icdArName" = 'الصدر الليفي',
        "embedding" = NULL
      WHERE "icdCode" = 'CB28.Z'
    `);

    // NB32.1 → NB32.0 (Traumatic pneumothorax; NB32.1 = traumatic haemothorax, NB32.0 = PTX)
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode" = 'NB32.0', "embedding" = NULL
      WHERE "icdCode" = 'NB32.1'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse in reverse order; BC43 cascade must also reverse in reverse order.

    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='NB32.1',"embedding"=NULL WHERE "icdCode"='NB32.0'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='CB28.Z',"icdName"='Fibrothorax - unspecified',"icdArName"='الصدر الليفي - غير محدد',"embedding"=NULL WHERE "icdCode"='CB25'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='CB24.2',"icdName"='Tension pneumothorax',"icdArName"='استرواح الصدر الضاغط',"embedding"=NULL WHERE "icdCode"='CB21.0'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BD50.4',"icdName"='Thoracoabdominal aortic aneurysm',"icdArName"='أم دم الأبهر الصدري البطني',"embedding"=NULL WHERE "icdCode"='BD50.5Z'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='LA8F',"embedding"=NULL WHERE "icdCode"='LA89.3'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='LA93.1',"embedding"=NULL WHERE "icdCode"='LA86.20'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='LA93.0',"embedding"=NULL WHERE "icdCode"='LA86.21'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='LA89.0',"embedding"=NULL WHERE "icdCode"='LA89.1'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BB83',"embedding"=NULL WHERE "icdCode"='BB24'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BD11.1',"embedding"=NULL WHERE "icdCode"='BD13'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BD10.3',"icdName"='Left ventricular aneurysm',"icdArName"='أم دم البطين الأيسر',"embedding"=NULL WHERE "icdCode"='BA60.2'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BD10.2',"icdName"='Post-infarction ventricular septal defect',"icdArName"='عيب الحاجز البطيني بعد الاحتشاء',"embedding"=NULL WHERE "icdCode"='BA60.3'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BC53',"embedding"=NULL WHERE "icdCode"='BC80.20'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BB63.2',"icdName"='Mitral valve prolapse',"icdArName"='هبوط الصمام التاجي',"embedding"=NULL WHERE "icdCode"='BB62.Z'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='1B13.Z',"icdName"='Rheumatic combined valve disease - unspecified',"icdArName"='مرض الصمامات المتعددة الروماتيزمي - غير محدد',"embedding"=NULL WHERE "icdCode"='BC20.1'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='1B12.Z',"icdName"='Rheumatic tricuspid valve disease - unspecified',"icdArName"='مرض الصمام ثلاثي الشرفات الروماتيزمي - غير محدد',"embedding"=NULL WHERE "icdCode"='BB82.0'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='1B11.1',"embedding"=NULL WHERE "icdCode"='BB71.0'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='1B11.0',"embedding"=NULL WHERE "icdCode"='BB70.0'`);

    // BC43 cascade in reverse
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BC43.4',"icdName"='Arrhythmogenic right ventricular cardiomyopathy',"icdArName"='اعتلال عضلة البطين الأيمن اللانظمي',"embedding"=NULL WHERE "icdCode"='BC43.6'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BC43.3',"embedding"=NULL WHERE "icdCode"='BC43.2'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BC43.2',"icdName"='hypertrophic cardiomyopathy',"icdArName"='اعتلال عضلة القلب الضخامي',"embedding"=NULL WHERE "icdCode"='BC43.1'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BC43.1',"icdName"='dilated cardiomyopathy',"icdArName"='اعتلال عضلة القلب التوسعي',"embedding"=NULL WHERE "icdCode"='BC43.0'`);
  }
}
