import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PRS proc_cpts — batch 2 of 2 (52 procedures).
 * Groups: BRST (breast), AEST (aesthetic), MICR (microsurgery & nerve repair),
 * WND (wound debridement & closure), SCRV (scar revision/resurfacing),
 * EXCN (skin/soft-tissue tumour excision), CONT (contracture release).
 *
 * Every CPT code verified against AAPC; none deleted. CPTs already present under
 * other departments' groups (BREA 19357/38525, PRPH 64856/64861) are NOT
 * duplicated here — PRS main_diags link to the existing shared rows in migration 084.
 */
export class ImportPrsProcCpts21750000000083 implements MigrationInterface {
  name = "ImportPrsProcCpts21750000000083";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── BRST: breast reconstruction & reshaping ──────────────────────────
      ('Immediate breast implant insertion','BRST','19340-00','Insertion of a breast prosthesis on the same day as mastectomy for immediate reconstruction.','إدخال زرعة الثدي الفوري','إدخال زرعة ثدي في يوم استئصال الثدي نفسه للترميم الفوري.'),
      ('Delayed breast implant insertion','BRST','19342-00','Insertion or replacement of a breast prosthesis on a separate day from the mastectomy.','إدخال زرعة الثدي المؤجل','إدخال أو استبدال زرعة ثدي في يوم منفصل عن استئصال الثدي.'),
      ('Breast reconstruction with latissimus dorsi flap','BRST','19361-00','Reconstruction of the breast mound using a pedicled latissimus dorsi myocutaneous flap, with or without an implant.','ترميم الثدي بشريحة العضلة الظهرية العريضة','ترميم نتوء الثدي بشريحة جلدية عضلية معنقدة من العضلة الظهرية العريضة، مع أو دون زرعة.'),
      ('Breast reconstruction with free flap','BRST','19364-00','Reconstruction of the breast with a free flap (eg, DIEP/TRAM) and microvascular anastomosis.','ترميم الثدي بشريحة حرة','ترميم الثدي بشريحة حرة (مثل DIEP/TRAM) ومفاغرة وعائية مجهرية.'),
      ('Breast reconstruction with pedicled TRAM flap','BRST','19367-00','Reconstruction of the breast with a pedicled transverse rectus abdominis myocutaneous (TRAM) flap.','ترميم الثدي بشريحة TRAM المعنقدة','ترميم الثدي بشريحة جلدية عضلية معنقدة من العضلة المستقيمة البطنية المعترضة.'),
      ('Open periprosthetic capsulotomy','BRST','19370-00','Open surgical release of the fibrous capsule around a breast implant to treat capsular contracture or malposition.','بضع المحفظة حول الزرعة المفتوح','تحرير جراحي مفتوح للمحفظة الليفية حول زرعة الثدي لعلاج تقفع المحفظة أو سوء الموضع.'),
      ('Periprosthetic capsulectomy','BRST','19371-00','Excision of the periprosthetic capsule around a breast implant, with removal of the implant or contents.','استئصال المحفظة حول الزرعة','استئصال المحفظة حول زرعة الثدي مع إزالة الزرعة أو محتوياتها.'),
      ('Reduction mammaplasty','BRST','19318-00','Removal of excess breast skin and parenchyma with nipple repositioning to reduce and reshape the breast.','تصغير الثدي','إزالة جلد ونسيج ثدي زائد مع إعادة وضع الحلمة لتصغير الثدي وإعادة تشكيله.'),
      ('Mastopexy','BRST','19316-00','Breast lift by excision of redundant skin and tightening of breast tissue to correct ptosis.','رفع الثدي','رفع الثدي باستئصال الجلد الزائد وشد نسيج الثدي لتصحيح التهدل.'),
      ('Revision of reconstructed breast','BRST','19380-00','Revision of a previously reconstructed breast to improve contour, symmetry or correct a complication.','مراجعة الثدي المُرمَّم','مراجعة ثدي سبق ترميمه لتحسين القوام أو التناظر أو تصحيح مضاعفة.'),

      -- ── AEST: aesthetic ──────────────────────────────────────────────────
      ('Upper eyelid blepharoplasty (functional)','AEST','15823-00','Excision of redundant upper-eyelid skin causing visual-field obstruction (functional blepharoplasty).','رأب الجفن العلوي الوظيفي','استئصال جلد الجفن العلوي الزائد المسبب لإعاقة المجال البصري (رأب جفن وظيفي).'),
      ('Upper eyelid blepharoplasty (cosmetic)','AEST','15822-00','Excision of excess upper-eyelid skin to improve the aesthetic appearance of the eye.','رأب الجفن العلوي التجميلي','استئصال جلد الجفن العلوي الزائد لتحسين المظهر التجميلي للعين.'),
      ('Rhytidectomy of cheek, chin and neck (facelift)','AEST','15828-00','Removal of excess skin and fat with redraping of the cheek, chin and neck (lower facelift).','شد الوجه (الخد والذقن والعنق)','إزالة الجلد والشحم الزائد مع إعادة تغطية الخد والذقن والعنق (شد الوجه السفلي).'),
      ('Rhytidectomy of forehead (brow lift)','AEST','15824-00','Smoothing of forehead wrinkles and elevation of the brow by rhytidectomy.','شد الجبهة (رفع الحاجب)','تنعيم تجاعيد الجبهة ورفع الحاجب بشد الجبهة.'),
      ('Primary rhinoplasty','AEST','30400-00','Primary rhinoplasty addressing the bony and cartilaginous framework and nasal tip.','رأب الأنف الأولي','رأب أنف أولي يعالج الهيكل العظمي والغضروفي وطرف الأنف.'),
      ('Panniculectomy (excision of abdominal skin)','AEST','15830-00','Excision of excess skin and subcutaneous tissue of the lower abdomen (panniculectomy).','استئصال المئزر الشحمي البطني','استئصال جلد ونسيج تحت جلدي زائد في أسفل البطن.'),
      ('Abdominoplasty with muscle plication (add-on)','AEST','15847-00','Excision of excess abdominal skin with rectus muscle plication, performed with panniculectomy.','رأب البطن مع طي العضلة (إضافي)','استئصال جلد بطني زائد مع طي العضلة المستقيمة، يُجرى مع استئصال المئزر الشحمي.'),
      ('Suction-assisted lipectomy, trunk','AEST','15877-00','Suction-assisted lipectomy (liposuction) of the trunk to remove localised fat deposits.','شفط الدهون للجذع','شفط الدهون من الجذع لإزالة تراكمات شحمية موضعية.'),
      ('Otoplasty','AEST','69300-00','Reshaping and setback of a prominent or deformed external ear (otoplasty).','رأب الأذن','إعادة تشكيل وتقريب الأذن الخارجية البارزة أو المشوّهة.'),
      ('Repair of blepharoptosis (levator)','AEST','67904-00','Correction of upper-eyelid ptosis by external levator aponeurosis advancement or resection.','إصلاح تدلي الجفن (الرافعة)','تصحيح تدلي الجفن العلوي بتقديم أو استئصال صفاق العضلة الرافعة بالطريق الخارجي.'),

      -- ── MICR: microsurgery & nerve repair ────────────────────────────────
      ('Nerve repair with conduit or vein graft','MICR','64910-00','Repair of a peripheral nerve gap using a synthetic conduit or autologous vein graft.','إصلاح العصب بقناة أو طعم وريدي','إصلاح فجوة عصب محيطي باستخدام قناة صناعية أو طعم وريدي ذاتي.'),
      ('Suture of digital nerve','MICR','64831-00','Microsurgical neurorrhaphy of a lacerated digital nerve of the hand or foot.','خياطة العصب الرقمي','خياطة عصبية مجهرية لعصب رقمي ممزق في اليد أو القدم.'),
      ('Nerve graft, head or neck','MICR','64885-00','Reconstruction of a head or neck nerve gap (eg, facial nerve) with a graft up to 4 cm.','طعم عصبي للرأس أو العنق','إعادة بناء فجوة عصب في الرأس أو العنق (مثل العصب الوجهي) بطعم حتى 4 سم.'),
      ('Nerve graft, arm or leg','MICR','64892-00','Single-strand nerve graft (up to 4 cm) to bridge a nerve defect in an arm or leg.','طعم عصبي للذراع أو الساق','طعم عصبي مفرد (حتى 4 سم) لجسر عيب عصبي في الذراع أو الساق.'),
      ('Regional muscle transfer for facial paralysis','MICR','15845-00','Regional muscle transfer (eg, temporalis) for facial reanimation in facial nerve paralysis.','نقل عضلة موضعية لشلل الوجه','نقل عضلة موضعية (مثل الصدغية) لإعادة تحريك الوجه في شلل العصب الوجهي.'),
      ('Free muscle flap for facial reanimation','MICR','15842-00','Free functioning muscle flap (eg, gracilis) with microvascular and neural coaptation for facial reanimation.','شريحة عضلية حرة لإعادة تحريك الوجه','شريحة عضلية حرة عاملة (مثل الناحلة) مع مفاغرة وعائية مجهرية ووصل عصبي لإعادة تحريك الوجه.'),

      -- ── WND: wound debridement & closure ─────────────────────────────────
      ('Debridement, subcutaneous tissue','WND','11042-00','Surgical debridement of devitalised skin and subcutaneous tissue (first 20 sq cm or less).','تنضير النسيج تحت الجلد','تنضير جراحي للجلد والنسيج تحت الجلد الميت (أول 20 سم² أو أقل).'),
      ('Debridement, muscle and/or fascia','WND','11043-00','Surgical debridement of devitalised muscle and/or fascia (first 20 sq cm or less).','تنضير العضل و/أو اللفافة','تنضير جراحي للعضل و/أو اللفافة الميتة (أول 20 سم² أو أقل).'),
      ('Selective debridement of open wound','WND','97597-00','Selective debridement of a non-viable open wound (20 sq cm or less), eg, with sharp instruments.','تنضير انتقائي للجرح المفتوح','تنضير انتقائي لجرح مفتوح غير حيوي (20 سم² أو أقل)، مثلاً بأدوات حادة.'),
      ('Secondary closure of wound dehiscence','WND','13160-00','Secondary closure of an extensive surgical wound or dehiscence.','إغلاق ثانوي لتفزر الجرح','إغلاق ثانوي لجرح جراحي واسع أو تفزره.'),
      ('Intermediate repair, neck or hands','WND','12044-00','Layered (intermediate) repair of a wound of the neck, hands, feet or genitalia, 7.6-12.5 cm.','إصلاح متوسط للعنق أو اليدين','إصلاح طبقي (متوسط) لجرح في العنق أو اليدين أو القدمين أو الأعضاء التناسلية، 7.6-12.5 سم.'),
      ('Complex repair, face','WND','13132-00','Complex repair of a wound of the face, ears, eyelids, nose or lips, 2.6-7.5 cm.','إصلاح معقد للوجه','إصلاح معقد لجرح في الوجه أو الأذنين أو الجفون أو الأنف أو الشفتين، 2.6-7.5 سم.'),
      ('Complex repair, trunk','WND','13101-00','Complex layered repair of a wound of the trunk, 2.6-7.5 cm.','إصلاح معقد للجذع','إصلاح طبقي معقد لجرح في الجذع، 2.6-7.5 سم.'),

      -- ── SCRV: scar revision & resurfacing ────────────────────────────────
      ('Z-plasty / adjacent tissue transfer, trunk','SCRV','14000-00','Adjacent tissue transfer or Z-plasty of the trunk (defect 10 sq cm or less) for scar revision.','رأب Z / نقل نسيج مجاور للجذع','نقل نسيج مجاور أو رأب Z في الجذع (عيب 10 سم² أو أقل) لتصحيح الندبة.'),
      ('Dermabrasion, total face','SCRV','15780-00','Mechanical dermabrasion of the entire face to improve scars, rhytides or pigmentary change.','سحج الجلد لكامل الوجه','سحج ميكانيكي لكامل الوجه لتحسين الندبات أو التجاعيد أو التغير الصباغي.'),
      ('Dermabrasion, segmental face','SCRV','15781-00','Segmental dermabrasion of part of the face to refine localised scars or lesions.','سحج الجلد لجزء من الوجه','سحج جزئي لجزء من الوجه لتحسين ندبات أو آفات موضعية.'),
      ('Dermabrasion of a single lesion','SCRV','15786-00','Abrasion of a single cutaneous lesion or scar by mechanical dermabrasion.','سحج آفة جلدية مفردة','سحج آفة جلدية أو ندبة مفردة بالسحج الميكانيكي.'),
      ('Excision of scar, trunk or extremities','SCRV','11406-00','Excision of a benign lesion or scar over 4 cm from the trunk, arms or legs with closure.','استئصال ندبة للجذع أو الأطراف','استئصال آفة حميدة أو ندبة أكبر من 4 سم من الجذع أو الذراعين أو الساقين مع الإغلاق.'),
      ('Complex repair (scar revision), trunk','SCRV','13100-00','Complex repair of a trunk wound 1.1-2.5 cm, used for scar revision closure.','إصلاح معقد (تصحيح ندبة) للجذع','إصلاح معقد لجرح في الجذع 1.1-2.5 سم، يُستخدم لإغلاق تصحيح الندبة.'),

      -- ── EXCN: skin & soft-tissue tumour excision ─────────────────────────
      ('Excision of malignant lesion, trunk or extremities, over 4 cm','EXCN','11606-00','Excision with margins of a malignant skin lesion over 4 cm of the trunk, arms or legs.','استئصال آفة خبيثة للجذع أو الأطراف أكبر من 4 سم','استئصال مع الحواف لآفة جلدية خبيثة أكبر من 4 سم في الجذع أو الذراعين أو الساقين.'),
      ('Excision of malignant lesion, face, over 4 cm','EXCN','11646-00','Excision with margins of a malignant skin lesion over 4 cm of the face, ears, eyelids, nose or lips.','استئصال آفة خبيثة للوجه أكبر من 4 سم','استئصال مع الحواف لآفة جلدية خبيثة أكبر من 4 سم في الوجه أو الأذنين أو الجفون أو الأنف أو الشفتين.'),
      ('Excision of malignant lesion, scalp or hands, over 4 cm','EXCN','11626-00','Excision with margins of a malignant skin lesion over 4 cm of the scalp, neck, hands, feet or genitalia.','استئصال آفة خبيثة لفروة الرأس أو اليدين أكبر من 4 سم','استئصال مع الحواف لآفة جلدية خبيثة أكبر من 4 سم في فروة الرأس أو العنق أو اليدين أو القدمين أو الأعضاء التناسلية.'),
      ('Mohs micrographic surgery, first stage','EXCN','17311-00','Staged microscopically controlled (Mohs) excision of a malignant skin tumour, first stage.','جراحة موس المجهرية، المرحلة الأولى','استئصال مرحلي مضبوط مجهرياً (موس) لورم جلدي خبيث، المرحلة الأولى.'),
      ('Superficial lymph node biopsy/excision','EXCN','38500-00','Open biopsy or excision of a superficial lymph node (eg, sentinel node) for melanoma or skin cancer staging.','خزعة/استئصال عقدة لمفية سطحية','خزعة مفتوحة أو استئصال عقدة لمفية سطحية (مثل العقدة الخفيرة) لتحديد مرحلة الميلانوما أو سرطان الجلد.'),
      ('Radical resection of soft-tissue tumour, face or scalp','EXCN','21015-00','Radical (extensive) resection of a soft-tissue tumour of the face or scalp.','استئصال جذري لورم نسيجي رخو في الوجه أو فروة الرأس','استئصال جذري (واسع) لورم نسيجي رخو في الوجه أو فروة الرأس.'),
      ('Radical resection of soft-tissue tumour, back or flank','EXCN','21930-00','Radical resection of a subcutaneous soft-tissue tumour of the back or flank.','استئصال جذري لورم نسيجي رخو في الظهر أو الخاصرة','استئصال جذري لورم نسيجي رخو تحت الجلد في الظهر أو الخاصرة.'),
      ('Excision of malignant lesion, face, 3.1-4 cm','EXCN','11644-00','Excision with margins of a malignant skin lesion 3.1-4 cm of the face, ears, eyelids, nose or lips.','استئصال آفة خبيثة للوجه 3.1-4 سم','استئصال مع الحواف لآفة جلدية خبيثة 3.1-4 سم في الوجه أو الأذنين أو الجفون أو الأنف أو الشفتين.'),

      -- ── CONT: contracture release ────────────────────────────────────────
      ('Fasciectomy for Dupuytren, single digit','CONT','26123-00','Partial palmar fasciectomy with release of a single digit for Dupuytren contracture.','استئصال اللفافة لداء دوبيتران لإصبع واحد','استئصال جزئي للفافة الراحية مع تحرير إصبع واحد لتقفع دوبيتران.'),
      ('Palmar fasciotomy','CONT','26045-00','Open division of the palmar fascia to release a Dupuytren cord.','بضع اللفافة الراحية','بضع مفتوح للفافة الراحية لتحرير حبل دوبيتران.'),
      ('Digital tenotomy','CONT','26060-00','Tenotomy of a single digit to relieve a fixed flexion deformity from tendon shortening.','بضع وتر الإصبع','بضع وتر إصبع واحد لتخفيف تشوه انثناء ثابت ناجم عن قصر الوتر.'),
      ('Excision of constriction ring of finger','CONT','26596-00','Excision of a constricting fibrous ring of a finger with Z-plasty reconstruction.','استئصال حلقة الانقباض في الإصبع','استئصال حلقة ليفية مُضيِّقة في الإصبع مع ترميم برأب Z.'),
      ('Adjacent tissue transfer for contracture release, face or hand','CONT','14040-00','Adjacent tissue transfer (eg, Z-plasty) of the face, neck or hand to release a contracture (defect 10 sq cm or less).','نقل نسيج مجاور لتحرير التقفع في الوجه أو اليد','نقل نسيج مجاور (مثل رأب Z) في الوجه أو العنق أو اليد لتحرير تقفع (عيب 10 سم² أو أقل).')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('BRST','AEST','MICR','WND','SCRV','EXCN','CONT')`);
  }
}
