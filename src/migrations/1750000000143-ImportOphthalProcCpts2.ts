import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL proc_cpts — import batch 2 of 2 (56 new rows). New alpha groups: INJX (intravitreal
 * injection/implant), STRB (strabismus), OPLT (eyelid/oculoplastics), LACR (lacrimal), ORBT
 * (orbit/enucleation), PTRY (conjunctiva/ocular-surface), REFR (corneal refractive), OTRA
 * (ocular trauma). Every CPT verified current/active against AAPC (AUDIT_OPHTHAL.md "2E").
 * Linked to main_diags by migration 144.
 */
export class ImportOphthalProcCpts21750000000143 implements MigrationInterface {
  name = "ImportOphthalProcCpts21750000000143";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── INJX: intravitreal pharmacotherapy ────────────────────────────────
      ('Intravitreal injection of pharmacologic agent','INJX','67028-00','Injection of a drug (e.g. anti-VEGF, steroid) into the vitreous cavity.','حقن دواء داخل الزجاجي','حقن دواء (مثل مضاد VEGF أو ستيرويد) داخل جوف الزجاجي.'),
      ('Injection of vitreous substitute (fluid-gas exchange)','INJX','67025-00','Injection of a vitreous substitute (gas, silicone or fluid) or fluid-gas exchange.','حقن بديل الزجاجي (تبادل سائل-غاز)','حقن بديل للزجاجي (غاز أو سيليكون أو سائل) أو تبادل سائل-غاز.'),
      ('Implantation of intravitreal drug delivery system','INJX','67027-00','Surgical implantation of a sustained-release intravitreal drug delivery device.','زرع نظام توصيل دواء داخل الزجاجي','زرع جهاز توصيل دواء بطيء التحرر داخل الزجاجي.'),
      -- ── STRB: strabismus surgery ──────────────────────────────────────────
      ('Strabismus surgery, one horizontal muscle','STRB','67311-00','Recession or resection of one horizontal extraocular muscle.','جراحة الحول، عضلة أفقية واحدة','تراجع أو استئصال عضلة أفقية واحدة خارج المقلة.'),
      ('Strabismus surgery, two horizontal muscles','STRB','67312-00','Recession or resection of two horizontal extraocular muscles.','جراحة الحول، عضلتان أفقيتان','تراجع أو استئصال عضلتين أفقيتين خارج المقلة.'),
      ('Strabismus surgery, one vertical muscle','STRB','67314-00','Recession or resection of one vertical extraocular muscle.','جراحة الحول، عضلة عمودية واحدة','تراجع أو استئصال عضلة عمودية واحدة خارج المقلة.'),
      ('Strabismus surgery, two or more vertical muscles','STRB','67316-00','Recession or resection of two or more vertical extraocular muscles.','جراحة الحول، عضلتان عموديتان أو أكثر','تراجع أو استئصال عضلتين عموديتين أو أكثر خارج المقلة.'),
      ('Strabismus surgery, superior oblique muscle','STRB','67318-00','Strabismus surgery on the superior oblique muscle.','جراحة الحول، العضلة المائلة العلوية','جراحة الحول على العضلة المائلة العلوية.'),
      ('Transposition of extraocular muscles','STRB','67320-00','Transposition procedure of one or more extraocular muscles.','نقل العضلات خارج المقلة','إجراء نقل لعضلة أو أكثر من عضلات خارج المقلة.'),
      ('Strabismus surgery with scarring','STRB','67332-00','Strabismus surgery on a patient with scarring from prior surgery or trauma.','جراحة الحول مع تندّب','جراحة حول لمريض لديه تندب من جراحة أو رض سابق.'),
      ('Strabismus surgery with detached muscle repair','STRB','67340-00','Strabismus surgery including exploration and repair of a detached extraocular muscle.','جراحة الحول مع إصلاح عضلة منفصلة','جراحة حول تشمل استكشاف وإصلاح عضلة منفصلة خارج المقلة.'),
      ('Chemodenervation of extraocular muscle','STRB','67345-00','Injection of botulinum toxin into an extraocular muscle to realign the eyes.','إزالة التعصيب الكيميائي لعضلة خارج المقلة','حقن ذيفان البوتولينوم في عضلة خارج المقلة لإعادة محاذاة العينين.'),
      -- ── OPLT: eyelid / oculoplastics ──────────────────────────────────────
      ('Ptosis repair, external (levator) approach','OPLT','67904-00','Repair of blepharoptosis by external levator aponeurosis advancement.','إصلاح تدلي الجفن بالرافعة الخارجية','إصلاح تدلي الجفن بتقديم صفاق الرافعة من الخارج.'),
      ('Ptosis repair, frontalis/superior rectus sling','OPLT','67906-00','Repair of blepharoptosis using a fascial sling to the frontalis/superior rectus.','إصلاح تدلي الجفن بحمالة المستقيمة العلوية','إصلاح تدلي الجفن باستخدام حمالة لفافية إلى الجبهية/المستقيمة العلوية.'),
      ('Repair of ectropion, extensive','OPLT','67917-00','Extensive repair of lower-eyelid ectropion (e.g. tarsal-strip procedure).','إصلاح انقلاب الجفن الخارجي، واسع','إصلاح واسع لانقلاب الجفن السفلي للخارج (مثل إجراء الشريط الرصغي).'),
      ('Repair of entropion, extensive','OPLT','67924-00','Extensive repair of lower-eyelid entropion (lid-margin reconstruction).','إصلاح انقلاب الجفن الداخلي، واسع','إصلاح واسع لانقلاب الجفن السفلي للداخل (إعادة بناء حافة الجفن).'),
      ('Excision of chalazion, single','OPLT','67800-00','Incision and curettage of a single chalazion.','استئصال البَردة، مفردة','شق وكشط بَردة مفردة.'),
      ('Excision of chalazia, multiple, same lid','OPLT','67801-00','Excision of multiple chalazia from the same eyelid.','استئصال البَردات، متعددة بنفس الجفن','استئصال بَردات متعددة من نفس الجفن.'),
      ('Correction of trichiasis by epilation, forceps','OPLT','67820-00','Removal of misdirected eyelashes by forceps epilation.','تصحيح داء الشعرة بنزع بالملقط','إزالة الرموش المنحرفة بنزعها بالملقط.'),
      ('Excision and repair of eyelid, up to one-fourth of lid margin','OPLT','67961-00','Full-thickness excision and direct repair of an eyelid lesion up to 1/4 of the lid margin.','استئصال وإصلاح الجفن حتى ربع حافة الجفن','استئصال كامل السماكة وإصلاح مباشر لآفة جفنية حتى ربع حافة الجفن.'),
      ('Suture of recent eyelid wound, partial thickness','OPLT','67930-00','Direct suture of a recent partial-thickness eyelid laceration.','خياطة جرح جفن حديث جزئي السماكة','خياطة مباشرة لتمزق جفني حديث جزئي السماكة.'),
      ('Blepharotomy, drainage of eyelid abscess','OPLT','67700-00','Incision of the eyelid to drain an abscess.','بضع الجفن لتصريف خراج','شق الجفن لتصريف خراج.'),
      ('Temporary closure of eyelids by suture (tarsorrhaphy)','OPLT','67875-00','Temporary suture closure of the eyelids to protect the ocular surface.','إغلاق الجفنين المؤقت بالخياطة','إغلاق الجفنين مؤقتاً بالخياطة لحماية سطح العين.'),
      ('Incisional biopsy of eyelid','OPLT','67810-00','Incisional biopsy of an eyelid skin or margin lesion for histology.','خزعة شقية من الجفن','خزعة شقية لآفة جلد أو حافة الجفن للفحص النسيجي.'),
      -- ── LACR: lacrimal system ─────────────────────────────────────────────
      ('Dacryocystorhinostomy','LACR','68720-00','Creation of a fistula between the lacrimal sac and the nasal cavity for NLD obstruction.','مفاغرة كيس الدمع بالأنف','إنشاء ناسور بين كيس الدمع وجوف الأنف لانسداد القناة الأنفية الدمعية.'),
      ('Closure of lacrimal punctum by plug','LACR','68761-00','Insertion of a punctal plug to retain tears in dry-eye disease.','إغلاق النقطة الدمعية بسدادة','إدخال سدادة نقطية للاحتفاظ بالدموع في جفاف العين.'),
      ('Closure of lacrimal punctum by thermocauterisation','LACR','68760-00','Permanent closure of the lacrimal punctum by thermocauterisation/ligation.','إغلاق النقطة الدمعية بالكي','إغلاق دائم للنقطة الدمعية بالكي الحراري/الربط.'),
      ('Probing of nasolacrimal duct','LACR','68810-00','Probing of the nasolacrimal duct to relieve obstruction.','تسبير القناة الأنفية الدمعية','تسبير القناة الأنفية الدمعية لإزالة الانسداد.'),
      ('Probing of nasolacrimal duct with tube/stent','LACR','68815-00','Probing of the nasolacrimal duct with insertion of a tube or stent.','تسبير القناة الأنفية الدمعية مع أنبوب','تسبير القناة الأنفية الدمعية مع إدخال أنبوب أو دعامة.'),
      ('Probing of lacrimal canaliculi','LACR','68840-00','Probing of the lacrimal canaliculi, with or without irrigation.','تسبير القنيات الدمعية','تسبير القنيات الدمعية مع أو دون غسل.'),
      -- ── ORBT: orbit / globe removal ───────────────────────────────────────
      ('Enucleation of eye with implant','ORBT','65103-00','Removal of the entire globe with insertion of an orbital implant.','استئصال المقلة مع غرسة','إزالة المقلة بالكامل مع زرع غرسة محجرية.'),
      ('Evisceration of ocular contents','ORBT','65091-00','Removal of the intraocular contents leaving the scleral shell.','تفريغ محتويات العين','إزالة محتويات العين الداخلية مع ترك القشرة الصلبوية.'),
      ('Exenteration of orbit','ORBT','65110-00','Removal of the orbital contents for malignancy or extensive disease.','استئصال محتويات المحجر','إزالة محتويات المحجر بسبب ورم خبيث أو مرض واسع.'),
      ('Orbitotomy without bone flap, exploration','ORBT','67400-00','Orbital exploration/biopsy through an anterior approach without a bone flap.','بضع المحجر دون شريحة عظمية، استكشاف','استكشاف/خزعة محجرية بمدخل أمامي دون شريحة عظمية.'),
      ('Orbitotomy without bone flap, removal of lesion','ORBT','67412-00','Removal of an orbital lesion through an anterior approach without a bone flap.','بضع المحجر دون شريحة عظمية، إزالة آفة','إزالة آفة محجرية بمدخل أمامي دون شريحة عظمية.'),
      ('Orbitotomy with bone flap, bone decompression','ORBT','67414-00','Orbital decompression by bone removal through a bone-flap approach.','بضع المحجر مع شريحة عظمية، تخفيف ضغط عظمي','تخفيف ضغط المحجر بإزالة العظم عبر مدخل شريحة عظمية.'),
      ('Orbitotomy with optic nerve decompression','ORBT','67445-00','Orbital surgery with decompression of the optic nerve.','بضع المحجر مع تخفيف ضغط العصب البصري','جراحة محجرية مع تخفيف الضغط عن العصب البصري.'),
      ('Insertion of orbital implant','ORBT','67550-00','Insertion of an orbital implant outside the muscle cone.','زرع غرسة محجرية','زرع غرسة محجرية خارج مخروط العضلات.'),
      -- ── PTRY: conjunctiva / ocular surface ────────────────────────────────
      ('Excision of pterygium with graft','PTRY','65426-00','Excision of a pterygium with conjunctival autograft or amniotic-membrane graft.','استئصال الظفرة مع طعم','استئصال الظفرة مع طعم ملتحمي ذاتي أو غشاء سلوي.'),
      ('Excision of pterygium without graft','PTRY','65420-00','Excision or transposition of a pterygium without a graft.','استئصال الظفرة دون طعم','استئصال أو نقل الظفرة دون طعم.'),
      ('Excision of conjunctival lesion, up to 1 cm','PTRY','68110-00','Excision of a conjunctival lesion up to 1 cm.','استئصال آفة الملتحمة حتى 1 سم','استئصال آفة في الملتحمة حتى 1 سم.'),
      ('Excision of conjunctival lesion, over 1 cm','PTRY','68115-00','Excision of a conjunctival lesion larger than 1 cm.','استئصال آفة الملتحمة أكبر من 1 سم','استئصال آفة في الملتحمة أكبر من 1 سم.'),
      ('Excision of conjunctival lesion with adjacent sclera','PTRY','68130-00','Excision of a conjunctival lesion including adjacent sclera.','استئصال آفة الملتحمة مع الصلبة المجاورة','استئصال آفة ملتحمية تشمل الصلبة المجاورة.'),
      ('Destruction of conjunctival lesion','PTRY','68135-00','Destruction of a conjunctival lesion (e.g. by cryotherapy or cautery).','إتلاف آفة الملتحمة','إتلاف آفة في الملتحمة (مثلاً بالتبريد أو الكي).'),
      ('Division of symblepharon (conjunctivoplasty)','PTRY','68340-00','Division of a symblepharon with conformer/contact lens.','تقسيم التصاق الجفن بالمقلة','تقسيم التصاق الجفن بالمقلة مع مُشكِّل/عدسة لاصقة.'),
      -- ── REFR: corneal refractive surgery ──────────────────────────────────
      ('Keratomileusis (laser refractive keratoplasty)','REFR','65760-00','Reshaping of the cornea with a laser/device to correct refractive error.','تحدّب القرنية (رأب القرنية الانكساري بالليزر)','إعادة تشكيل القرنية بالليزر/جهاز لتصحيح الخطأ الانكساري.'),
      ('Keratophakia','REFR','65765-00','Implantation of a donor corneal lenticule into the anterior cornea to alter refraction.','إقحام القرنية','زرع قرص قرني متبرع في القرنية الأمامية لتغيير الانكسار.'),
      ('Epikeratoplasty','REFR','65767-00','Onlay of a corneal lenticule onto the host cornea to correct ametropia.','رأب القرنية الظهاري','وضع قرص قرني فوق قرنية المضيف لتصحيح سوء الانكسار.'),
      ('Corneal wedge resection for astigmatism','REFR','65775-00','Wedge resection of the cornea to correct surgically induced astigmatism.','استئصال إسفيني من القرنية للابؤرية','استئصال إسفيني من القرنية لتصحيح اللابؤرية المُحدَثة جراحياً.'),
      -- ── OTRA: ocular trauma ───────────────────────────────────────────────
      ('Open repair of orbital floor blowout fracture with implant','OTRA','21390-00','Open repair of an orbital floor blowout fracture with an alloplastic implant.','إصلاح مفتوح لكسر أرضية المحجر مع غرسة','إصلاح مفتوح لكسر أرضية المحجر الانفجاري مع غرسة اصطناعية.'),
      ('Closed treatment of orbital fracture','OTRA','21401-00','Closed treatment of an orbital fracture with manipulation, without incision.','علاج مغلق لكسر المحجر','علاج مغلق لكسر المحجر بالتدوير دون شق.'),
      ('Removal of intraocular foreign body, anterior chamber or lens','OTRA','65235-00','Removal of a foreign body from the anterior chamber or lens.','إزالة جسم غريب داخل العين من الحجرة الأمامية/العدسة','إزالة جسم غريب من الحجرة الأمامية أو العدسة.'),
      ('Removal of intraocular foreign body, posterior segment, magnetic','OTRA','65260-00','Magnet extraction of a metallic foreign body from the posterior segment.','إزالة جسم غريب داخل العين خلفي مغناطيسي','استخراج جسم غريب معدني من القطعة الخلفية بالمغناطيس.'),
      ('Removal of intraocular foreign body, posterior segment, nonmagnetic','OTRA','65265-00','Extraction of a nonmagnetic foreign body from the posterior segment.','إزالة جسم غريب داخل العين خلفي غير مغناطيسي','استخراج جسم غريب غير مغناطيسي من القطعة الخلفية.'),
      ('Repair of perforating corneal/scleral laceration with uveal repositioning','OTRA','65285-00','Repair of a perforating corneoscleral wound with reposition/resection of uveal tissue.','إصلاح تمزق نافذ في القرنية/الصلبة مع إعادة توضيع العنبية','إصلاح جرح قرني صلبوي نافذ مع إعادة توضيع/استئصال نسيج عنبي.'),
      ('Removal of implanted material, anterior segment','OTRA','65920-00','Surgical removal of implanted material from the anterior segment.','إزالة مادة مزروعة من القطعة الأمامية','إزالة جراحية لمادة مزروعة من القطعة الأمامية.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM "main_diag_procs" WHERE "procCptId" IN (SELECT id FROM "proc_cpts" WHERE "alphaCode" IN ('INJX','STRB','OPLT','LACR','ORBT','PTRY','REFR','OTRA'))`);
    await q.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('INJX','STRB','OPLT','LACR','ORBT','PTRY','REFR','OTRA')`);
  }
}
