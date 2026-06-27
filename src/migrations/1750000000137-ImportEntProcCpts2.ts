import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT proc_cpts — import batch 2 of 2 (40 new rows). New ENT alpha groups: MYRT (myringotomy/
 * tubes), EARC (external-ear canal), TYMP (tympanoplasty/myringoplasty), MAST (mastoid/facial
 * nerve), STAP (otosclerosis/cochlear/labyrinth), LARY (laryngology/tracheostomy). Three
 * parathyroid/substernal codes are added to the EXISTING shared THYR group, and one radical
 * pharyngeal-resection code to the EXISTING shared HNCK group (so down() removes only those
 * specific rows, never the whole shared group). All CPTs AAPC-verified active (AUDIT_ENT.md 2E).
 */
export class ImportEntProcCpts21750000000137 implements MigrationInterface {
  name = "ImportEntProcCpts21750000000137";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── MYRT: myringotomy / ventilation tubes ─────────────────────────────
      ('Myringotomy with aspiration and/or eustachian tube inflation','MYRT','69420-00','Myringotomy with aspiration and/or eustachian tube inflation.','بضع الطبلة مع الشفط و/أو نفخ قناة استاكيوس','بضع طبلة الأذن مع الشفط و/أو نفخ قناة استاكيوس.'),
      ('Myringotomy with aspiration, general anaesthesia','MYRT','69421-00','Myringotomy with aspiration and/or eustachian tube inflation requiring general anaesthesia.','بضع الطبلة مع الشفط، تخدير عام','بضع طبلة الأذن مع الشفط تحت تخدير عام.'),
      ('Tympanostomy tube, local anaesthesia','MYRT','69433-00','Insertion of a ventilation tube (tympanostomy) under local/topical anaesthesia.','أنبوب فغر الطبلة، تخدير موضعي','إدخال أنبوب تهوية (فغر الطبلة) تحت تخدير موضعي.'),
      ('Tympanostomy tube, general anaesthesia','MYRT','69436-00','Insertion of a ventilation tube (tympanostomy) under general anaesthesia.','أنبوب فغر الطبلة، تخدير عام','إدخال أنبوب تهوية (فغر الطبلة) تحت تخدير عام.'),
      ('Excision of aural polyp','MYRT','69540-00','Excision of an aural (middle-ear/canal) polyp.','استئصال السليلة الأذنية','استئصال سليلة أذنية (في الأذن الوسطى/القناة).'),
      -- ── EARC: external auditory canal ─────────────────────────────────────
      ('Removal of impacted cerumen, instrumentation','EARC','69210-00','Removal of impacted cerumen using instrumentation, unilateral.','إزالة الصملاخ المنحشر بالأدوات','إزالة الصملاخ المنحشر باستخدام الأدوات، أحادي الجانب.'),
      ('Removal of foreign body, external auditory canal','EARC','69200-00','Removal of a foreign body from the external auditory canal without general anaesthesia.','إزالة جسم غريب من قناة الأذن الخارجية','إزالة جسم غريب من قناة الأذن الخارجية دون تخدير عام.'),
      -- ── TYMP: tympanoplasty / myringoplasty ───────────────────────────────
      ('Repair of tympanic membrane perforation','TYMP','69610-00','Surgical repair of a tympanic membrane perforation including site preparation.','إصلاح ثقب طبلة الأذن','إصلاح جراحي لثقب طبلة الأذن مع تحضير الموقع.'),
      ('Myringoplasty','TYMP','69620-00','Myringoplasty confined to the drumhead and donor area.','رأب الطبلة','رأب طبلة الأذن مقتصراً على الغشاء ومنطقة المتبرع.'),
      ('Tympanoplasty without mastoidectomy','TYMP','69631-00','Tympanoplasty without mastoidectomy, including canalplasty/atticotomy and/or middle-ear surgery.','رأب الطبلة دون استئصال الخشاء','رأب الطبلة دون استئصال الخشاء، يشمل رأب القناة/بضع العِلّيّة و/أو جراحة الأذن الوسطى.'),
      ('Tympanoplasty with ossicular chain reconstruction','TYMP','69632-00','Tympanoplasty without mastoidectomy, with ossicular chain reconstruction.','رأب الطبلة مع إعادة بناء سلسلة العُظيمات','رأب الطبلة دون استئصال الخشاء، مع إعادة بناء سلسلة العُظيمات.'),
      ('Tympanoplasty with antrotomy or mastoidectomy','TYMP','69635-00','Tympanoplasty with antrotomy or mastoidectomy.','رأب الطبلة مع بضع الغار أو استئصال الخشاء','رأب الطبلة مع بضع الغار أو استئصال الخشاء.'),
      ('Tympanoplasty with mastoidectomy','TYMP','69641-00','Tympanoplasty with mastoidectomy (without ossicular reconstruction).','رأب الطبلة مع استئصال الخشاء','رأب الطبلة مع استئصال الخشاء (دون إعادة بناء العُظيمات).'),
      -- ── MAST: mastoidectomy / facial nerve ────────────────────────────────
      ('Transmastoid antrotomy (simple mastoidectomy)','MAST','69501-00','Transmastoid antrotomy (simple/cortical mastoidectomy).','بضع الغار عبر الخشاء (استئصال خشاء بسيط)','بضع الغار عبر الخشاء (استئصال خشاء بسيط/قشري).'),
      ('Mastoidectomy, complete','MAST','69502-00','Complete mastoidectomy.','استئصال الخشاء الكامل','استئصال كامل للخشاء.'),
      ('Mastoidectomy, modified radical','MAST','69505-00','Modified radical mastoidectomy.','استئصال الخشاء الجذري المعدّل','استئصال خشاء جذري معدّل.'),
      ('Mastoidectomy, radical','MAST','69511-00','Radical mastoidectomy.','استئصال الخشاء الجذري','استئصال خشاء جذري.'),
      ('Suture or decompression of facial nerve, intratemporal','MAST','69740-00','Suture or decompression of the facial nerve at the geniculate ganglion area within the middle ear.','خياطة أو تخفيف ضغط العصب الوجهي داخل الصدغ','خياطة أو تخفيف ضغط العصب الوجهي عند منطقة العقدة الركبية داخل الأذن الوسطى.'),
      ('Total facial nerve decompression and/or repair','MAST','69955-00','Total decompression and/or repair of the facial nerve, may include graft.','تخفيف ضغط العصب الوجهي الكامل و/أو إصلاحه','تخفيف ضغط كامل للعصب الوجهي و/أو إصلاحه، قد يشمل طعماً.'),
      -- ── STAP: otosclerosis / cochlear / labyrinth ─────────────────────────
      ('Stapedectomy or stapedotomy','STAP','69660-00','Stapedectomy or stapedotomy with reestablishment of ossicular continuity.','استئصال أو بضع الركاب','استئصال أو بضع الركاب مع إعادة استمرارية العُظيمات.'),
      ('Stapedectomy with footplate drill-out','STAP','69661-00','Stapedectomy/stapedotomy with footplate drill-out, with or without mastoidectomy.','استئصال الركاب مع تثقيب الصفيحة القدمية','استئصال/بضع الركاب مع تثقيب الصفيحة القدمية، مع أو دون استئصال الخشاء.'),
      ('Cochlear device implantation','STAP','69930-00','Implantation of a cochlear device with electrode array and initial programming, unilateral.','زرع جهاز القوقعة','زرع جهاز قوقعي مع مصفوفة الأقطاب والبرمجة الأولية، أحادي الجانب.'),
      ('Labyrinthectomy with mastoidectomy','STAP','69915-00','Labyrinthectomy with mastoidectomy for intractable vertigo (e.g. Meniere disease).','استئصال التيه مع استئصال الخشاء','استئصال التيه مع استئصال الخشاء للدوار المعند (مثل مرض منيير).'),
      ('Use of operating microscope (microsurgery)','STAP','69990-00','Use of the operating microscope for otologic microsurgery (add-on).','استخدام المجهر الجراحي (جراحة مجهرية)','استخدام المجهر الجراحي في الجراحة المجهرية للأذن (إضافي).'),
      -- ── LARY: laryngology / tracheostomy ──────────────────────────────────
      ('Laryngoscopy, indirect, diagnostic','LARY','31505-00','Indirect (mirror) diagnostic laryngoscopy.','تنظير الحنجرة غير المباشر التشخيصي','تنظير الحنجرة غير المباشر (بالمرآة) التشخيصي.'),
      ('Direct laryngoscopy, diagnostic','LARY','31525-00','Direct operative diagnostic laryngoscopy.','تنظير الحنجرة المباشر التشخيصي','تنظير الحنجرة المباشر الجراحي التشخيصي.'),
      ('Direct laryngoscopy with biopsy','LARY','31535-00','Direct operative laryngoscopy with biopsy.','تنظير الحنجرة المباشر مع خزعة','تنظير الحنجرة المباشر الجراحي مع أخذ خزعة.'),
      ('Direct laryngoscopy with tumour excision/vocal cord stripping','LARY','31540-00','Direct laryngoscopy with excision of tumour and/or stripping of vocal cords.','تنظير الحنجرة المباشر مع استئصال ورم/تجريف الحبال الصوتية','تنظير الحنجرة المباشر مع استئصال ورم و/أو تجريف الحبال الصوتية.'),
      ('Direct laryngoscopy with vocal cord stripping, operating microscope','LARY','31541-00','Direct laryngoscopy with vocal cord stripping using the operating microscope or telescope.','تنظير الحنجرة المباشر مع تجريف الحبال الصوتية بالمجهر','تنظير الحنجرة المباشر مع تجريف الحبال الصوتية باستخدام المجهر الجراحي أو المنظار.'),
      ('Laryngoscopy with vocal cord injection','LARY','31571-00','Direct laryngoscopy with therapeutic injection into the vocal cord(s).','تنظير الحنجرة مع حقن الحبل الصوتي','تنظير الحنجرة المباشر مع حقن علاجي في الحبل/الحبال الصوتية.'),
      ('Direct laryngoscopy with foreign body removal','LARY','31530-00','Direct operative laryngoscopy with removal of a foreign body.','تنظير الحنجرة المباشر مع إزالة جسم غريب','تنظير الحنجرة المباشر الجراحي مع إزالة جسم غريب.'),
      ('Laryngoplasty for laryngeal web','LARY','31580-00','Laryngoplasty for a laryngeal web with indwelling keel or stent insertion.','رأب الحنجرة للشبكة الحنجرية','رأب الحنجرة لشبكة حنجرية مع إدخال عارضة أو دعامة مقيمة.'),
      ('Laryngoplasty for laryngeal stenosis, with graft','LARY','31551-00','Laryngoplasty for laryngeal stenosis with graft, age younger than 12, without indwelling stent.','رأب الحنجرة لتضيق الحنجرة مع طعم','رأب الحنجرة لتضيق الحنجرة مع طعم، دون 12 سنة، بلا دعامة مقيمة.'),
      ('Tracheostomy, planned','LARY','31600-00','Planned (elective) tracheostomy.','فغر الرغامى المخطط له','فغر رغامى مخطط له (اختياري).'),
      ('Tracheostomy, emergency','LARY','31603-00','Emergency tracheostomy by transtracheal approach.','فغر الرغامى الطارئ','فغر رغامى طارئ بمدخل عبر الرغامى.'),
      ('Laryngotomy with removal of tumour or laryngocele','LARY','31300-00','Laryngotomy (thyrotomy/laryngofissure) with removal of a tumour or laryngocele.','بضع الحنجرة مع إزالة ورم أو قيلة حنجرية','بضع الحنجرة (بضع الدرقية) مع إزالة ورم أو قيلة حنجرية.'),
      -- ── THYR additions (existing shared group) ────────────────────────────
      ('Thyroidectomy including substernal thyroid, cervical approach','THYR','60271-00','Total thyroidectomy including a substernal extension via the cervical approach.','استئصال الدرقية شاملاً الامتداد تحت القص، مدخل عنقي','استئصال درقية كامل شاملاً الامتداد تحت القص عبر المدخل العنقي.'),
      ('Parathyroidectomy, re-exploration','THYR','60502-00','Re-exploration parathyroidectomy for persistent or recurrent hyperparathyroidism.','استئصال جارة الدرقية، إعادة استكشاف','استئصال جارة الدرقية بإعادة الاستكشاف لفرط نشاط جارات الدرقية المستمر أو الناكس.'),
      ('Parathyroidectomy with mediastinal exploration','THYR','60505-00','Parathyroidectomy with mediastinal exploration via sternal split or transthoracic approach.','استئصال جارة الدرقية مع استكشاف المنصف','استئصال جارة الدرقية مع استكشاف المنصف عبر شق القص أو المدخل عبر الصدر.'),
      -- ── HNCK addition (existing shared group) ─────────────────────────────
      ('Radical resection of tonsil, pillars or retromolar trigone','HNCK','42842-00','Radical resection of the tonsil, tonsillar pillars and/or retromolar trigone without closure.','الاستئصال الجذري للوزة أو الأركان أو المثلث خلف الرحوي','استئصال جذري للوزة وأركان اللوزة و/أو المثلث خلف الرحوي دون إغلاق.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('MYRT','EARC','TYMP','MAST','STAP','LARY')`);
    // remove only the specific rows added to the shared THYR / HNCK groups
    await q.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" = 'THYR' AND "numCode" IN ('60271-00','60502-00','60505-00')`);
    await q.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" = 'HNCK' AND "numCode" = '42842-00'`);
  }
}
