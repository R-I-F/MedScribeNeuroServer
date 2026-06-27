import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL proc_cpts — import batch 1 of 2 (48 new rows). OPHTHAL previously had ZERO proc_cpts.
 * New alpha groups: CATR (cataract/lens), CORN (cornea/ocular-surface keratoplasty), GLAU
 * (glaucoma), RETN (vitreoretinal). Every CPT verified current/active against AAPC
 * (AUDIT_OPHTHAL.md "2E"); two Category III codes (0402T cross-linking, 0671T MIGS stent) are
 * active. Linked to main_diags by migration 144.
 */
export class ImportOphthalProcCpts11750000000142 implements MigrationInterface {
  name = "ImportOphthalProcCpts11750000000142";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── CATR: cataract / lens surgery ─────────────────────────────────────
      ('Phacoemulsification with intraocular lens','CATR','66984-00','Extracapsular cataract removal by phacoemulsification with insertion of an intraocular lens.','استحلاب العدسة مع زرع عدسة داخل العين','إزالة الساد خارج المحفظة بالاستحلاب مع زرع عدسة داخل العين.'),
      ('Complex cataract extraction with intraocular lens','CATR','66982-00','Complex extracapsular cataract surgery (small pupil, weak zonules, dyes/devices) with IOL.','استخراج الساد المعقد مع زرع عدسة','جراحة ساد خارج المحفظة معقدة (حدقة صغيرة، أربطة ضعيفة) مع زرع عدسة.'),
      ('Intracapsular cataract extraction with intraocular lens','CATR','66983-00','One-stage removal of the lens and capsule together with insertion of an IOL.','استخراج الساد داخل المحفظة مع عدسة','إزالة العدسة والمحفظة معاً بمرحلة واحدة مع زرع عدسة.'),
      ('Secondary intraocular lens insertion','CATR','66985-00','Insertion of an intraocular lens in an eye that previously had cataract removal.','زرع عدسة داخل العين ثانوي','زرع عدسة داخل العين في عين سبق استخراج الساد منها.'),
      ('Exchange of intraocular lens','CATR','66986-00','Removal of a previously placed intraocular lens and replacement with another.','تبديل العدسة داخل العين','إزالة عدسة مزروعة سابقاً واستبدالها بأخرى.'),
      ('Surgical removal of secondary membranous cataract','CATR','66830-00','Surgical excision of a secondary membranous (after-)cataract with corneoscleral section.','إزالة الساد الغشائي الثانوي جراحياً','استئصال جراحي للساد الغشائي الثانوي عبر شق قرني صلبوي.'),
      ('Removal of lens material by aspiration','CATR','66840-00','Removal of lens material by aspiration technique (one or more stages).','إزالة مادة العدسة بالشفط','إزالة مادة العدسة بتقنية الشفط (مرحلة أو أكثر).'),
      ('Removal of lens material by phacofragmentation','CATR','66850-00','Removal of lens material by phacofragmentation with aspiration (mechanical or ultrasonic).','إزالة مادة العدسة بالتفتيت','إزالة مادة العدسة بالتفتيت والشفط (آلي أو فوق صوتي).'),
      ('YAG laser posterior capsulotomy','CATR','66821-00','Nd:YAG laser opening of an opacified posterior capsule (after-cataract).','فتح المحفظة الخلفية بليزر الياغ','فتح المحفظة الخلفية المُعتمة بليزر الياغ (الساد التالي).'),
      ('Anterior vitrectomy, partial','CATR','67005-00','Partial removal of vitreous by an anterior approach, e.g. for capsule rupture.','قطع الزجاجي الأمامي الجزئي','إزالة جزئية للزجاجي بمدخل أمامي، مثلاً عند تمزق المحفظة.'),
      -- ── CORN: cornea / ocular-surface ─────────────────────────────────────
      ('Penetrating keratoplasty (phakic)','CORN','65730-00','Full-thickness corneal transplant in an eye with its natural lens.','رأب القرنية النافذ (مع وجود العدسة)','زرع قرنية كامل السماكة في عين ذات عدسة طبيعية.'),
      ('Penetrating keratoplasty in aphakia','CORN','65750-00','Full-thickness corneal transplant in an aphakic eye.','رأب القرنية النافذ في اللاعدسية','زرع قرنية كامل السماكة في عين عديمة العدسة.'),
      ('Penetrating keratoplasty in pseudophakia','CORN','65755-00','Full-thickness corneal transplant in an eye with an intraocular lens.','رأب القرنية النافذ مع عدسة مزروعة','زرع قرنية كامل السماكة في عين بها عدسة مزروعة.'),
      ('Anterior lamellar keratoplasty','CORN','65710-00','Partial-thickness (anterior lamellar) corneal transplant.','رأب القرنية الصفائحي الأمامي','زرع قرنية جزئي السماكة (صفائحي أمامي).'),
      ('Endothelial keratoplasty (DSEK/DMEK)','CORN','65756-00','Selective transplant of corneal endothelium for endothelial decompensation.','رأب القرنية البطاني','زرع انتقائي لبطانة القرنية في قصور البطانة.'),
      ('Amniotic membrane placement, no sutures','CORN','65778-00','Placement of amniotic membrane on the ocular surface without sutures.','وضع الغشاء السلوي دون خياطة','وضع الغشاء السلوي على سطح العين دون خياطة.'),
      ('Corneal collagen cross-linking','CORN','0402T-00','Riboflavin/UV-A cross-linking to halt progression of keratoconus or ectasia.','التشبيك الكولاجيني للقرنية','تشبيك بالريبوفلافين والأشعة فوق البنفسجية لإيقاف تطور القرنية المخروطية.'),
      ('Removal of corneal foreign body with slit lamp','CORN','65222-00','Slit-lamp removal of a corneal foreign body.','إزالة جسم غريب من القرنية بالمصباح الشقي','إزالة جسم غريب من القرنية باستخدام المصباح الشقي.'),
      ('Repair of corneal/scleral laceration with tissue glue','CORN','65286-00','Application of tissue adhesive to repair a corneal or scleral wound.','إصلاح تمزق القرنية/الصلبة باللاصق','استخدام لاصق نسيجي لإصلاح جرح القرنية أو الصلبة.'),
      ('Removal of corneal epithelium (debridement)','CORN','65435-00','Removal of corneal epithelium by abrasion or curettage, with/without chemocauterisation.','إزالة ظهارة القرنية (تنضير)','إزالة ظهارة القرنية بالكشط مع أو دون كي كيميائي.'),
      ('Destruction of corneal lesion','CORN','65450-00','Destruction of a corneal lesion by cryotherapy, photocoagulation or thermocauterisation.','إتلاف آفة القرنية','إتلاف آفة قرنية بالتبريد أو التخثير الضوئي أو الكي الحراري.'),
      ('Corneal relaxing incision for astigmatism','CORN','65772-00','Corneal relaxing incision to correct surgically induced astigmatism.','شق القرنية المُرخي للابؤرية','شق قرني مُرخٍ لتصحيح اللابؤرية المُحدَثة جراحياً.'),
      -- ── GLAU: glaucoma surgery ────────────────────────────────────────────
      ('Trabeculectomy ab externo','GLAU','66170-00','Fistulising glaucoma surgery creating a guarded scleral filtration channel.','استئصال التربيق من الخارج','جراحة جلوكوما ناسورية تنشئ قناة ترشيح صلبوية محمية.'),
      ('Trabeculectomy with scarring (revision)','GLAU','66172-00','Trabeculectomy in an eye with scarring from previous surgery or trauma.','استئصال التربيق مع تندّب (مراجعة)','استئصال التربيق في عين بها تندب من جراحة أو رض سابق.'),
      ('Aqueous shunt to extraocular reservoir','GLAU','66180-00','Implantation of a glaucoma drainage device (tube shunt) to an extraocular reservoir.','تحويلة مائية إلى خزان خارج العين','زرع جهاز تصريف للجلوكوما (أنبوب تحويلة) إلى خزان خارج العين.'),
      ('Insertion of anterior-segment aqueous drainage device','GLAU','66183-00','Insertion of an external anterior-segment aqueous drainage device.','زرع جهاز تصريف مائي للقطعة الأمامية','زرع جهاز تصريف مائي خارجي للقطعة الأمامية.'),
      ('Laser peripheral iridotomy','GLAU','66761-00','Laser creation of an iris opening to relieve pupillary-block angle closure.','فتح القزحية المحيطي بالليزر','إنشاء فتحة في القزحية بالليزر لتخفيف انغلاق الزاوية بالحصار الحدقي.'),
      ('Peripheral iridectomy','GLAU','66625-00','Surgical removal of a peripheral piece of iris through a corneoscleral section.','استئصال القزحية المحيطي','إزالة جراحية لجزء محيطي من القزحية عبر شق قرني صلبوي.'),
      ('Endoscopic cyclophotocoagulation','GLAU','66711-00','Endoscopic laser ablation of the ciliary body to reduce aqueous production.','تخثير الجسم الهدبي بالتنظير','إتلاف الجسم الهدبي بالليزر تنظيرياً لتقليل إنتاج الخلط المائي.'),
      ('Transscleral cyclophotocoagulation','GLAU','66710-00','Transscleral laser destruction of the ciliary body for refractory glaucoma.','تخثير الجسم الهدبي عبر الصلبة','إتلاف الجسم الهدبي بالليزر عبر الصلبة للجلوكوما العنيدة.'),
      ('Laser trabeculoplasty','GLAU','65855-00','Selective/argon laser trabeculoplasty to enhance aqueous outflow.','رأب التربيق بالليزر','رأب التربيق بالليزر الانتقائي/الأرغون لتحسين تصريف الخلط المائي.'),
      ('Canaloplasty (transluminal dilation of Schlemm canal)','GLAU','66174-00','Transluminal dilation of the aqueous outflow canal without a retention device.','رأب قناة شليم','توسيع تجويفي لقناة التصريف المائي دون جهاز احتجاز.'),
      ('Trabecular bypass stent (MIGS)','GLAU','0671T-00','Insertion of an anterior-chamber trabecular bypass stent to lower intraocular pressure.','دعامة تحويل تربيقية (جراحة جلوكوما صغرى التوغل)','زرع دعامة تحويل تربيقية في الحجرة الأمامية لخفض ضغط العين.'),
      -- ── RETN: vitreoretinal surgery ───────────────────────────────────────
      ('Repair of retinal detachment with vitrectomy','RETN','67108-00','Vitrectomy repair of retinal detachment with tamponade and endolaser/cryo as needed.','إصلاح انفصال الشبكية مع قطع الزجاجي','إصلاح انفصال الشبكية بقطع الزجاجي مع الدكّ والليزر/التبريد حسب الحاجة.'),
      ('Scleral buckle for retinal detachment','RETN','67107-00','Repair of rhegmatogenous retinal detachment by scleral buckling.','الحزام الصلبوي لانفصال الشبكية','إصلاح انفصال الشبكية الانشقاقي بالحزام الصلبوي.'),
      ('Retinal detachment repair by cryotherapy','RETN','67101-00','Repair of retinal detachment using cryotherapy, with subretinal-fluid drainage if needed.','إصلاح انفصال الشبكية بالتبريد','إصلاح انفصال الشبكية بالتبريد مع تصريف السائل تحت الشبكي عند الحاجة.'),
      ('Retinal detachment repair by photocoagulation','RETN','67105-00','Repair of retinal detachment using laser photocoagulation.','إصلاح انفصال الشبكية بالتخثير الضوئي','إصلاح انفصال الشبكية بالتخثير الضوئي بالليزر.'),
      ('Pneumatic retinopexy','RETN','67110-00','Intravitreal gas injection to tamponade a retinal break and reattach the retina.','تثبيت الشبكية الهوائي','حقن غاز داخل الزجاجي لدكّ التمزق الشبكي وإعادة التصاق الشبكية.'),
      ('Repair of complex retinal detachment','RETN','67113-00','Vitrectomy repair of complex detachment (e.g. PVR, giant tear) with membrane peeling.','إصلاح انفصال الشبكية المعقد','إصلاح الانفصال المعقد (تكاثر زجاجي شبكي، تمزق عملاق) بقطع الزجاجي وتقشير الأغشية.'),
      ('Pars plana vitrectomy','RETN','67036-00','Mechanical removal of vitreous through a pars plana approach.','قطع الزجاجي عبر الجزء المسطح','إزالة الزجاجي آلياً عبر مدخل الجزء المسطح.'),
      ('Vitrectomy with focal endolaser photocoagulation','RETN','67039-00','Pars plana vitrectomy with focal endolaser photocoagulation.','قطع الزجاجي مع ليزر داخلي بؤري','قطع الزجاجي عبر الجزء المسطح مع تخثير ضوئي داخلي بؤري.'),
      ('Vitrectomy with endolaser panretinal photocoagulation','RETN','67040-00','Pars plana vitrectomy with endolaser panretinal photocoagulation.','قطع الزجاجي مع تخثير ضوئي شامل داخلي','قطع الزجاجي عبر الجزء المسطح مع تخثير ضوئي شبكي شامل داخلي.'),
      ('Vitrectomy with epiretinal membrane peel','RETN','67041-00','Pars plana vitrectomy with removal of preretinal (epiretinal) membrane.','قطع الزجاجي مع تقشير الغشاء فوق الشبكي','قطع الزجاجي عبر الجزء المسطح مع إزالة الغشاء فوق الشبكي.'),
      ('Vitrectomy with internal limiting membrane peel','RETN','67042-00','Pars plana vitrectomy with internal limiting membrane peel (e.g. macular hole).','قطع الزجاجي مع تقشير الغشاء المحدد الداخلي','قطع الزجاجي عبر الجزء المسطح مع تقشير الغشاء المحدد الداخلي (ثقب البقعة).'),
      ('Focal laser photocoagulation of retina','RETN','67210-00','Focal laser photocoagulation of a localised retinal lesion.','التخثير الضوئي البؤري للشبكية','تخثير ضوئي بؤري لآفة شبكية موضعية.'),
      ('Panretinal photocoagulation','RETN','67228-00','Extensive (panretinal) laser photocoagulation for proliferative retinopathy.','التخثير الضوئي الشبكي الشامل','تخثير ضوئي شبكي شامل لاعتلال الشبكية التكاثري.'),
      ('Prophylaxis of retinal detachment, photocoagulation','RETN','67145-00','Laser photocoagulation prophylaxis of a retinal break or lattice degeneration.','وقاية انفصال الشبكية بالتخثير الضوئي','وقاية من انفصال الشبكية بتخثير ضوئي لتمزق شبكي أو تنكس شبكي.'),
      ('Prophylaxis of retinal detachment, cryotherapy','RETN','67141-00','Cryotherapy prophylaxis of a retinal break or thinning to prevent detachment.','وقاية انفصال الشبكية بالتبريد','وقاية من انفصال الشبكية بالتبريد لتمزق أو ترقق شبكي.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM "main_diag_procs" WHERE "procCptId" IN (SELECT id FROM "proc_cpts" WHERE "alphaCode" IN ('CATR','CORN','GLAU','RETN'))`);
    await q.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('CATR','CORN','GLAU','RETN')`);
  }
}
