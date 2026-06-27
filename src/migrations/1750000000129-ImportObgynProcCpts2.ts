import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN proc_cpts — batch 2 of 2 (51 procedures). New groups: DILC (D&C / abortion), ADNX
 * (adnexal & ovarian surgery), ONCO (gynaecologic oncology), PROL (prolapse repair), INCO
 * (incontinence surgery), CERV (cervical procedures).
 *
 * Every CPT verified current/active against AAPC — see AUDIT_OBGYN.md "2E" (the deleted code
 * 58823 pelvic-abscess-drainage was identified and replaced with 58820). Linked by migration 130.
 */
export class ImportObgynProcCpts21750000000129 implements MigrationInterface {
  name = "ImportObgynProcCpts21750000000129";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── DILC: D&C / abortion ──────────────────────────────────────────────
      ('Dilation and curettage (non-obstetric)','DILC','58120-00','Dilation of the cervix and curettage of the uterus, diagnostic or therapeutic, non-obstetric.','التوسيع والكشط (غير الولادي)','توسيع عنق الرحم وكشط الرحم، تشخيصي أو علاجي، غير ولادي.'),
      ('Surgical treatment of incomplete abortion','DILC','59812-00','Surgical evacuation of an incomplete abortion, any trimester.','المعالجة الجراحية للإجهاض غير التام','إفراغ جراحي لإجهاض غير تام، في أي ثلث.'),
      ('Surgical treatment of missed abortion, first trimester','DILC','59820-00','Surgical evacuation of a missed abortion in the first trimester.','المعالجة الجراحية للإجهاض الفائت، الثلث الأول','إفراغ جراحي لإجهاض فائت في الثلث الأول.'),
      ('Surgical treatment of missed abortion, second trimester','DILC','59821-00','Surgical evacuation of a missed abortion in the second trimester.','المعالجة الجراحية للإجهاض الفائت، الثلث الثاني','إفراغ جراحي لإجهاض فائت في الثلث الثاني.'),
      ('Induced abortion by dilation and curettage','DILC','59840-00','Induced abortion performed by dilation and curettage.','الإجهاض المُحرَّض بالتوسيع والكشط','إجهاض مُحرَّض يُجرى بالتوسيع والكشط.'),
      ('Induced abortion by dilation and evacuation','DILC','59841-00','Induced abortion performed by dilation and evacuation.','الإجهاض المُحرَّض بالتوسيع والإفراغ','إجهاض مُحرَّض يُجرى بالتوسيع والإفراغ.'),
      ('Curettage, postpartum','DILC','59160-00','Curettage of the uterus after delivery for retained products or secondary haemorrhage.','الكشط بعد الولادة','كشط الرحم بعد الولادة لنواتج محتبسة أو نزف ثانوي.'),
      ('Cervical cerclage during pregnancy, vaginal','DILC','59320-00','Vaginal cerclage of the cervix during pregnancy for cervical incompetence.','تطويق عنق الرحم أثناء الحمل، مهبلي','تطويق عنق الرحم عبر المهبل أثناء الحمل لقصور عنق الرحم.'),
      -- ── ADNX: adnexal / ovarian surgery ───────────────────────────────────
      ('Laparoscopy with removal of adnexal structures','ADNX','58661-00','Laparoscopic removal of adnexal structures (partial/total oophorectomy and/or salpingectomy).','تنظير البطن مع استئصال الملحقات','استئصال الملحقات بالمنظار (استئصال مبيض جزئي/كلي و/أو استئصال البوق).'),
      ('Laparoscopy with fulguration or excision of lesions','ADNX','58662-00','Laparoscopic fulguration or excision of ovary/pelvic lesions (eg endometriosis).','تنظير البطن مع كي أو استئصال الآفات','كي أو استئصال آفات المبيض/الحوض بالمنظار (مثل بطانة الرحم المهاجرة).'),
      ('Salpingo-oophorectomy','ADNX','58720-00','Salpingo-oophorectomy, complete or partial, unilateral or bilateral, open.','استئصال البوق والمبيض','استئصال البوق والمبيض، كلي أو جزئي، أحادي أو ثنائي الجانب، مفتوح.'),
      ('Ovarian cystectomy','ADNX','58925-00','Excision of an ovarian cyst, unilateral or bilateral, with ovarian preservation.','استئصال كيسة المبيض','استئصال كيسة مبيضية، أحادي أو ثنائي الجانب، مع الحفاظ على المبيض.'),
      ('Wedge resection or bisection of ovary','ADNX','58920-00','Wedge resection or bisection of the ovary, unilateral or bilateral.','استئصال إسفيني أو شطر المبيض','استئصال إسفيني أو شطر المبيض، أحادي أو ثنائي الجانب.'),
      ('Oophorectomy, partial or total','ADNX','58940-00','Oophorectomy, partial or total, unilateral or bilateral.','استئصال المبيض، جزئي أو كلي','استئصال المبيض، جزئي أو كلي، أحادي أو ثنائي الجانب.'),
      ('Oophorectomy with staging for ovarian malignancy','ADNX','58943-00','Oophorectomy with biopsies, omentectomy and washings for ovarian/tubal/peritoneal malignancy staging.','استئصال المبيض مع تدريج الورم الخبيث','استئصال المبيض مع خزعات واستئصال الثرب وغسالات لتدريج خباثة المبيض/البوق/الصفاق.'),
      ('Laparoscopy with fulguration of oviducts','ADNX','58670-00','Laparoscopic fulguration or transection of the fallopian tubes (sterilization).','تنظير البطن مع كي البوقين','كي أو قطع البوقين بالمنظار (التعقيم).'),
      ('Laparoscopy with occlusion of oviducts by device','ADNX','58671-00','Laparoscopic occlusion of the fallopian tubes by device (clip or ring).','تنظير البطن مع سدّ البوقين بأداة','سدّ البوقين بأداة بالمنظار (مشبك أو حلقة).'),
      ('Drainage of ovarian abscess, vaginal','ADNX','58820-00','Drainage of an ovarian abscess by a vaginal (open) approach.','تصريف خراج المبيض، مهبلي','تصريف خراج مبيضي عبر مدخل مهبلي مفتوح.'),
      -- ── ONCO: gynaecologic oncology ───────────────────────────────────────
      ('Radical abdominal hysterectomy with pelvic lymphadenectomy','ONCO','58210-00','Radical abdominal hysterectomy with bilateral pelvic lymphadenectomy for cervical/uterine cancer.','استئصال الرحم البطني الجذري مع تجريف العقد الحوضية','استئصال رحم بطني جذري مع تجريف العقد اللمفية الحوضية الثنائي لسرطان عنق الرحم/الرحم.'),
      ('Total abdominal hysterectomy with pelvic lymphadenectomy','ONCO','58200-00','Total abdominal hysterectomy with partial vaginectomy and pelvic lymphadenectomy for malignancy.','استئصال الرحم البطني الكلي مع تجريف العقد الحوضية','استئصال رحم بطني كلي مع استئصال مهبلي جزئي وتجريف العقد الحوضية للخباثة.'),
      ('Resection of ovarian malignancy with omentectomy','ONCO','58950-00','Resection of ovarian, tubal or primary peritoneal malignancy with bilateral salpingo-oophorectomy and omentectomy.','استئصال خباثة المبيض مع استئصال الثرب','استئصال خباثة المبيض أو البوق أو الصفاق الأولية مع استئصال البوقين والمبيضين والثرب.'),
      ('Resection of ovarian malignancy with hysterectomy and lymphadenectomy','ONCO','58951-00','Resection of ovarian malignancy with total hysterectomy, omentectomy and lymphadenectomy.','استئصال خباثة المبيض مع استئصال الرحم وتجريف العقد','استئصال خباثة المبيض مع استئصال الرحم الكلي والثرب وتجريف العقد اللمفية.'),
      ('Tumour debulking with radical dissection','ONCO','58953-00','Bilateral salpingo-oophorectomy with omentectomy and radical dissection for ovarian tumour debulking.','تصغير الورم مع التجريف الجذري','استئصال البوقين والمبيضين مع الثرب والتجريف الجذري لتصغير ورم المبيض.'),
      ('Tumour debulking with pelvic lymphadenectomy','ONCO','58954-00','Ovarian tumour debulking with radical dissection and pelvic/para-aortic lymphadenectomy.','تصغير الورم مع تجريف العقد الحوضية','تصغير ورم المبيض مع التجريف الجذري وتجريف العقد الحوضية وحول الأبهر.'),
      ('Resection of ovarian malignancy with radical debulking and omentectomy','ONCO','58956-00','Bilateral salpingo-oophorectomy with total omentectomy and total hysterectomy for ovarian/peritoneal malignancy.','استئصال خباثة المبيض مع التصغير الجذري والثرب','استئصال البوقين والمبيضين مع استئصال الثرب الكلي والرحم الكلي لخباثة المبيض/الصفاق.'),
      ('Second-look laparotomy for ovarian malignancy','ONCO','58960-00','Laparotomy for staging or restaging of ovarian malignancy (second-look), with biopsies and washings.','فتح البطن للمراجعة في خباثة المبيض','فتح البطن لتدريج أو إعادة تدريج خباثة المبيض (مراجعة) مع خزعات وغسالات.'),
      ('Laparoscopic radical hysterectomy with lymphadenectomy','ONCO','58548-00','Laparoscopic radical hysterectomy with pelvic and para-aortic lymphadenectomy for cervical/uterine cancer.','استئصال الرحم الجذري بالمنظار مع تجريف العقد','استئصال الرحم الجذري بالمنظار مع تجريف العقد الحوضية وحول الأبهر لسرطان عنق الرحم/الرحم.'),
      -- ── PROL: prolapse repair ─────────────────────────────────────────────
      ('Anterior colporrhaphy (cystocele repair)','PROL','57240-00','Anterior colporrhaphy for repair of a cystocele, with or without urethrocele repair.','رأب المهبل الأمامي (إصلاح القيلة المثانية)','رأب المهبل الأمامي لإصلاح القيلة المثانية، مع أو دون إصلاح القيلة الإحليلية.'),
      ('Posterior colporrhaphy (rectocele repair)','PROL','57250-00','Posterior colporrhaphy for repair of a rectocele, with or without perineorrhaphy.','رأب المهبل الخلفي (إصلاح القيلة المستقيمية)','رأب المهبل الخلفي لإصلاح القيلة المستقيمية، مع أو دون رأب العجان.'),
      ('Combined anteroposterior colporrhaphy','PROL','57260-00','Combined anterior and posterior colporrhaphy.','رأب المهبل الأمامي والخلفي المشترك','رأب المهبل الأمامي والخلفي المشترك.'),
      ('Anteroposterior colporrhaphy with enterocele repair','PROL','57265-00','Combined anteroposterior colporrhaphy with repair of an enterocele.','رأب المهبل الأمامي والخلفي مع إصلاح القيلة المعوية','رأب المهبل الأمامي والخلفي مع إصلاح القيلة المعوية.'),
      ('Sacrospinous ligament colpopexy (extraperitoneal)','PROL','57282-00','Extraperitoneal colpopexy (sacrospinous or iliococcygeus) for vaginal vault/apical prolapse.','تثبيت المهبل بالرباط الشوكي العجزي','تثبيت المهبل خارج الصفاق (الشوكي العجزي) لهبوط قبّة/قمّة المهبل.'),
      ('Uterosacral/intraperitoneal colpopexy','PROL','57283-00','Intraperitoneal colpopexy (uterosacral or McCall) for apical prolapse.','تثبيت المهبل داخل الصفاق (الرباط الرحمي العجزي)','تثبيت المهبل داخل الصفاق (الرحمي العجزي أو ماكول) لهبوط القمّة.'),
      ('Paravaginal defect repair, open','PROL','57284-00','Open paravaginal defect repair for anterior compartment prolapse.','إصلاح العيب جانب المهبل، مفتوح','إصلاح مفتوح للعيب جانب المهبل لهبوط الحجرة الأمامية.'),
      ('Paravaginal defect repair, vaginal','PROL','57285-00','Vaginal paravaginal defect repair.','إصلاح العيب جانب المهبل، مهبلي','إصلاح مهبلي للعيب جانب المهبل.'),
      ('Laparoscopic paravaginal defect repair','PROL','57423-00','Laparoscopic paravaginal defect repair for anterior compartment prolapse.','إصلاح العيب جانب المهبل بالمنظار','إصلاح العيب جانب المهبل بالمنظار لهبوط الحجرة الأمامية.'),
      ('Laparoscopic sacrocolpopexy','PROL','57425-00','Laparoscopic colpopexy (sacrocolpopexy) for vaginal vault/apical prolapse using mesh.','تثبيت المهبل العجزي بالمنظار','تثبيت المهبل العجزي بالمنظار لهبوط قبّة/قمّة المهبل باستخدام الشبكة.'),
      -- ── INCO: incontinence surgery ────────────────────────────────────────
      ('Sling operation for stress incontinence','INCO','57288-00','Placement of a suburethral sling (eg mid-urethral tape) for stress urinary incontinence.','عملية الحبال لسلس البول الجهدي','وضع حبال تحت الإحليل (مثل الشريط الإحليلي الأوسط) لسلس البول الجهدي.'),
      ('Laparoscopic sling operation for stress incontinence','INCO','51992-00','Laparoscopic placement of a sling for stress urinary incontinence.','عملية الحبال بالمنظار لسلس البول الجهدي','وضع حبال بالمنظار لسلس البول الجهدي.'),
      ('Removal or revision of sling for stress incontinence','INCO','57287-00','Removal or revision of a suburethral sling for stress urinary incontinence.','إزالة أو مراجعة حبال سلس البول الجهدي','إزالة أو مراجعة الحبال تحت الإحليل لسلس البول الجهدي.'),
      ('Laparoscopic urethral suspension','INCO','51990-00','Laparoscopic urethral suspension (eg Burch colposuspension) for stress incontinence.','تعليق الإحليل بالمنظار','تعليق الإحليل بالمنظار (مثل تعليق المهبل بطريقة بيرش) لسلس البول الجهدي.'),
      ('Periurethral radiofrequency for stress incontinence','INCO','53860-00','Transurethral radiofrequency micro-remodelling of the urethra/bladder neck for stress incontinence.','المعالجة بالترددات الراديوية حول الإحليل لسلس البول','إعادة تشكيل دقيقة بالترددات الراديوية عبر الإحليل لعنق المثانة لسلس البول الجهدي.'),
      -- ── CERV: cervical procedures ─────────────────────────────────────────
      ('Biopsy of cervix','CERV','57500-00','Biopsy of one or more lesions of the cervix, single or multiple.','خزعة عنق الرحم','خزعة لآفة أو أكثر في عنق الرحم، مفردة أو متعددة.'),
      ('Endocervical curettage','CERV','57505-00','Endocervical curettage (not done as part of a dilation and curettage).','كشط باطن عنق الرحم','كشط باطن عنق الرحم (دون أن يكون جزءاً من التوسيع والكشط).'),
      ('Cautery of cervix','CERV','57510-00','Cautery of the cervix by electro- or thermal cautery.','كي عنق الرحم','كي عنق الرحم بالكي الكهربائي أو الحراري.'),
      ('Cold-knife conization of cervix','CERV','57520-00','Cold-knife conization of the cervix for diagnosis/treatment of cervical dysplasia.','الاستئصال المخروطي بالسكين البارد لعنق الرحم','استئصال مخروطي بالسكين البارد لعنق الرحم لتشخيص/علاج خلل تنسّج عنق الرحم.'),
      ('LEEP conization of cervix','CERV','57522-00','Loop electrosurgical excision (LEEP) conization of the cervix.','الاستئصال المخروطي بالحلقة الكهربائية لعنق الرحم','استئصال مخروطي بالحلقة الكهربائية (LEEP) لعنق الرحم.'),
      ('Cervical cerclage, nonobstetric (abdominal/vaginal)','CERV','57700-00','Cerclage of the uterine cervix performed outside of pregnancy.','تطويق عنق الرحم، غير ولادي','تطويق عنق الرحم يُجرى خارج الحمل.'),
      ('Colposcopy with LEEP biopsy of cervix','CERV','57461-00','Colposcopy of the cervix with loop electrode conization/biopsy.','تنظير المهبل مع خزعة الحلقة لعنق الرحم','تنظير المهبل لعنق الرحم مع خزعة/استئصال بالحلقة الكهربائية.'),
      ('Colposcopy with loop electrode excision of cervix','CERV','57460-00','Colposcopy of the cervix with loop electrode excision of the transformation zone.','تنظير المهبل مع استئصال بالحلقة لعنق الرحم','تنظير المهبل لعنق الرحم مع استئصال منطقة التحوّل بالحلقة الكهربائية.'),
      ('Trachelectomy (cervical amputation)','CERV','57530-00','Trachelectomy (amputation of the cervix), eg for a cervical stump or early cervical cancer.','استئصال عنق الرحم','استئصال عنق الرحم (بتر العنق)، مثلاً لجذمور عنقي أو سرطان عنق مبكّر.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('DILC','ADNX','ONCO','PROL','INCO','CERV')`);
  }
}
