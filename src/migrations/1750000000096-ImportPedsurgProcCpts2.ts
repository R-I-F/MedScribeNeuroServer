import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PEDSURG proc_cpts — batch 2 of 2 (52 procedures).
 * Groups: BOWL (intestinal resection/Ladd/stoma), NEON (neonatal: Kasai/choledochal/
 * pull-through/atresia), FORG (foregut: pyloromyotomy/fundoplication/gastrostomy),
 * ONCO (tumour resection), SOFT (soft-tissue/skin lesions), THOR (thoracic).
 *
 * Every CPT verified against AAPC; the 2025 deletion of retroperitoneal-tumour codes
 * 49203/49204 was handled by using 60540 (adrenalectomy) + 49186 (intra-abdominal tumour).
 * Links to main_diags are added by migration 097.
 */
export class ImportPedsurgProcCpts21750000000096 implements MigrationInterface {
  name = "ImportPedsurgProcCpts21750000000096";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── BOWL: intestinal resection / Ladd / stoma ────────────────────────
      ('Excision of Meckel diverticulum / omphalomesenteric duct','BOWL','44800-00','Excision of a Meckel diverticulum or omphalomesenteric duct remnant from the ileum.','استئصال رتج ميكل / القناة السرّية المساريقية','استئصال رتج ميكل أو بقايا القناة السرّية المساريقية من اللفائفي.'),
      ('Ladd procedure for malrotation','BOWL','44055-00','Correction of intestinal malrotation by division of Ladd bands and reduction of midgut volvulus.','عملية لاد لسوء الدوران','تصحيح سوء دوران الأمعاء بقطع حزم لاد ورد انفتال الأمعاء المتوسطة.'),
      ('Operative reduction of volvulus/intussusception','BOWL','44050-00','Open operative reduction of a twisted or telescoped segment of intestine.','الرد الجراحي للانفتال/الانغلاف','رد جراحي مفتوح لقطعة معوية منفتلة أو منغلفة.'),
      ('Small bowel resection with anastomosis','BOWL','44120-00','Resection of a single segment of small intestine with primary anastomosis.','استئصال الأمعاء الدقيقة مع المفاغرة','استئصال قطعة واحدة من الأمعاء الدقيقة مع مفاغرة أولية.'),
      ('Small bowel resection with enterostomy (stoma)','BOWL','44125-00','Resection of small intestine with creation of a stoma.','استئصال الأمعاء الدقيقة مع فغر معوي','استئصال الأمعاء الدقيقة مع إنشاء فغر.'),
      ('Enteroenterostomy (intestinal anastomosis)','BOWL','44130-00','Creation of an anastomosis between two segments of intestine.','مفاغرة معوية معوية','إنشاء مفاغرة بين قطعتين من الأمعاء.'),
      ('Ileostomy / jejunostomy creation','BOWL','44310-00','Creation of an ileostomy or jejunostomy for intestinal diversion or decompression.','إنشاء فغر لفائفي/صائمي','إنشاء فغر لفائفي أو صائمي لتحويل الأمعاء أو تخفيف ضغطها.'),
      ('Excision of mesenteric lesion','BOWL','44820-00','Excision of a lesion of the mesentery, eg, a duplication cyst or lymphatic malformation.','استئصال آفة المساريقا','استئصال آفة في المساريقا، مثل كيس ازدواج أو تشوه لمفاوي.'),

      -- ── NEON: neonatal hepatobiliary & atresia surgery ───────────────────
      ('Kasai portoenterostomy (for biliary atresia)','NEON','47701-00','Hepatic portoenterostomy anastomosing a Roux limb to the porta hepatis to drain bile in biliary atresia.','مفاغرة كاساي البابية المعوية','مفاغرة كبدية بابية معوية تصل عروة رو ببوابة الكبد لتصريف الصفراء في رتق القنوات الصفراوية.'),
      ('Excision of choledochal cyst','NEON','47715-00','Excision of a choledochal cyst with biliary-enteric reconstruction.','استئصال كيس القناة الصفراوية المشتركة','استئصال كيس القناة الصفراوية المشتركة مع إعادة بناء صفراوية معوية.'),
      ('Hepaticoenterostomy (biliary-enteric anastomosis)','NEON','47765-00','Anastomosis of the extrahepatic bile ducts to the intestine.','مفاغرة كبدية معوية (صفراوية معوية)','مفاغرة القنوات الصفراوية خارج الكبد بالأمعاء.'),
      ('Pull-through for Hirschsprung (proctectomy + coloanal anastomosis)','NEON','45120-00','Abdominoperineal pull-through resecting the aganglionic segment with coloanal anastomosis.','عملية السحب لمرض هيرشسبرونغ','عملية سحب بطنية عجانية باستئصال القطعة عديمة العقد مع مفاغرة قولونية شرجية.'),
      ('Proctectomy with coloanal anastomosis (pull-through)','NEON','45112-00','Resection of the rectum with coloanal anastomosis.','استئصال المستقيم مع المفاغرة القولونية الشرجية','استئصال المستقيم مع مفاغرة قولونية شرجية.'),
      ('Partial colectomy with anastomosis','NEON','44140-00','Resection of a segment of colon with re-anastomosis, eg, for colonic atresia.','استئصال القولون الجزئي مع المفاغرة','استئصال قطعة من القولون مع إعادة المفاغرة، مثلاً لرتق القولون.'),
      ('Enterectomy for congenital intestinal atresia','NEON','44126-00','Resection of an atretic intestinal segment with end-to-end anastomosis for congenital atresia.','استئصال الأمعاء للرتق الخلقي','استئصال قطعة معوية رتقية مع مفاغرة طرف لطرف للرتق الخلقي.'),

      -- ── FORG: foregut (pyloromyotomy / fundoplication / gastrostomy) ──────
      ('Pyloromyotomy (Ramstedt)','FORG','43520-00','Incision of the hypertrophied pyloric muscle to relieve infantile hypertrophic pyloric stenosis.','بضع عضلة البواب (رامستيدت)','بضع عضلة البواب الضخامية لتخفيف تضيق البواب الضخامي الطفلي.'),
      ('Laparoscopic fundoplication','FORG','43280-00','Laparoscopic wrap of the gastric fundus around the lower oesophagus to control reflux.','طيّ قاع المعدة بالمنظار','لفّ قاع المعدة حول المريء السفلي بالمنظار للتحكم بالارتجاع.'),
      ('Open fundoplication','FORG','43327-00','Open partial or complete fundoplication for gastro-oesophageal reflux.','طيّ قاع المعدة المفتوح','طيّ قاع المعدة الجزئي أو الكامل المفتوح للارتجاع المعدي المريئي.'),
      ('Open gastrostomy','FORG','43830-00','Open placement of a gastrostomy tube for feeding or gastric decompression.','فغر المعدة المفتوح','وضع أنبوب فغر معدي مفتوح للتغذية أو تخفيف ضغط المعدة.'),
      ('Laparoscopic gastrostomy','FORG','43653-00','Laparoscopic placement of a gastrostomy tube.','فغر المعدة بالمنظار','وضع أنبوب فغر معدي بالمنظار.'),
      ('Neonatal gastrostomy','FORG','43831-00','Creation of a gastrostomy for feeding access in a neonate.','فغر المعدة عند حديثي الولادة','إنشاء فغر معدي للتغذية عند حديثي الولادة.'),

      -- ── ONCO: paediatric tumour resection ────────────────────────────────
      ('Radical nephrectomy (for Wilms tumour)','ONCO','50230-00','Radical removal of the kidney with surrounding tissue and regional nodes for a Wilms tumour.','استئصال الكلية الجذري','استئصال جذري للكلية مع النسيج المحيط والعقد الناحية لورم ويلمز.'),
      ('Partial hepatectomy (for hepatoblastoma)','ONCO','47120-00','Resection of a portion of the liver for a hepatic tumour such as hepatoblastoma.','استئصال الكبد الجزئي','استئصال جزء من الكبد لورم كبدي مثل الورم الأرومي الكبدي.'),
      ('Excision of sacrococcygeal/presacral tumour','ONCO','49215-00','Excision of a presacral or sacrococcygeal tumour, with coccygectomy for teratoma.','استئصال الورم العجزي العصعصي','استئصال ورم أمام عجزي أو عجزي عصعصي، مع استئصال العصعص للورم المسخي.'),
      ('Oophorectomy','ONCO','58940-00','Removal of part or all of one or both ovaries, eg, for an ovarian teratoma.','استئصال المبيض','استئصال جزء أو كامل أحد المبيضين أو كليهما، مثلاً لورم مسخي مبيضي.'),
      ('Open biopsy/excision of deep cervical lymph node','ONCO','38510-00','Open biopsy or excision of a deep cervical lymph node for diagnosis (eg, lymphoma).','خزعة/استئصال عقدة لمفية رقبية عميقة','خزعة أو استئصال مفتوح لعقدة لمفية رقبية عميقة للتشخيص (مثل اللمفوما).'),
      ('Radical orchidectomy, inguinal approach','ONCO','54530-00','Radical inguinal orchidectomy for a testicular tumour.','استئصال الخصية الجذري بالمدخل الإربي','استئصال خصية جذري إربي لورم خصوي.'),
      ('Laparoscopic splenectomy','ONCO','38120-00','Complete laparoscopic removal of the spleen, eg, for a splenic cyst.','استئصال الطحال بالمنظار','استئصال كامل للطحال بالمنظار، مثلاً لكيس طحالي.'),
      ('Adrenalectomy (for adrenal neuroblastoma)','ONCO','60540-00','Removal of an adrenal gland, eg, for an adrenal neuroblastoma.','استئصال الغدة الكظرية','استئصال الغدة الكظرية، مثلاً لورم أرومي عصبي كظري.'),
      ('Excision of intra-abdominal tumour, 5 cm or less','ONCO','49186-00','Open excision of one or more intra-abdominal or retroperitoneal tumours up to 5 cm.','استئصال ورم داخل البطن (5 سم أو أقل)','استئصال مفتوح لورم أو أكثر داخل البطن أو خلف الصفاق حتى 5 سم.'),
      ('Excision of deep axillary lymph nodes','ONCO','38525-00','Open excision of deep axillary lymph nodes for diagnosis or staging.','استئصال العقد اللمفية الإبطية العميقة','استئصال مفتوح للعقد اللمفية الإبطية العميقة للتشخيص أو التحديد المرحلي.'),

      -- ── SOFT: soft-tissue & skin lesions ─────────────────────────────────
      ('Excision of thyroglossal duct cyst (Sistrunk)','SOFT','60280-00','Excision of a thyroglossal duct cyst with the central hyoid body (Sistrunk procedure).','استئصال الكيس الدرقي اللساني (سيسترنك)','استئصال الكيس الدرقي اللساني مع جسم العظم اللامي المركزي (عملية سيسترنك).'),
      ('Excision of branchial cleft cyst (skin/subcutaneous)','SOFT','42810-00','Excision of a branchial cleft cyst confined to skin and subcutaneous tissue.','استئصال الكيس الخيشومي (جلدي/تحت جلدي)','استئصال كيس خيشومي محصور في الجلد والنسيج تحت الجلد.'),
      ('Excision of branchial cleft cyst, deep/extending','SOFT','42815-00','Excision of a branchial cleft cyst extending beneath the sternocleidomastoid or to the pharynx.','استئصال الكيس الخيشومي العميق/الممتد','استئصال كيس خيشومي ممتد تحت العضلة القترائية أو إلى البلعوم.'),
      ('Excision of cystic hygroma (cervical/axillary)','SOFT','38550-00','Excision of a cervical or axillary cystic hygroma without deep neurovascular dissection.','استئصال الورم اللمفي الكيسي (الرقبي/الإبطي)','استئصال ورم لمفي كيسي رقبي أو إبطي دون تشريح وعائي عصبي عميق.'),
      ('Excision of pilonidal cyst/sinus, extensive','SOFT','11772-00','Excision of a pilonidal cyst or sinus requiring extensive dissection.','استئصال الكيس/الناسور الشعري الموسّع','استئصال كيس أو ناسور شعري يتطلب تشريحاً موسّعاً.'),
      ('Frenotomy of lingual frenum (tongue-tie)','SOFT','41010-00','Incision of a short lingual frenum to release ankyloglossia.','بضع لجام اللسان','بضع لجام لساني قصير لتحرير التصاق اللسان.'),
      ('Incision and drainage of abscess, complicated','SOFT','10061-00','Incision and drainage of a complicated or multiple cutaneous abscess.','شق وتصريف خراج معقّد','شق وتصريف خراج جلدي معقّد أو متعدد.'),
      ('Excision of subcutaneous soft-tissue tumour, face/scalp under 2 cm','SOFT','21011-00','Excision of a subcutaneous soft-tissue tumour of the face or scalp under 2 cm (eg, dermoid).','استئصال ورم نسيج رخو تحت الجلد بالوجه/فروة الرأس (أقل من 2 سم)','استئصال ورم نسيج رخو تحت الجلد بالوجه أو فروة الرأس أقل من 2 سم (مثل الكيس الجلداني).'),
      ('Excision of soft-tissue tumour, face/scalp 2 cm or larger','SOFT','21013-00','Excision of a subcutaneous soft-tissue tumour of the face or scalp 2 cm or larger.','استئصال ورم نسيج رخو بالوجه/فروة الرأس (2 سم فأكبر)','استئصال ورم نسيج رخو تحت الجلد بالوجه أو فروة الرأس 2 سم فأكبر.'),

      -- ── THOR: thoracic ───────────────────────────────────────────────────
      ('Thoracoscopic (VATS) lobectomy','THOR','32663-00','Video-assisted thoracoscopic resection of a pulmonary lobe (eg, for CPAM or sequestration).','استئصال فص الرئة بالتنظير الصدري','استئصال فص رئوي بالتنظير الصدري بمساعدة الفيديو (مثلاً لتشوه المجرى الهوائي أو العزل الرئوي).'),
      ('Open lobectomy','THOR','32480-00','Open resection of a single pulmonary lobe.','استئصال فص الرئة المفتوح','استئصال مفتوح لفص رئوي واحد.'),
      ('Thoracoscopic excision of mediastinal cyst/mass','THOR','32662-00','Thoracoscopic excision of a mediastinal cyst, tumour or mass (eg, bronchogenic cyst).','استئصال كيس/كتلة المنصف بالتنظير الصدري','استئصال كيس أو ورم أو كتلة بالمنصف بالتنظير الصدري (مثل الكيس القصبي المنشأ).'),
      ('Minimally invasive (Nuss) pectus excavatum repair','THOR','21743-00','Minimally invasive (Nuss) repair of pectus excavatum with thoracoscopic bar placement.','إصلاح الصدر القمعي طفيف التوغل (ناس)','إصلاح طفيف التوغل (ناس) للصدر القمعي مع وضع القضيب بالتنظير الصدري.'),
      ('Open (Ravitch) chest-wall reconstruction for pectus','THOR','21740-00','Open reconstructive repair of pectus excavatum or carinatum (Ravitch).','إعادة بناء جدار الصدر المفتوح (رافيتش)','إصلاح ترميمي مفتوح للصدر القمعي أو الجؤجؤي (رافيتش).'),
      ('Open decortication and parietal pleurectomy (empyema)','THOR','32320-00','Open decortication of the lung with parietal pleurectomy for empyema.','تقشير مفتوح مع استئصال الجنب الجداري (الدبيلة)','تقشير مفتوح للرئة مع استئصال الجنب الجداري للدبيلة.'),
      ('Thoracoscopic (VATS) decortication','THOR','32651-00','Video-assisted thoracoscopic decortication or pleurectomy for empyema.','التقشير بالتنظير الصدري','تقشير أو استئصال الجنب بالتنظير الصدري بمساعدة الفيديو للدبيلة.'),
      ('Tube thoracostomy (chest drain)','THOR','32551-00','Open insertion of a chest tube to drain air or fluid from the pleural space.','فغر الصدر الأنبوبي (نزح الصدر)','إدخال أنبوب صدري مفتوح لنزح الهواء أو السائل من الحيز الجنبي.'),
      ('Thoracoscopic (VATS) bullectomy','THOR','32655-00','Thoracoscopic resection of pulmonary bullae or blebs, eg, for spontaneous pneumothorax.','استئصال الفقاعات بالتنظير الصدري','استئصال الفقاعات الرئوية بالتنظير الصدري، مثلاً لاسترواح الصدر العفوي.'),
      ('Aortopexy (aortic suspension for tracheomalacia)','THOR','33800-00','Suspension of the aortic arch to the sternum to relieve tracheal compression in tracheomalacia.','تثبيت الأبهر (لليونة الرغامى)','تعليق قوس الأبهر إلى عظم القص لتخفيف انضغاط الرغامى في ليونة الرغامى.'),
      ('Thoracic duct ligation, thoracic approach (chylothorax)','THOR','38381-00','Ligation or repair of the thoracic duct via a thoracic approach for chylothorax.','ربط القناة الصدرية بالمدخل الصدري (الانصباب الكيلوسي)','ربط أو إصلاح القناة الصدرية عبر مدخل صدري للانصباب الكيلوسي.'),
      ('Thoracoscopic (VATS) pleurodesis','THOR','32650-00','Thoracoscopic pleurodesis to obliterate the pleural space and prevent recurrence.','إلصاق الجنب بالتنظير الصدري','إلصاق الجنب بالتنظير الصدري لطمس الحيز الجنبي ومنع النكس.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('BOWL','NEON','FORG','ONCO','SOFT','THOR')`);
  }
}
