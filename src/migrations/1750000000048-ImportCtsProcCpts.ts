import { MigrationInterface, QueryRunner } from "typeorm";

export class ImportCtsProcCpts1750000000048 implements MigrationInterface {
  name = "ImportCtsProcCpts1750000000048";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── CARD: Cardiac Surgery procedures ─────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      (
        'CABG single vessel','CARD','33510-00',
        'Coronary artery bypass grafting using saphenous vein or arterial graft, single vessel.',
        'مجازة الشريان التاجي (وعاء دموي واحد)',
        'مجازة شريان تاجي واحد باستخدام الوريد الصافن أو الطعم الشرياني لاستعادة التروية القلبية.'
      ),
      (
        'CABG two vessels','CARD','33511-00',
        'Coronary artery bypass grafting, two vessels.',
        'مجازة الشريان التاجي (وعاءان دمويان)',
        'مجازة شريانين تاجيين متضيقين لاستعادة تدفق الدم الكافي لعضلة القلب.'
      ),
      (
        'CABG three vessels','CARD','33512-00',
        'Coronary artery bypass grafting, three vessels.',
        'مجازة الشريان التاجي (ثلاثة أوعية)',
        'مجازة ثلاثة شرايين تاجية لاستعادة التروية القلبية الكاملة في مرض الشرايين الثلاثية.'
      ),
      (
        'CABG four or more vessels','CARD','33516-00',
        'Coronary artery bypass grafting, four or more vessels.',
        'مجازة الشريان التاجي (أربعة أوعية أو أكثر)',
        'مجازة أربعة شرايين تاجية أو أكثر في حالات أمراض الشرايين التاجية الشاملة.'
      ),
      (
        'off-pump CABG single vessel','CARD','33533-00',
        'Off-pump coronary artery bypass grafting using arterial graft, single vessel, performed on a beating heart without cardiopulmonary bypass.',
        'مجازة تاجية بدون مضخة (وعاء واحد)',
        'مجازة شريان تاجي واحد بالطعم الشرياني دون استخدام جهاز القلب والرئة الاصطناعي.'
      ),
      (
        'off-pump CABG three vessels','CARD','33535-00',
        'Off-pump coronary artery bypass grafting using arterial graft, three vessels.',
        'مجازة تاجية بدون مضخة (ثلاثة أوعية)',
        'مجازة ثلاثة شرايين تاجية بالطعم الشرياني دون استخدام جهاز القلب والرئة.'
      ),
      (
        'off-pump CABG four or more vessels','CARD','33536-00',
        'Off-pump coronary artery bypass grafting using arterial graft, four or more vessels.',
        'مجازة تاجية بدون مضخة (أربعة أوعية أو أكثر)',
        'مجازة أربعة شرايين تاجية أو أكثر بالطعم الشرياني دون استخدام جهاز القلب والرئة.'
      ),
      (
        'aortic valve replacement','CARD','33405-00',
        'Replacement of aortic valve with prosthetic (mechanical or biological) valve under cardiopulmonary bypass.',
        'استبدال الصمام الأورطي',
        'استبدال الصمام الأورطي بصمام اصطناعي ميكانيكي أو بيولوجي تحت الدوران القلبي الرئوي.'
      ),
      (
        'aortic valve replacement with annuloplasty','CARD','33411-00',
        'Replacement of aortic valve with prosthetic valve including aortic annulus enlargement to accommodate a larger prosthesis.',
        'استبدال الصمام الأورطي مع توسيع الحلقة',
        'استبدال الصمام الأورطي مع توسيع الحلقة الأورطية جراحياً لاستيعاب صمام بديل أكبر حجماً.'
      ),
      (
        'aortic root replacement','CARD','33413-00',
        'Aortic root reconstruction with composite valve graft (Bentall procedure) including coronary ostia reimplantation.',
        'استبدال جذر الأبهر (بنتال)',
        'إعادة بناء جذر الأبهر بطعم مركب مع الصمام وإعادة زرع أوعية التاجية في الطعم الجديد.'
      ),
      (
        'mitral valve replacement','CARD','33430-00',
        'Replacement of mitral valve with prosthetic (mechanical or biological) valve under cardiopulmonary bypass.',
        'استبدال الصمام التاجي',
        'استبدال الصمام التاجي بصمام اصطناعي ميكانيكي أو بيولوجي تحت الدوران القلبي الرئوي.'
      ),
      (
        'mitral commissurotomy','CARD','33425-00',
        'Repair of mitral valve stenosis by commissurotomy (splitting fused leaflets) under cardiopulmonary bypass.',
        'إصلاح الصمام التاجي بالكوميسوروتومي',
        'إصلاح الصمام التاجي المتضيق بشق الصوار الروماتيزمي الملتحم تحت الدوران القلبي الرئوي.'
      ),
      (
        'mitral valvuloplasty','CARD','33426-00',
        'Repair of mitral valve with extracorporeal circulation; valve-preserving reconstruction.',
        'إصلاح الصمام التاجي',
        'إصلاح الصمام التاجي مع الحفاظ على بنيته الطبيعية باستخدام الدوران القلبي الرئوي.'
      ),
      (
        'mitral valve radical repair','CARD','33427-00',
        'Radical reconstruction of the mitral valve apparatus including annuloplasty, chordal repair, and leaflet augmentation.',
        'إصلاح الصمام التاجي الجذري',
        'إعادة بناء جذرية شاملة لجهاز الصمام التاجي تشمل الحلقة والأوتار والشرفات.'
      ),
      (
        'tricuspid valvectomy','CARD','33460-00',
        'Excision of tricuspid valve without replacement; performed for severe infective endocarditis.',
        'استئصال الصمام ثلاثي الشرفات',
        'استئصال الصمام ثلاثي الشرفات بدون استبدال في حالات التهاب الشغاف المعدي الشديد.'
      ),
      (
        'tricuspid valvuloplasty','CARD','33463-00',
        'Repair of tricuspid valve without annuloplasty ring insertion.',
        'إصلاح الصمام ثلاثي الشرفات',
        'إصلاح الصمام ثلاثي الشرفات بالخياطة المباشرة دون حلقة داعمة.'
      ),
      (
        'tricuspid annuloplasty','CARD','33464-00',
        'Repair of tricuspid valve with prosthetic annuloplasty ring to reduce annular dilatation.',
        'حلقة إصلاح الصمام ثلاثي الشرفات',
        'تضييق حلقة الصمام ثلاثي الشرفات المتوسعة باستخدام حلقة إصلاح مجهزة.'
      ),
      (
        'tricuspid valve replacement','CARD','33465-00',
        'Replacement of tricuspid valve with prosthetic valve under cardiopulmonary bypass.',
        'استبدال الصمام ثلاثي الشرفات',
        'استبدال الصمام ثلاثي الشرفات بصمام اصطناعي في حالات القصور الشديد غير القابل للإصلاح.'
      ),
      (
        'pulmonary valve replacement','CARD','33472-00',
        'Replacement of pulmonary valve with prosthetic valve under cardiopulmonary bypass.',
        'استبدال الصمام الرئوي',
        'استبدال الصمام الرئوي بصمام اصطناعي تحت الدوران القلبي الرئوي.'
      ),
      (
        'ascending aorta graft','CARD','33860-00',
        'Replacement of ascending aorta with tubular graft under cardiopulmonary bypass for aneurysm or dissection.',
        'ترقيع الأبهر الصاعد',
        'استبدال الأبهر الصاعد بطعم أنبوبي تحت الدوران القلبي الرئوي لعلاج التمدد أو التشريح.'
      ),
      (
        'Bentall procedure','CARD','33863-00',
        'Composite replacement of the aortic root and ascending aorta with valve-conduit graft including reimplantation of coronary ostia.',
        'عملية بنتال',
        'استبدال جذر الأبهر والأبهر الصاعد بطعم مركب مع الصمام وإعادة زرع الشرايين التاجية.'
      ),
      (
        'aortic arch graft','CARD','33870-00',
        'Replacement of transverse aortic arch under deep hypothermic circulatory arrest for arch aneurysm or dissection.',
        'ترقيع قوس الأبهر',
        'استبدال قوس الأبهر تحت التوقف الدوراني بالبرودة العميقة لعلاج التمدد أو التشريح الشامل.'
      ),
      (
        'descending thoracic aorta graft','CARD','33875-00',
        'Replacement of descending thoracic aorta with tubular graft for aneurysm or chronic type B dissection.',
        'ترقيع الأبهر الصدري النازل',
        'استبدال الأبهر الصدري النازل بطعم أنبوبي لعلاج التمدد أو تشريح النوع B المزمن.'
      ),
      (
        'pericardiotomy','CARD','33020-00',
        'Pericardiotomy for removal of clot, foreign body, or acute pericardial drainage.',
        'فتح التأمور',
        'شق كيس التأمور لإزالة الجلطة أو الجسم الغريب أو تصريف الانصباب التأموري الحاد.'
      ),
      (
        'pericardial window','CARD','33025-00',
        'Creation of pericardial window for drainage of pericardial effusion or tamponade.',
        'نافذة التأمور',
        'إنشاء نافذة في التأمور لتصريف الانصباب التأموري أو دكاك القلب بصورة مستدامة.'
      ),
      (
        'pericardiectomy partial','CARD','33030-00',
        'Partial pericardiectomy under cardiopulmonary bypass for constrictive pericarditis.',
        'استئصال التأمور الجزئي',
        'استئصال جزء من التأمور تحت الدوران القلبي الرئوي لعلاج التهاب التأمور الانقباضي.'
      ),
      (
        'pericardiectomy complete','CARD','33031-00',
        'Total pericardiectomy under cardiopulmonary bypass for severe constrictive pericarditis.',
        'استئصال التأمور الكامل',
        'استئصال كامل التأمور تحت الدوران القلبي الرئوي لعلاج التهاب التأمور الانقباضي الشديد.'
      ),
      (
        'permanent pacemaker dual chamber','CARD','33208-00',
        'Insertion of permanent dual-chamber pacemaker with transvenous atrial and ventricular electrodes.',
        'زرع منظم نبضات القلب ثنائي الغرفة',
        'زرع جهاز تنظيم نبضات القلب الدائم بقطبين أذيني وبطيني عبر الأوردة.'
      ),
      (
        'ICD implantation','CARD','33249-00',
        'Implantable cardioverter-defibrillator insertion with transvenous sensing and defibrillation leads for life-threatening arrhythmia.',
        'زرع جهاز إزالة الرجفان القلبي',
        'زرع جهاز إزالة الرجفان القلبي الداخلي للوقاية من اضطرابات النظم الخطيرة المهددة للحياة.'
      ),
      (
        'ASD repair','CARD','33641-00',
        'Repair of atrial septal defect by direct suture or patch closure under cardiopulmonary bypass.',
        'إصلاح عيب الحاجز الأذيني',
        'إصلاح عيب الحاجز الأذيني بالخياطة المباشرة أو الرقعة تحت الدوران القلبي الرئوي.'
      ),
      (
        'VSD repair','CARD','33684-00',
        'Closure of ventricular septal defect with patch under cardiopulmonary bypass.',
        'إصلاح عيب الحاجز البطيني',
        'إغلاق عيب الحاجز البطيني بالرقعة تحت الدوران القلبي الرئوي.'
      ),
      (
        'tetralogy of fallot repair','CARD','33692-00',
        'Complete intracardiac repair of tetralogy of fallot including VSD closure and right ventricular outflow tract reconstruction.',
        'إصلاح رباعية فالو',
        'الإصلاح الجذري الكامل لرباعية فالو شامل إغلاق عيب الحاجز البطيني وتوسيع مخرج البطين الأيمن.'
      ),
      (
        'arterial switch operation','CARD','33770-00',
        'Jatene arterial switch operation for transposition of great arteries including coronary artery transfer.',
        'عملية تبديل الشرايين (جاتين)',
        'تصحيح تبادل الأوعية الكبرى بقطع الشريانين وتبديل موضعهما مع إعادة زرع الشرايين التاجية.'
      ),
      (
        'modified Blalock-Taussig shunt','CARD','33750-00',
        'Systemic-to-pulmonary artery shunt (modified Blalock-Taussig) for palliation of cyanotic congenital heart disease.',
        'تحويلة بلالوك-توسيج المعدلة',
        'إنشاء تحويلة بين الشريان تحت الترقوة والشريان الرئوي لزيادة التدفق الرئوي في العيوب القلبية الزرقاوية.'
      ),
      (
        'bidirectional Glenn shunt','CARD','33768-00',
        'Bidirectional cavopulmonary anastomosis (Glenn) connecting superior vena cava to pulmonary artery for single-ventricle palliation.',
        'عملية جلين ثنائية الاتجاه',
        'مفاغرة بين الوريد الأجوف العلوي والشريان الرئوي لتحسين الأوكسجة في قلب أحادي البطين.'
      ),
      (
        'PDA ligation','CARD','33820-00',
        'Ligation and division of patent ductus arteriosus to eliminate abnormal left-to-right shunt.',
        'ربط القناة الشريانية السالكة',
        'ربط وقطع القناة الشريانية السالكة لإلغاء التحويل الدموي غير الطبيعي من الشريان الأورطي إلى الرئوي.'
      ),
      (
        'coarctation repair','CARD','33851-00',
        'Repair of aortic coarctation by resection with end-to-end anastomosis or graft interposition.',
        'إصلاح تضيق الأبهر',
        'استئصال منطقة تضيق الأبهر وتوصيل الطرفين مباشرةً أو باستخدام طعم لإعادة الاستمرارية.'
      ),
      (
        'heart transplantation','CARD','33940-00',
        'Orthotopic heart transplantation for end-stage heart failure refractory to medical and device therapy.',
        'زرع القلب',
        'زرع القلب الكامل في حالات الفشل القلبي النهائي المقاوم للعلاج الدوائي والأجهزة الداعمة.'
      ),
      (
        'LVAD insertion','CARD','33975-00',
        'Implantation of left ventricular assist device (LVAD) for bridge-to-transplant or destination therapy in advanced heart failure.',
        'زرع جهاز مساعدة البطين الأيسر',
        'زرع جهاز ميكانيكي لمساعدة البطين الأيسر كجسر للزراعة أو علاج نهائي في الفشل القلبي المتقدم.'
      ),
      (
        'ECMO initiation','CARD','33960-00',
        'Initiation and management of extracorporeal membrane oxygenation (ECMO/ECLS) for cardiogenic shock or cardiac arrest.',
        'بدء تشغيل جهاز الأكسجة الغشائي الخارجي',
        'بدء الأكسجة الغشائية خارج الجسم لدعم القلب والرئة في الصدمة القلبية أو السكتة القلبية.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);

    // ── THOR: Thoracic Surgery procedures ────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      (
        'pneumonectomy','THOR','32440-00',
        'Total removal of one lung for malignancy, extensive benign disease, or destroyed lung.',
        'استئصال الرئة الكامل',
        'استئصال الرئة بالكامل لعلاج السرطان أو التدمر الرئوي الشديد أو الأمراض الرئوية المتقدمة.'
      ),
      (
        'lobectomy upper lobe','THOR','32480-00',
        'Surgical removal of the upper lobe of the lung for primary or secondary malignancy or benign disease.',
        'استئصال الفص العلوي من الرئة',
        'إزالة الفص العلوي الرئوي لعلاج الأورام الأولية أو الثانوية أو الأمراض الموضعية.'
      ),
      (
        'lobectomy middle lobe','THOR','32482-00',
        'Surgical removal of the middle lobe of the right lung.',
        'استئصال الفص الأوسط من الرئة',
        'إزالة الفص الأوسط من الرئة اليمنى لعلاج الأورام أو التدمر الموضعي أو متلازمة الفص الأوسط.'
      ),
      (
        'lobectomy lower lobe','THOR','32484-00',
        'Surgical removal of the lower lobe of the lung for malignancy or benign disease.',
        'استئصال الفص السفلي من الرئة',
        'إزالة الفص السفلي الرئوي لعلاج الأورام أو توسع القصبات الشديد أو الأمراض الموضعية.'
      ),
      (
        'wedge resection','THOR','32500-00',
        'Nonanatomic wedge resection of peripheral lung tissue for biopsy, metastasectomy, or small peripheral lesion.',
        'استئصال وتري من الرئة',
        'إزالة إسفينية من نسيج الرئة المحيطي للتشخيص أو استئصال النقائل أو البؤر الصغيرة.'
      ),
      (
        'VATS pleurodesis','THOR','32650-00',
        'Thoracoscopic pleurodesis using talc or chemical agent to fuse visceral and parietal pleura.',
        'إلصاق الجنب بالتنظير الصدري',
        'إلصاق طبقتي غشاء الجنب بمادة كيميائية عبر التنظير الصدري لمنع تكرار الاسترواح أو الانصباب.'
      ),
      (
        'VATS partial pleurectomy','THOR','32651-00',
        'Thoracoscopic partial resection of parietal pleura for recurrent pneumothorax or pleural disease.',
        'استئصال جزئي للجنب بالتنظير',
        'إزالة جزء من غشاء الجنب الجداري عبر التنظير الصدري لعلاج الاسترواح المتكرر.'
      ),
      (
        'VATS decortication','THOR','32652-00',
        'Thoracoscopic total pleurectomy with decortication for organized empyema or fibrothorax.',
        'تقشير الرئة بالتنظير الصدري',
        'إزالة القشرة الليفية عن سطح الرئة عبر التنظير الصدري لعلاج الدبيلة المنظمة أو التليف الجنبي.'
      ),
      (
        'VATS bullectomy','THOR','32655-00',
        'Thoracoscopic excision of pulmonary bullae for recurrent or tension pneumothorax.',
        'استئصال البثور الرئوية بالتنظير',
        'إزالة البثور الهوائية الرئوية عبر التنظير الصدري لعلاج استرواح الصدر المتكرر أو التوتري.'
      ),
      (
        'VATS pericardiectomy','THOR','32660-00',
        'Thoracoscopic pericardiectomy for pericardial effusion or constrictive pericarditis.',
        'استئصال التأمور بالتنظير الصدري',
        'استئصال كيس التأمور عبر التنظير الصدري لعلاج الانصباب التأموري أو الالتهاب الانقباضي.'
      ),
      (
        'VATS lobectomy','THOR','32663-00',
        'Thoracoscopic anatomic lobectomy for lung cancer or benign disease.',
        'استئصال فص رئوي بالتنظير',
        'استئصال فص رئوي كامل عبر المنظار الصدري بجراحة محدودة الاختراق وتعافٍ أسرع.'
      ),
      (
        'VATS sympathectomy','THOR','32664-00',
        'Thoracoscopic thoracic sympathectomy for primary hyperhidrosis or Raynaud disease.',
        'بتر الودي الصدري بالتنظير',
        'قطع الجذع الودي الصدري عبر التنظير لعلاج فرط التعرق الأولي المنهك اجتماعياً.'
      ),
      (
        'VATS wedge resection','THOR','32666-00',
        'Thoracoscopic wedge resection of lung for peripheral lesion, metastasis, or biopsy.',
        'استئصال وتري بالتنظير الصدري',
        'إزالة إسفينية من نسيج الرئة عبر التنظير الصدري للتشخيص أو استئصال النقائل الموضعية.'
      ),
      (
        'VATS segmentectomy','THOR','32668-00',
        'Thoracoscopic anatomic segmental resection of lung for small peripheral lung cancer or benign disease.',
        'استئصال قطعة رئوية بالتنظير',
        'إزالة قطعة تشريحية من الرئة عبر التنظير الصدري محافظاً على أكبر قدر من الحمة الرئوية.'
      ),
      (
        'VATS pneumonectomy','THOR','32671-00',
        'Thoracoscopic total pneumonectomy for locally advanced lung cancer.',
        'استئصال الرئة الكامل بالتنظير',
        'استئصال الرئة كاملة عبر التنظير الصدري في حالات السرطان الرئوي المتقدم محلياً.'
      ),
      (
        'VATS thymectomy','THOR','32673-00',
        'Thoracoscopic thymectomy for thymoma or myasthenia gravis.',
        'استئصال الغدة الصعترية بالتنظير',
        'استئصال الغدة الصعترية عبر التنظير الصدري لعلاج ورم الغدة الصعترية أو الوهن العضلي الوبيل.'
      ),
      (
        'VATS diagnostic','THOR','32700-00',
        'Diagnostic thoracoscopy for evaluation of pleural, pulmonary, or mediastinal disease.',
        'تنظير صدري تشخيصي',
        'فحص التجويف الجنبي والرئة والمنصف عبر التنظير الصدري لتشخيص الأمراض الغامضة.'
      ),
      (
        'tube thoracostomy','THOR','32421-00',
        'Insertion of intercostal drainage tube for pneumothorax, pleural effusion, hemothorax, or empyema.',
        'وضع أنبوب التصريف الصدري',
        'إدخال أنبوب بين الضلوع لتصريف الانصباب الجنبي أو الدم أو القيح أو الهواء من التجويف الصدري.'
      ),
      (
        'decortication partial','THOR','32220-00',
        'Partial decortication of the lung for organized pleural collection limiting lung expansion.',
        'تقشير الرئة الجزئي',
        'إزالة الطبقة الليفية الجزئية عن الرئة المقيدة لاستعادة انبساطها الطبيعي.'
      ),
      (
        'decortication total','THOR','32225-00',
        'Total decortication for chronic empyema or fibrothorax causing restrictive lung disease.',
        'تقشير الرئة الكامل',
        'إزالة القشرة الليفية الكاملة عن الرئة والجنب لعلاج الدبيلة المزمنة والتليف الجنبي.'
      ),
      (
        'pleurectomy','THOR','32310-00',
        'Partial or total resection of parietal pleura for recurrent pneumothorax or mesothelioma.',
        'استئصال غشاء الجنب',
        'إزالة غشاء الجنب الجداري كلياً أو جزئياً لعلاج الاسترواح المتكرر أو الورم المتوسطي.'
      ),
      (
        'thoracotomy exploratory','THOR','32100-00',
        'Exploratory thoracotomy for diagnosis, staging, or bleeding control.',
        'فتح الصدر استكشافي',
        'فتح الصدر لاستكشاف التجويف الصدري وتشخيص الحالات الغامضة أو السيطرة على النزيف.'
      ),
      (
        'open lung biopsy','THOR','32096-00',
        'Open surgical biopsy of lung tissue for diagnosis of diffuse pulmonary disease or focal lesion.',
        'خزعة الرئة المفتوحة',
        'أخذ عينة من الرئة بالجراحة المفتوحة لتشخيص الأمراض الرئوية المنتشرة أو البؤرية.'
      ),
      (
        'esophagectomy total','THOR','43107-00',
        'Total esophagectomy with gastric pull-up or colon interposition for malignancy.',
        'استئصال المريء الكامل',
        'استئصال المريء بالكامل مع إعادة التوصيل بالمعدة أو القولون لعلاج سرطان المريء.'
      ),
      (
        'esophagectomy partial thoracic','THOR','43116-00',
        'Partial esophagectomy via thoracic approach for mid or upper oesophageal malignancy.',
        'استئصال المريء الجزئي (الصدري)',
        'استئصال جزء من المريء عبر الصدر لعلاج سرطان الجزء الأوسط أو العلوي من المريء.'
      ),
      (
        'Heller myotomy','THOR','43328-00',
        'Oesophageal myotomy (Heller procedure) for achalasia; open or laparoscopic-assisted approach.',
        'شق عضلة المريء (هيلر)',
        'شق طولي لعضلة المريء عند الاتصال مع المعدة لعلاج الارتخاء العضلي للمريء.'
      ),
      (
        'mediastinal tumor resection','THOR','39220-00',
        'Resection of anterior, middle, or posterior mediastinal mass or tumor.',
        'استئصال ورم المنصف',
        'استئصال الكتلة أو الورم الموجود في المنصف الأمامي أو الوسطى أو الخلفي.'
      ),
      (
        'tracheoplasty','THOR','31760-00',
        'Repair and reconstruction of trachea by resection and end-to-end anastomosis for stricture or tumour.',
        'إصلاح القصبة الهوائية',
        'استئصال منطقة التضيق من القصبة الهوائية وإعادة مفاغرة الطرفين لعلاج التضيق أو الورم.'
      ),
      (
        'pectus excavatum repair Ravitch','THOR','21740-00',
        'Open surgical correction of pectus excavatum by cartilage resection and sternal osteotomy (Ravitch technique).',
        'إصلاح الصدر القمعي (طريقة راڤيتش)',
        'تصحيح تشوه الصدر القمعي بالطريقة المفتوحة بإعادة تشكيل الغضاريف الضلعية والقص.'
      ),
      (
        'pectus excavatum repair Nuss','THOR','21742-00',
        'Minimally invasive correction of pectus excavatum using a retrosternal metal bar (Nuss procedure).',
        'إصلاح الصدر القمعي (طريقة نص)',
        'تصحيح الصدر القمعي بجراحة محدودة الاختراق عبر وضع قضيب معدني خلف القص.'
      ),
      (
        'rib resection partial','THOR','32900-00',
        'Partial resection of rib(s) for chest wall tumor, osteomyelitis, or trauma.',
        'استئصال جزئي للضلع',
        'إزالة جزء من ضلع أو أكثر لعلاج أورام جدار الصدر أو التهاب العظم أو الصدمة.'
      ),
      (
        'diaphragmatic hernia repair','THOR','39501-00',
        'Open repair of diaphragmatic hernia by reduction of herniated viscera and closure of diaphragmatic defect.',
        'إصلاح فتق الحجاب الحاجز',
        'إصلاح فتق الحجاب الحاجز جراحياً بإعادة الأحشاء المتهرنة وإغلاق الفتحة بالخياطة أو الرقعة.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('CARD','THOR')
    `);
  }
}
