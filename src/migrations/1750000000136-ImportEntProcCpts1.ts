import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT proc_cpts — import batch 1 of 2 (41 new rows). ENT previously had ZERO proc_cpts.
 * New alpha groups: FESS (endoscopic sinus surgery), SEPT (septal/turbinate/epistaxis),
 * NASF (nasal mass/foreign body), TONS (tonsil/adenoid/pharyngeal abscess), OSAS (sleep surgery).
 * Every CPT verified current/active against AAPC (AUDIT_ENT.md "2E"). Codes already present in
 * proc_cpts (thyroid/salivary/neck — GS/SOC/MFS-owned) are NOT re-imported; they are linked by
 * migration 138. Linked to main_diags by migration 138.
 */
export class ImportEntProcCpts11750000000136 implements MigrationInterface {
  name = "ImportEntProcCpts11750000000136";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── FESS: functional endoscopic sinus surgery ─────────────────────────
      ('Nasal endoscopy, diagnostic','FESS','31231-00','Diagnostic endoscopic examination of the nasal cavity and meati.','تنظير الأنف التشخيصي','فحص تنظيري تشخيصي لجوف الأنف والصماخات.'),
      ('Nasal/sinus endoscopy with biopsy, polypectomy or debridement','FESS','31237-00','Endoscopic biopsy, polypectomy or debridement of the nasal cavity or sinuses.','تنظير الأنف/الجيوب مع خزعة أو استئصال سليلة أو تنضير','خزعة أو استئصال سليلة أو تنضير تنظيري لجوف الأنف أو الجيوب.'),
      ('Endoscopic anterior ethmoidectomy','FESS','31254-00','Endoscopic partial (anterior) ethmoidectomy.','استئصال الغربال الأمامي بالمنظار','استئصال غربالي أمامي جزئي بالمنظار.'),
      ('Endoscopic total ethmoidectomy','FESS','31255-00','Endoscopic total (anterior and posterior) ethmoidectomy.','استئصال الغربال الكامل بالمنظار','استئصال غربالي كامل (أمامي وخلفي) بالمنظار.'),
      ('Endoscopic maxillary antrostomy','FESS','31256-00','Endoscopic creation of a maxillary sinus antrostomy.','فغر الجيب الفكي بالمنظار','إنشاء فغر للجيب الفكي بالمنظار.'),
      ('Endoscopic maxillary antrostomy with tissue removal','FESS','31267-00','Endoscopic maxillary antrostomy with removal of diseased antral tissue.','فغر الجيب الفكي بالمنظار مع إزالة النسيج','فغر الجيب الفكي بالمنظار مع إزالة النسيج المريض من الجيب.'),
      ('Endoscopic frontal sinus exploration','FESS','31276-00','Endoscopic frontal sinusotomy/exploration with or without tissue removal.','استكشاف الجيب الجبهي بالمنظار','فغر/استكشاف الجيب الجبهي بالمنظار مع أو دون إزالة نسيج.'),
      ('Endoscopic sphenoidotomy','FESS','31287-00','Endoscopic creation of a sphenoid sinus opening.','فغر الجيب الوتدي بالمنظار','إنشاء فتحة في الجيب الوتدي بالمنظار.'),
      ('Endoscopic sphenoidotomy with tissue removal','FESS','31288-00','Endoscopic sphenoidotomy with removal of diseased tissue.','فغر الجيب الوتدي بالمنظار مع إزالة النسيج','فغر الجيب الوتدي بالمنظار مع إزالة النسيج المريض.'),
      ('Endoscopic concha bullosa resection','FESS','31240-00','Endoscopic resection of a concha bullosa (pneumatised middle turbinate).','استئصال المحارة الفقاعية بالمنظار','استئصال تنظيري للمحارة الفقاعية (القرين المتوسط المُهَوّى).'),
      -- ── SEPT: septum / turbinate / epistaxis ──────────────────────────────
      ('Septoplasty','SEPT','30520-00','Submucous resection and repositioning of the nasal septum for deviation.','رأب الحاجز الأنفي','استئصال تحت مخاطي وإعادة توضيع الحاجز الأنفي لعلاج الانحراف.'),
      ('Submucous resection of inferior turbinate','SEPT','30140-00','Submucous resection to reduce inferior turbinate hypertrophy.','استئصال تحت مخاطي للقرين السفلي','استئصال تحت مخاطي لتصغير تضخم القرين السفلي.'),
      ('Excision of inferior turbinate','SEPT','30130-00','Partial or complete excision of the inferior turbinate.','استئصال القرين السفلي','استئصال جزئي أو كامل للقرين الأنفي السفلي.'),
      ('Ablation of inferior turbinate, intramural','SEPT','30802-00','Intramural (submucosal) ablation of the inferior turbinate by radiofrequency or cautery.','استئصال القرين السفلي داخل الجدار','استئصال داخل الجدار (تحت المخاطي) للقرين السفلي بالترددات الراديوية أو الكي.'),
      ('Repair of nasal septal perforation','SEPT','30630-00','Surgical closure of a nasal septal perforation with mucosal flaps and graft.','إصلاح ثقب الحاجز الأنفي','إغلاق جراحي لثقب الحاجز الأنفي بشرائح مخاطية وطعم.'),
      ('Lysis of intranasal synechiae','SEPT','30560-00','Division of intranasal adhesions (synechiae).','تحرير الالتصاقات داخل الأنف','تقسيم الالتصاقات داخل الأنف.'),
      ('Rhinoplasty, primary, including major septal repair','SEPT','30420-00','Primary rhinoplasty including straightening of the septum or major septal repair.','رأب الأنف الأولي مع إصلاح حاجزي كبير','رأب أنف أولي يتضمن تقويم الحاجز أو إصلاحاً حاجزياً كبيراً.'),
      ('Control of nasal haemorrhage, anterior, simple','SEPT','30901-00','Control of anterior epistaxis by simple cautery and/or packing.','السيطرة على الرعاف الأمامي، بسيط','السيطرة على الرعاف الأمامي بالكي و/أو الحشو البسيط.'),
      ('Control of nasal haemorrhage, anterior, complex','SEPT','30903-00','Control of anterior epistaxis by extensive cautery and/or packing.','السيطرة على الرعاف الأمامي، معقّد','السيطرة على الرعاف الأمامي بالكي و/أو الحشو الواسع.'),
      ('Control of nasal haemorrhage, posterior, initial','SEPT','30905-00','Control of posterior epistaxis by posterior nasal packing, initial.','السيطرة على الرعاف الخلفي، أولي','السيطرة على الرعاف الخلفي بالحشو الأنفي الخلفي، الأولي.'),
      -- ── NASF: nasal mass / foreign body ───────────────────────────────────
      ('Excision of nasal polyp(s), simple','NASF','30110-00','Simple excision of one or more nasal polyps.','استئصال السليلة الأنفية، بسيط','استئصال بسيط لسليلة أنفية واحدة أو أكثر.'),
      ('Excision of extensive nasal polyp(s)','NASF','30115-00','Extensive excision of nasal polyps (hospital/operative setting).','استئصال السلائل الأنفية الواسعة','استئصال واسع للسلائل الأنفية (إطار جراحي/مستشفى).'),
      ('Removal of intranasal foreign body','NASF','30300-00','Removal of a foreign body from the nasal cavity.','إزالة جسم غريب داخل الأنف','إزالة جسم غريب من جوف الأنف.'),
      ('Pterygomaxillary fossa surgery','NASF','31040-00','Surgery of the pterygomaxillary fossa, e.g. resection of juvenile nasopharyngeal angiofibroma.','جراحة الحفرة الجناحية الفكية','جراحة الحفرة الجناحية الفكية، مثل استئصال الورم الليفي الوعائي للبلعوم الأنفي اليفعي.'),
      ('Caldwell-Luc sinusotomy without polyp removal','NASF','31030-00','Radical maxillary sinusotomy (Caldwell-Luc) without removal of antrochoanal polyps.','فغر الجيب الفكي الجذري (كالدويل-لوك)','فغر جذري للجيب الفكي (كالدويل-لوك) دون إزالة السلائل الفكية القمعية.'),
      -- ── TONS: tonsil / adenoid / pharyngeal abscess ───────────────────────
      ('Tonsillectomy and adenoidectomy, younger than age 12','TONS','42820-00','Combined removal of palatine tonsils and adenoids in a patient under 12 years.','استئصال اللوزتين واللحمية، دون 12 سنة','استئصال اللوزتين الحنكيتين واللحمية لمريض دون 12 عاماً.'),
      ('Tonsillectomy and adenoidectomy, age 12 or older','TONS','42821-00','Combined removal of palatine tonsils and adenoids in a patient 12 years or older.','استئصال اللوزتين واللحمية، 12 سنة فأكثر','استئصال اللوزتين الحنكيتين واللحمية لمريض 12 عاماً فأكثر.'),
      ('Tonsillectomy, younger than age 12','TONS','42825-00','Tonsillectomy in a patient under 12 years.','استئصال اللوزتين، دون 12 سنة','استئصال اللوزتين لمريض دون 12 عاماً.'),
      ('Tonsillectomy, age 12 or older','TONS','42826-00','Tonsillectomy in a patient 12 years or older.','استئصال اللوزتين، 12 سنة فأكثر','استئصال اللوزتين لمريض 12 عاماً فأكثر.'),
      ('Adenoidectomy, primary, younger than age 12','TONS','42830-00','Primary adenoidectomy in a patient under 12 years.','استئصال اللحمية الأولي، دون 12 سنة','استئصال اللحمية الأولي لمريض دون 12 عاماً.'),
      ('Adenoidectomy, primary, age 12 or older','TONS','42831-00','Primary adenoidectomy in a patient 12 years or older.','استئصال اللحمية الأولي، 12 سنة فأكثر','استئصال اللحمية الأولي لمريض 12 عاماً فأكثر.'),
      ('Adenoidectomy, secondary, age 12 or older','TONS','42836-00','Secondary (revision) adenoidectomy in a patient 12 years or older.','استئصال اللحمية الثانوي، 12 سنة فأكثر','استئصال اللحمية الثانوي (المراجَع) لمريض 12 عاماً فأكثر.'),
      ('Incision and drainage of peritonsillar abscess','TONS','42700-00','Intraoral incision and drainage of a peritonsillar abscess (quinsy).','شق وتصريف خراج محيط اللوزة','شق وتصريف عبر الفم لخراج محيط اللوزة (الذبحة).'),
      ('I&D retropharyngeal/parapharyngeal abscess, intraoral','TONS','42720-00','Intraoral incision and drainage of a retropharyngeal or parapharyngeal abscess.','شق وتصريف خراج خلف/جانب البلعوم، عبر الفم','شق وتصريف عبر الفم لخراج خلف البلعوم أو جانب البلعوم.'),
      ('I&D retropharyngeal/parapharyngeal abscess, external','TONS','42725-00','External-approach incision and drainage of a retropharyngeal or parapharyngeal abscess.','شق وتصريف خراج خلف/جانب البلعوم، مدخل خارجي','شق وتصريف بمدخل خارجي لخراج خلف البلعوم أو جانب البلعوم.'),
      ('Control of oropharyngeal haemorrhage','TONS','42960-00','Control of oropharyngeal haemorrhage, e.g. secondary post-tonsillectomy bleeding, simple.','السيطرة على نزف البلعوم الفموي','السيطرة على نزف البلعوم الفموي، مثل النزف الثانوي بعد استئصال اللوزتين، بسيط.'),
      -- ── OSAS: sleep / upper-airway surgery ────────────────────────────────
      ('Palatopharyngoplasty (UPPP)','OSAS','42145-00','Uvulopalatopharyngoplasty to enlarge the retropalatal airway in obstructive sleep apnoea.','رأب الحنك والبلعوم (UPPP)','رأب اللهاة والحنك والبلعوم لتوسيع المجرى الهوائي خلف الحنك في انقطاع النفس النومي الانسدادي.'),
      ('Submucosal ablation of the tongue base, radiofrequency','OSAS','41530-00','Radiofrequency submucosal ablation of the tongue base to reduce retrolingual obstruction.','استئصال قاعدة اللسان تحت المخاطي بالترددات الراديوية','استئصال تحت مخاطي لقاعدة اللسان بالترددات الراديوية لتقليل الانسداد خلف اللسان.'),
      ('Hyoid myotomy and suspension','OSAS','21685-00','Hyoid myotomy with suspension to advance the tongue base for sleep apnoea.','بضع وتعليق العظم اللامي','بضع العظم اللامي مع تعليقه لتقديم قاعدة اللسان في انقطاع النفس النومي.'),
      ('Tongue base suspension','OSAS','41512-00','Permanent-suture suspension of the tongue base for obstructive sleep apnoea.','تعليق قاعدة اللسان','تعليق قاعدة اللسان بخيط دائم في انقطاع النفس النومي الانسدادي.'),
      ('Implantation of hypoglossal nerve stimulator','OSAS','64582-00','Open implantation of a hypoglossal nerve neurostimulator system for obstructive sleep apnoea.','زرع محرّض العصب تحت اللساني','زرع مفتوح لمنظومة تحريض العصب تحت اللساني في انقطاع النفس النومي الانسدادي.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('FESS','SEPT','NASF','TONS','OSAS')`);
  }
}
