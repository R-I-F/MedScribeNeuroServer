import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS proc_cpts — batch 1 of 2 (48 procedures). Groups: JCYS (jaw cyst/tumour excision),
 * CLEF (cleft repair — reuses the existing PRS group), IMPL (jaw implant/graft), VEST
 * (pre-prosthetic), DTAL (dentoalveolar), ORIF (maxillofacial fracture treatment).
 *
 * MFS previously had ZERO proc_cpts. Every CPT verified current/active against AAPC — see
 * AUDIT_MFS.md "2E" (the deleted code 21310 was identified and excluded). Codes already
 * present under another group (PRS CLEF, SOC HNCK, PRS EXCN) are linked, not duplicated,
 * by migration 116. Linked to main_diags by migration 116.
 */
export class ImportMfsProcCpts11750000000114 implements MigrationInterface {
  name = "ImportMfsProcCpts11750000000114";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── JCYS: jaw cyst / tumour excision ──────────────────────────────────
      ('Excision of benign tumour or cyst of maxilla or zygoma','JCYS','21030-00','Enucleation/curettage of a benign tumour or cyst of the maxilla or zygomatic bone.','استئصال ورم أو كيسة حميدة في الفك العلوي أو العظم الوجني','اجتثاث/كشط ورم أو كيسة حميدة في الفك العلوي أو العظم الوجني.'),
      ('Excision of benign tumour or cyst of mandible, simple','JCYS','21040-00','Enucleation or curettage of a benign cyst/tumour of the mandible.','استئصال ورم أو كيسة حميدة في الفك السفلي، بسيط','اجتثاث أو كشط كيسة/ورم حميد في الفك السفلي.'),
      ('Excision of benign tumour or cyst of mandible, with osteotomy','JCYS','21046-00','Excision of an aggressive benign mandibular cyst/tumour requiring intraosseous osteotomy.','استئصال ورم أو كيسة حميدة في الفك السفلي مع قطع العظم','استئصال كيسة/ورم حميد عدواني في الفك السفلي يتطلب قطعاً عظمياً داخلياً.'),
      ('Excision of benign tumour of maxilla, open','JCYS','21048-00','Open excision of a benign tumour of the maxilla.','استئصال ورم حميد في الفك العلوي، مفتوح','استئصال مفتوح لورم حميد في الفك العلوي.'),
      ('Excision of bone of mandible','JCYS','21025-00','Excision of mandibular bone (eg for osteomyelitis or necrosis) including sequestrectomy.','استئصال عظم الفك السفلي','استئصال عظم الفك السفلي (مثلاً لالتهاب العظم والنقي أو النخر) مع استئصال العظم المتنخّر.'),
      ('Excision of malignant tumour of maxilla or zygoma','JCYS','21034-00','Open resection of a malignant tumour of the maxilla or zygoma.','استئصال ورم خبيث في الفك العلوي أو العظم الوجني','استئصال مفتوح لورم خبيث في الفك العلوي أو العظم الوجني.'),
      ('Excision of malignant tumour of mandible','JCYS','21044-00','Open resection of a malignant tumour of the mandible.','استئصال ورم خبيث في الفك السفلي','استئصال مفتوح لورم خبيث في الفك السفلي.'),
      -- ── CLEF: cleft repair (reuse PRS group) ──────────────────────────────
      ('Cheiloplasty, cleft lip, two-stage','CLEF','40702-00','Repair of a cleft lip/nasal deformity performed as one of two stages.','رأب الشفة المشقوقة، على مرحلتين','إصلاح الشفة المشقوقة/تشوّه الأنف يُجرى كإحدى مرحلتين.'),
      ('Palatoplasty with closure of alveolar soft-tissue cleft','CLEF','42205-00','Cleft palate repair extending to closure of the soft tissue of the alveolar ridge.','رأب الحنك مع إغلاق شق النسيج الرخو السنخي','إصلاح شق الحنك مع إغلاق النسيج الرخو للحَرف السنخي.'),
      ('Palatoplasty with alveolar closure and bone graft','CLEF','42210-00','Cleft palate repair with closure of the alveolar ridge cleft and bone grafting.','رأب الحنك مع إغلاق سنخي وترقيع عظمي','إصلاح شق الحنك مع إغلاق شق الحَرف السنخي وترقيع عظمي.'),
      ('Palatoplasty, major revision','CLEF','42215-00','Major revision of a previous cleft palate repair.','رأب الحنك، مراجعة كبرى','مراجعة كبرى لإصلاح شق حنك سابق.'),
      ('Lengthening of palate with pharyngeal flap','CLEF','42226-00','Lengthening of the soft palate by transfer of pharyngeal/hard-palate flaps for velopharyngeal insufficiency.','إطالة الحنك بشريحة بلعومية','إطالة الحنك الرخو بنقل شرائح بلعومية/من الحنك الصلب لقصور البلعوم الحنكي.'),
      -- ── IMPL: implant / bone graft ────────────────────────────────────────
      ('Reconstruction of jaw with endosteal implant, partial','IMPL','21248-00','Reconstruction of the mandible or maxilla with placement of an endosteal (osseointegrated) implant, partial.','إعادة بناء الفك بزرعة داخل العظم، جزئية','إعادة بناء الفك السفلي أو العلوي بوضع زرعة داخل العظم (مندمجة عظمياً)، جزئية.'),
      ('Reconstruction of jaw with endosteal implant, complete','IMPL','21249-00','Reconstruction of the entire mandible or maxilla with endosteal implants.','إعادة بناء الفك بزرعة داخل العظم، كاملة','إعادة بناء كامل الفك السفلي أو العلوي بزرعات داخل العظم.'),
      ('Bone graft to mandible','IMPL','21215-00','Application of an autogenous bone graft to repair a mandibular defect.','ترقيع عظمي للفك السفلي','وضع طعم عظمي ذاتي لإصلاح عيب في الفك السفلي.'),
      ('Harvest of bone graft for grafting','IMPL','20900-00','Harvest of an autogenous bone graft (eg iliac crest/calvaria) for jaw reconstruction.','حصاد طعم عظمي للترقيع','حصاد طعم عظمي ذاتي (مثل العرف الحرقفي/القحف) لإعادة بناء الفك.'),
      -- ── VEST: pre-prosthetic ──────────────────────────────────────────────
      ('Vestibuloplasty, anterior','VEST','40840-00','Anterior vestibuloplasty to deepen the sulcus and increase usable ridge height before prosthesis.','رأب الدهليز، أمامي','رأب دهليز أمامي لتعميق الميزاب وزيادة ارتفاع الحَرف المفيد قبل التعويض.'),
      ('Vestibuloplasty, posterior, unilateral','VEST','40842-00','Posterior unilateral vestibuloplasty to improve ridge depth for denture support.','رأب الدهليز، خلفي أحادي الجانب','رأب دهليز خلفي أحادي الجانب لتحسين عمق الحَرف لدعم الطقم.'),
      ('Alveoloplasty','VEST','41874-00','Surgical smoothing/reshaping of the alveolar ridge in preparation for a prosthesis.','رأب الحَرف السنخي','تنعيم/إعادة تشكيل جراحي للحَرف السنخي تحضيراً للتعويض.'),
      -- ── DTAL: dentoalveolar ───────────────────────────────────────────────
      ('Excision of lesion of mucosa/submucosa of mouth vestibule','DTAL','40810-00','Excision of a lesion of the mucosa/submucosa of the vestibule of the mouth.','استئصال آفة الغشاء المخاطي/تحت المخاطي لدهليز الفم','استئصال آفة في الغشاء المخاطي/تحت المخاطي لدهليز الفم.'),
      ('Excision of lesion of dentoalveolar structures','DTAL','41825-00','Excision of a lesion or tumour of the dentoalveolar structures without repair (eg operculum/epulis).','استئصال آفة في البنى السنّية السنخية','استئصال آفة أو ورم في البنى السنّية السنخية دون إصلاح (مثل الغطاء/الورم اللثوي).'),
      ('Excision of lesion of dentoalveolar structures, with repair','DTAL','41826-00','Excision of a dentoalveolar lesion with simple repair.','استئصال آفة في البنى السنّية السنخية مع الإصلاح','استئصال آفة سنّية سنخية مع إصلاح بسيط.'),
      ('Removal of embedded foreign body, dentoalveolar','DTAL','41805-00','Removal of an embedded foreign body (eg retained root) from dentoalveolar soft tissue.','إزالة جسم غريب منغرس، سنّي سنخي','إزالة جسم غريب منغرس (مثل جذر متبقٍّ) من النسيج الرخو السنّي السنخي.'),
      ('Excision of lingual frenum (frenectomy)','DTAL','41115-00','Excision/release of the lingual frenum (ankyloglossia/tongue-tie).','استئصال اللجام اللساني (قطع اللجام)','استئصال/تحرير اللجام اللساني (التصاق اللسان).'),
      -- ── ORIF: maxillofacial fracture treatment ────────────────────────────
      ('Closed treatment of nasal fracture, with manipulation','ORIF','21315-00','Closed reduction of a nasal bone fracture by manipulation, without stabilisation.','معالجة مغلقة لكسر الأنف مع الرد','رد مغلق لكسر عظم الأنف بالمناورة، دون تثبيت.'),
      ('Closed treatment of nasal fracture, with stabilization','ORIF','21320-00','Closed reduction of a nasal fracture with splint/packing stabilisation.','معالجة مغلقة لكسر الأنف مع التثبيت','رد مغلق لكسر الأنف مع تثبيت بالجبيرة/الحشو.'),
      ('Open treatment of nasal fracture, uncomplicated','ORIF','21325-00','Open reduction of an uncomplicated nasal fracture via a nasal incision.','معالجة مفتوحة لكسر الأنف، غير معقّد','رد مفتوح لكسر أنف غير معقّد عبر شق أنفي.'),
      ('Open treatment of nasal fracture, complicated','ORIF','21330-00','Open reduction of a complicated nasal fracture with internal fixation.','معالجة مفتوحة لكسر الأنف، معقّد','رد مفتوح لكسر أنف معقّد مع تثبيت داخلي.'),
      ('Open treatment of nasal septal fracture','ORIF','21336-00','Open reduction and stabilisation of a nasal septal fracture/dislocation.','معالجة مفتوحة لكسر حاجز الأنف','رد مفتوح وتثبيت لكسر/خلع حاجز الأنف.'),
      ('Open treatment of nasoethmoid fracture, without fixation','ORIF','21338-00','Open reduction of a nasoethmoid (NOE) fracture without external fixation.','معالجة مفتوحة لكسر الأنف الغربالي، دون تثبيت','رد مفتوح لكسر الأنف الغربالي دون تثبيت خارجي.'),
      ('Open treatment of nasoethmoid fracture, with external fixation','ORIF','21339-00','Open reduction of a nasoethmoid (NOE) fracture with external fixation.','معالجة مفتوحة لكسر الأنف الغربالي، مع تثبيت خارجي','رد مفتوح لكسر الأنف الغربالي مع تثبيت خارجي.'),
      ('Open treatment of nasomaxillary complex fracture (Le Fort II)','ORIF','21346-00','Open reduction and internal fixation of a nasomaxillary (Le Fort II) complex fracture.','معالجة مفتوحة لكسر المعقد الأنفي الفكي (لوفور II)','رد مفتوح وتثبيت داخلي لكسر المعقد الأنفي الفكي العلوي (لوفور II).'),
      ('Closed treatment of zygomatic fracture, with manipulation','ORIF','21355-00','Percutaneous closed reduction of a malar/zygomatic fracture.','معالجة مغلقة لكسر العظم الوجني مع الرد','رد مغلق عبر الجلد لكسر العظم الوجني.'),
      ('Open treatment of depressed zygomatic arch fracture','ORIF','21356-00','Open reduction of a depressed zygomatic arch fracture (eg Gillies approach).','معالجة مفتوحة لكسر القوس الوجني المنخسف','رد مفتوح لكسر القوس الوجني المنخسف (مثل مدخل جيليز).'),
      ('Open treatment of complicated zygomaticomaxillary complex fracture','ORIF','21365-00','Open reduction and internal fixation of a complex ZMC fracture via multiple approaches.','معالجة مفتوحة لكسر المعقد الوجني الفكي المعقّد','رد مفتوح وتثبيت داخلي لكسر المعقد الوجني الفكي العلوي المعقّد عبر مداخل متعددة.'),
      ('Open treatment of orbital floor blowout fracture, transantral','ORIF','21385-00','Repair of an orbital floor blowout fracture via a transantral (Caldwell-Luc) approach.','معالجة مفتوحة لكسر قاع الحجاج الانفجاري عبر الجيب','إصلاح كسر قاع الحجاج الانفجاري عبر مدخل الجيب الفكي (كالدويل-لوك).'),
      ('Open treatment of orbital fracture, with implant','ORIF','21407-00','Open reduction of an orbital fracture with placement of an alloplastic implant.','معالجة مفتوحة لكسر الحجاج مع زرعة','رد مفتوح لكسر الحجاج مع وضع زرعة صناعية.'),
      ('Open treatment of orbital fracture, with bone graft','ORIF','21408-00','Open reduction of an orbital fracture with bone grafting.','معالجة مفتوحة لكسر الحجاج مع ترقيع عظمي','رد مفتوح لكسر الحجاج مع ترقيع عظمي.'),
      ('Closed treatment of palatal or maxillary (Le Fort I) fracture','ORIF','21421-00','Closed reduction of a palatal/maxillary (Le Fort I) fracture with interdental fixation.','معالجة مغلقة لكسر الحنك أو الفك العلوي (لوفور I)','رد مغلق لكسر الحنك/الفك العلوي (لوفور I) مع تثبيت بين الأسنان.'),
      ('Open treatment of palatal or maxillary (Le Fort I) fracture','ORIF','21422-00','Open reduction and internal fixation of a Le Fort I maxillary fracture.','معالجة مفتوحة لكسر الحنك أو الفك العلوي (لوفور I)','رد مفتوح وتثبيت داخلي لكسر الفك العلوي لوفور I.'),
      ('Open treatment of craniofacial separation (Le Fort III)','ORIF','21432-00','Open reduction and fixation of a craniofacial disjunction (Le Fort III).','معالجة مفتوحة للانفصال القحفي الوجهي (لوفور III)','رد مفتوح وتثبيت للانفصال القحفي الوجهي (لوفور III).'),
      ('Open treatment of dentoalveolar ridge fracture','ORIF','21445-00','Open reduction of a mandibular/maxillary alveolar ridge fracture.','معالجة مفتوحة لكسر الحَرف السنخي','رد مفتوح لكسر الحَرف السنخي في الفك السفلي/العلوي.'),
      ('Closed treatment of mandibular fracture, without manipulation','ORIF','21450-00','Closed treatment of a mandibular fracture without manipulation.','معالجة مغلقة لكسر الفك السفلي، دون رد','معالجة مغلقة لكسر الفك السفلي دون مناورة.'),
      ('Closed treatment of mandibular fracture, with interdental fixation','ORIF','21453-00','Closed reduction of a mandibular fracture with interdental (arch bar) fixation.','معالجة مغلقة لكسر الفك السفلي، مع تثبيت بين الأسنان','رد مغلق لكسر الفك السفلي مع تثبيت بين الأسنان (قضبان قوسية).'),
      ('Open treatment of mandibular fracture, without interdental fixation','ORIF','21461-00','Open reduction and internal fixation of a mandibular fracture without interdental fixation.','معالجة مفتوحة لكسر الفك السفلي، دون تثبيت بين الأسنان','رد مفتوح وتثبيت داخلي لكسر الفك السفلي دون تثبيت بين الأسنان.'),
      ('Open treatment of mandibular fracture, with interdental fixation','ORIF','21462-00','Open reduction and internal fixation of a mandibular fracture with interdental fixation.','معالجة مفتوحة لكسر الفك السفلي، مع تثبيت بين الأسنان','رد مفتوح وتثبيت داخلي لكسر الفك السفلي مع تثبيت بين الأسنان.'),
      ('Open treatment of mandibular condylar fracture','ORIF','21465-00','Open reduction and fixation of a mandibular condylar process fracture.','معالجة مفتوحة لكسر لقمة الفك السفلي','رد مفتوح وتثبيت لكسر الناتئ اللقمي للفك السفلي.'),
      ('Open treatment of complicated mandibular fracture, multiple approaches','ORIF','21470-00','Open reduction of a complicated/comminuted mandibular fracture via multiple approaches.','معالجة مفتوحة لكسر الفك السفلي المعقّد، مداخل متعددة','رد مفتوح لكسر فك سفلي معقّد/مفتّت عبر مداخل متعددة.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete only the rows this migration inserted (preserve pre-existing CLEF rows owned by PRS).
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('JCYS','IMPL','VEST','DTAL','ORIF')`);
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" = 'CLEF' AND "numCode" IN ('40702-00','42205-00','42210-00','42215-00','42226-00')`);
  }
}
