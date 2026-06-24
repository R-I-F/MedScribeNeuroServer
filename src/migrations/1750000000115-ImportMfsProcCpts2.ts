import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS proc_cpts — batch 2 of 2 (46 procedures). Groups: ARCH (interdental fixation), ORTH
 * (orthognathic osteotomies / facial contouring), TMJS (TMJ surgery), SALV (salivary gland
 * surgery), ONCO (oral cancer resection). Every CPT AAPC-verified current — see AUDIT_MFS.md
 * "2E". Linked to main_diags by migration 116.
 */
export class ImportMfsProcCpts21750000000115 implements MigrationInterface {
  name = "ImportMfsProcCpts21750000000115";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── ARCH: interdental fixation ────────────────────────────────────────
      ('Application of interdental fixation device','ARCH','21110-00','Application of arch bars / interdental fixation device for jaw immobilisation (eg fracture or orthognathic).','تطبيق جهاز التثبيت بين الأسنان','وضع قضبان قوسية/جهاز تثبيت بين الأسنان لتثبيت الفك (مثل الكسر أو تقويم الفكين).'),
      -- ── ORTH: orthognathic osteotomy / contouring ─────────────────────────
      ('Le Fort I osteotomy','ORTH','21141-00','Le Fort I maxillary osteotomy (single piece) to reposition the upper jaw for dentofacial deformity.','قطع عظمي لوفور I','قطع عظمي فكي علوي لوفور I (قطعة واحدة) لإعادة تموضع الفك العلوي في التشوّه السنّي الوجهي.'),
      ('Le Fort II osteotomy','ORTH','21150-00','Le Fort II midface osteotomy for correction of congenital/acquired midface deformity.','قطع عظمي لوفور II','قطع عظمي لمنتصف الوجه لوفور II لتصحيح تشوّه منتصف الوجه الخلقي/المكتسب.'),
      ('Le Fort III osteotomy','ORTH','21154-00','Le Fort III craniofacial osteotomy with bone grafting for severe midface retrusion.','قطع عظمي لوفور III','قطع عظمي قحفي وجهي لوفور III مع ترقيع عظمي لتراجع منتصف الوجه الشديد.'),
      ('Sagittal split osteotomy of mandibular rami (BSSO)','ORTH','21196-00','Bilateral sagittal split ramus osteotomy with internal fixation to advance/set back the mandible.','القطع العظمي السهمي المنقسم لفرعي الفك السفلي','قطع عظمي سهمي منقسم ثنائي للفرع مع تثبيت داخلي لتقديم/إرجاع الفك السفلي.'),
      ('Osteotomy of mandibular rami, without bone graft','ORTH','21193-00','Reconstructive osteotomy of the mandibular body/rami without bone graft.','قطع عظمي لفرعي الفك السفلي، دون ترقيع','قطع عظمي ترميمي لجسم/فرعي الفك السفلي دون ترقيع عظمي.'),
      ('Segmental osteotomy of mandible','ORTH','21198-00','Segmental (anterior subapical) osteotomy of the mandible to reposition a dentoalveolar segment.','قطع عظمي قطعي للفك السفلي','قطع عظمي قطعي (تحت قمي أمامي) للفك السفلي لإعادة تموضع قطعة سنّية سنخية.'),
      ('Segmental osteotomy of maxilla','ORTH','21206-00','Segmental maxillary osteotomy (Wassmund/Schuchardt) to reposition a maxillary dentoalveolar segment.','قطع عظمي قطعي للفك العلوي','قطع عظمي قطعي للفك العلوي (واسموند/شوخاردت) لإعادة تموضع قطعة سنّية سنخية علوية.'),
      ('Genioplasty, augmentation with implant','ORTH','21120-00','Augmentation genioplasty of the chin using a prosthetic implant.','رأب الذقن، تكبير بالزرعة','رأب ذقن تكبيري باستخدام زرعة صناعية.'),
      ('Genioplasty, sliding osteotomy','ORTH','21121-00','Sliding genioplasty by horizontal osteotomy to advance/reposition the chin.','رأب الذقن، قطع عظمي منزلق','رأب ذقن منزلق بقطع عظمي أفقي لتقديم/إعادة تموضع الذقن.'),
      ('Mandibular augmentation, prosthetic implant','ORTH','21125-00','Augmentation of the mandibular body/angle with a prosthetic implant.','تكبير الفك السفلي، زرعة صناعية','تكبير جسم/زاوية الفك السفلي بزرعة صناعية.'),
      ('Mandibular augmentation, with bone graft','ORTH','21127-00','Augmentation of the mandibular body/angle with onlay or interpositional bone graft.','تكبير الفك السفلي، بترقيع عظمي','تكبير جسم/زاوية الفك السفلي بطعم عظمي طِلائي أو إقحامي.'),
      ('Reconstruction of midface, osteotomies with bone grafts','ORTH','21188-00','Reconstruction of the midface by osteotomies and bone grafting for deformity.','إعادة بناء منتصف الوجه بقطوع عظمية وترقيع','إعادة بناء منتصف الوجه بقطوع عظمية وترقيع عظمي للتشوّه.'),
      ('Osteoplasty of facial bones, augmentation','ORTH','21208-00','Osteoplasty of the facial bones by augmentation (implant/graft) for contour deformity.','رأب عظام الوجه، تكبير','رأب عظام الوجه بالتكبير (زرعة/طعم) لتشوّه الملامح.'),
      ('Osteoplasty of facial bones, reduction','ORTH','21209-00','Osteoplasty of the facial bones by reduction/contouring of prominent bone.','رأب عظام الوجه، تصغير','رأب عظام الوجه بالتصغير/تحديد العظم البارز.'),
      ('Reconstruction of mandibular condyle with bone graft','ORTH','21247-00','Reconstruction of the mandibular condyle with a bone/cartilage graft (eg hemifacial microsomia).','إعادة بناء لقمة الفك السفلي بترقيع عظمي','إعادة بناء لقمة الفك السفلي بطعم عظمي/غضروفي (مثل صغر نصف الوجه).'),
      ('Reconstruction of zygomatic arch and glenoid fossa with graft','ORTH','21255-00','Reconstruction of the zygomatic arch and glenoid fossa using bone/cartilage graft.','إعادة بناء القوس الوجني والحفرة الحُقّية بترقيع','إعادة بناء القوس الوجني والحفرة الحُقّية بطعم عظمي/غضروفي.'),
      -- ── TMJS: temporomandibular joint surgery ─────────────────────────────
      ('Arthrotomy of temporomandibular joint','TMJS','21010-00','Open arthrotomy of the TMJ for inspection and debridement of intra-articular pathology.','بضع المفصل الصدغي الفكي','بضع مفتوح للمفصل الصدغي الفكي للفحص وتنضير الآفات داخل المفصل.'),
      ('Condylectomy of temporomandibular joint','TMJS','21050-00','Excision of the mandibular condyle (condylectomy) for TMJ disease or condylar hyperplasia.','استئصال لقمة المفصل الصدغي الفكي','استئصال لقمة الفك السفلي لمرض المفصل الصدغي الفكي أو فرط تنسّج اللقمة.'),
      ('Meniscectomy of temporomandibular joint','TMJS','21060-00','Partial or complete excision of the TMJ disc (meniscectomy) for internal derangement.','استئصال غضروف المفصل الصدغي الفكي','استئصال جزئي أو كامل لقرص المفصل الصدغي الفكي للاضطراب الداخلي.'),
      ('Coronoidectomy','TMJS','21070-00','Excision of the mandibular coronoid process (eg for hypomobility/ankylosis).','استئصال الناتئ المنقاري للفك السفلي','استئصال الناتئ المنقاري للفك السفلي (مثلاً لنقص الحركة/القَسَط).'),
      ('Manipulation of temporomandibular joint under anaesthesia','TMJS','21073-00','Manipulation of the TMJ under anaesthesia to restore movement in restricted opening.','تحريك المفصل الصدغي الفكي تحت التخدير','تحريك المفصل الصدغي الفكي تحت التخدير لاستعادة الحركة في تقييد الفتح.'),
      ('Arthroplasty of temporomandibular joint, with autograft','TMJS','21240-00','Reconstructive arthroplasty of the TMJ using autologous graft (eg for ankylosis).','رأب المفصل الصدغي الفكي بطعم ذاتي','رأب ترميمي للمفصل الصدغي الفكي بطعم ذاتي (مثلاً للقَسَط).'),
      ('Closed treatment of TMJ dislocation, initial','TMJS','21480-00','Manual reduction of an acute temporomandibular joint dislocation.','معالجة مغلقة لخلع المفصل الصدغي الفكي، أولية','رد يدوي لخلع حاد في المفصل الصدغي الفكي.'),
      ('Closed treatment of TMJ dislocation, complicated','TMJS','21485-00','Closed reduction of a recurrent/complicated TMJ dislocation with fixation.','معالجة مغلقة لخلع المفصل الصدغي الفكي، معقّد','رد مغلق لخلع متكرر/معقّد للمفصل الصدغي الفكي مع تثبيت.'),
      ('Open treatment of temporomandibular dislocation','TMJS','21490-00','Open reduction of a temporomandibular joint dislocation (eg eminectomy for recurrence).','معالجة مفتوحة لخلع المفصل الصدغي الفكي','رد مفتوح لخلع المفصل الصدغي الفكي (مثل استئصال الحدبة للنكس).'),
      -- ── SALV: salivary gland surgery ──────────────────────────────────────
      ('Drainage of parotid abscess','SALV','42300-00','Incision and drainage of a parotid gland abscess.','تصريف خراج الغدة النكفية','شق وتصريف خراج الغدة النكفية.'),
      ('Sialolithotomy, submandibular, uncomplicated, intraoral','SALV','42330-00','Intraoral removal of an uncomplicated submandibular/sublingual salivary calculus.','استئصال حصاة لعابية، تحت الفك، غير معقّد، داخل الفم','إزالة حصاة لعابية تحت الفك/تحت اللسان غير معقّدة عبر الفم.'),
      ('Sialolithotomy, submandibular, complicated, intraoral','SALV','42335-00','Intraoral removal of a complicated (deep/hilar) submandibular salivary calculus.','استئصال حصاة لعابية، تحت الفك، معقّد، داخل الفم','إزالة حصاة لعابية تحت الفك معقّدة (عميقة/سُرّية) عبر الفم.'),
      ('Sialolithotomy, parotid, extraoral','SALV','42340-00','Extraoral removal of a parotid salivary calculus.','استئصال حصاة لعابية نكفية، خارج الفم','إزالة حصاة لعابية نكفية عبر مدخل خارج الفم.'),
      ('Excision of sublingual salivary cyst (ranula)','SALV','42408-00','Excision of a ranula (sublingual mucous cyst) with the sublingual gland.','استئصال القيلة الضفدعية تحت اللسان','استئصال القيلة الضفدعية (كيسة مخاطية تحت اللسان) مع الغدة تحت اللسان.'),
      ('Marsupialization of sublingual salivary cyst (ranula)','SALV','42409-00','Marsupialisation of a ranula by incising and suturing it open.','تسقيف القيلة الضفدعية تحت اللسان','تسقيف القيلة الضفدعية بشقّها وخياطتها مفتوحة.'),
      ('Excision of parotid tumour, lateral lobe, without facial nerve dissection','SALV','42410-00','Excision of a parotid tumour of the lateral lobe without formal facial nerve dissection.','استئصال ورم الغدة النكفية، الفص الجانبي، دون تسليخ العصب الوجهي','استئصال ورم نكفي في الفص الجانبي دون تسليخ رسمي للعصب الوجهي.'),
      ('Excision of submandibular gland','SALV','42440-00','Excision of the submandibular (submaxillary) salivary gland.','استئصال الغدة تحت الفك','استئصال الغدة اللعابية تحت الفك.'),
      ('Excision of sublingual gland','SALV','42450-00','Excision of the sublingual salivary gland.','استئصال الغدة تحت اللسان','استئصال الغدة اللعابية تحت اللسان.'),
      -- ── ONCO: oral cancer resection ───────────────────────────────────────
      ('Excision of lip, transverse wedge','ONCO','40510-00','Transverse wedge excision of the lip with primary closure (eg for lip carcinoma).','استئصال الشفة، إسفيني عرضي','استئصال إسفيني عرضي للشفة مع إغلاق أولي (مثلاً لسرطان الشفة).'),
      ('Excision of lesion of tongue without closure','ONCO','41110-00','Excision of a tongue lesion without primary closure.','استئصال آفة اللسان دون إغلاق','استئصال آفة في اللسان دون إغلاق أولي.'),
      ('Excision of lesion of tongue with closure, anterior','ONCO','41112-00','Excision of a lesion of the anterior two-thirds of the tongue with closure.','استئصال آفة اللسان مع الإغلاق، أمامي','استئصال آفة في الثلثين الأماميين للسان مع الإغلاق.'),
      ('Glossectomy, less than one-half tongue','ONCO','41120-00','Partial glossectomy removing less than half of the tongue for malignancy.','استئصال اللسان، أقل من نصف اللسان','استئصال جزئي للسان يزيل أقل من نصف اللسان لورم خبيث.'),
      ('Hemiglossectomy','ONCO','41130-00','Resection of a lateral half of the tongue (hemiglossectomy) for carcinoma.','استئصال نصف اللسان','استئصال نصف جانبي للسان لسرطانة.'),
      ('Composite glossectomy with floor-of-mouth resection','ONCO','41150-00','Composite resection of tongue, floor of mouth and adjacent mandible for advanced oral cancer.','استئصال اللسان المركّب مع أرضية الفم','استئصال مركّب للسان وأرضية الفم والفك السفلي المجاور لسرطان فموي متقدم.'),
      ('Composite resection (Commando procedure)','ONCO','41155-00','Composite resection of tongue, mandible and floor of mouth with neck dissection (Commando) for advanced cancer.','الاستئصال المركّب (عملية كوماندو)','استئصال مركّب للسان والفك السفلي وأرضية الفم مع تجريف العنق (كوماندو) لسرطان متقدم.'),
      ('Excision of lesion of palate or uvula, without closure','ONCO','42104-00','Excision of a lesion of the palate or uvula without closure.','استئصال آفة الحنك أو اللهاة، دون إغلاق','استئصال آفة في الحنك أو اللهاة دون إغلاق.'),
      ('Excision of lesion of palate or uvula, with simple repair','ONCO','42106-00','Excision of a palatal/uvular lesion with simple primary repair.','استئصال آفة الحنك أو اللهاة، مع إصلاح بسيط','استئصال آفة حنكية/لهاتية مع إصلاح أولي بسيط.'),
      ('Excision of lesion of palate or uvula, with local flap','ONCO','42107-00','Excision of a palatal/uvular lesion with local flap reconstruction.','استئصال آفة الحنك أو اللهاة، بشريحة موضعية','استئصال آفة حنكية/لهاتية مع ترميم بشريحة موضعية.'),
      ('Resection of palate or extensive palatal lesion','ONCO','42120-00','Resection of the palate or extensive resection of a palatal lesion (eg malignancy).','استئصال الحنك أو آفة حنكية واسعة','استئصال الحنك أو استئصال واسع لآفة حنكية (مثل الورم الخبيث).')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('ARCH','ORTH','TMJS','SALV','ONCO')`);
  }
}
