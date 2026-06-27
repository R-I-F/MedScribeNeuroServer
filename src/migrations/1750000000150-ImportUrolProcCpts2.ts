import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL proc_cpts — import batch 2 of 2 (56 new rows). Alpha groups: NEPH (kidney excision),
 * RTPX (renal transplantation), ORCH (testis/scrotum), VARI (varicocele/vas/infertility),
 * PENI (penis), EREC (erectile dysfunction / prosthesis / priapism), INCO (incontinence),
 * RETN (urethra / retention / augmentation). Every CPT AAPC-verified current/active
 * (AUDIT_UROL.md "2E"). Linked to main_diags by migration 151.
 */
export class ImportUrolProcCpts21750000000150 implements MigrationInterface {
  name = "ImportUrolProcCpts21750000000150";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── NEPH: kidney excision ──────────────────────────────────────────────
      ('Nephrectomy','NEPH','50220-00','Open removal of the kidney and upper ureter for benign or malignant disease.','استئصال الكلية','استئصال مفتوح للكلية والحالب العلوي لمرض حميد أو خبيث.'),
      ('Radical nephrectomy','NEPH','50230-00','Open removal of the kidney with Gerota fascia, perinephric fat and regional lymph nodes for cancer.','استئصال الكلية الجذري','استئصال مفتوح للكلية مع لفافة جيروتا والشحم حول الكلية والعقد الإقليمية للسرطان.'),
      ('Partial nephrectomy','NEPH','50240-00','Nephron-sparing excision of a renal tumour with preservation of the remaining kidney.','استئصال الكلية الجزئي','استئصال مُحافظ على النيفرون لورم كلوي مع الإبقاء على بقية الكلية.'),
      ('Laparoscopic partial nephrectomy','NEPH','50543-00','Laparoscopic nephron-sparing excision of a renal mass.','استئصال الكلية الجزئي بالتنظير','استئصال تنظيري مُحافظ على النيفرون لكتلة كلوية.'),
      ('Laparoscopic radical nephrectomy','NEPH','50545-00','Laparoscopic removal of the kidney with surrounding structures for cancer.','استئصال الكلية الجذري بالتنظير','استئصال تنظيري للكلية مع البنى المحيطة للسرطان.'),
      ('Laparoscopic nephrectomy','NEPH','50546-00','Laparoscopic simple removal of the kidney (and proximal ureter).','استئصال الكلية بالتنظير','استئصال تنظيري بسيط للكلية (والحالب القريب).'),
      ('Ablation of renal mass (cryosurgery)','NEPH','50250-00','Open cryosurgical ablation of a renal mass with intraoperative ultrasound guidance.','إتلاف الكتلة الكلوية بالتبريد','إتلاف بالتبريد لكتلة كلوية مع توجيه بالأمواج فوق الصوتية أثناء العمل الجراحي.'),
      -- ── RTPX: renal transplantation ────────────────────────────────────────
      ('Renal allotransplantation without recipient nephrectomy','RTPX','50360-00','Implantation of a donor kidney graft into a recipient without removing a native kidney.','زرع الكلية دون استئصال كلية المتلقّي','زرع طُعم كلوي من متبرّع في المتلقّي دون إزالة كلية أصلية.'),
      ('Renal allotransplantation with recipient nephrectomy','RTPX','50365-00','Implantation of a donor kidney graft with simultaneous removal of a native kidney.','زرع الكلية مع استئصال كلية المتلقّي','زرع طُعم كلوي مع إزالة كلية أصلية في الوقت نفسه.'),
      ('Recipient nephrectomy (for transplant)','RTPX','50340-00','Removal of a native kidney in preparation for or as part of renal transplantation.','استئصال كلية المتلقّي','إزالة كلية أصلية تحضيراً للزرع الكلوي أو كجزء منه.'),
      ('Open donor nephrectomy (living donor)','RTPX','50320-00','Open removal of a kidney from a living donor for transplantation.','استئصال كلية المتبرّع المفتوح','استئصال مفتوح لكلية من متبرّع حيّ بغرض الزرع.'),
      ('Laparoscopic donor nephrectomy','RTPX','50547-00','Laparoscopic removal of a living-donor kidney with cold preservation.','استئصال كلية المتبرّع بالتنظير','استئصال تنظيري لكلية متبرّع حيّ مع الحفظ البارد.'),
      ('Removal of transplanted renal allograft','RTPX','50370-00','Surgical removal of a previously transplanted kidney, usually for rejection.','استئصال الطُعم الكلوي المزروع','إزالة جراحية لكلية مزروعة سابقاً، غالباً بسبب الرفض.'),
      ('Renal autotransplantation / reimplantation','RTPX','50380-00','Removal and reimplantation of the kidney at a new site by anastomosis to iliac vessels.','إعادة زرع الكلية ذاتياً','إزالة الكلية وإعادة زرعها في موضع جديد بمفاغرتها للأوعية الحرقفية.'),
      -- ── ORCH: testis / scrotum ─────────────────────────────────────────────
      ('Simple orchiectomy','ORCH','54520-00','Removal of one or both testes, with or without a testicular prosthesis.','استئصال الخصية البسيط','إزالة خصية أو خصيتين، مع أو دون زرعة خصوية.'),
      ('Radical inguinal orchiectomy','ORCH','54530-00','Removal of the testis and spermatic cord through an inguinal incision for tumour.','استئصال الخصية الجذري الإربي','إزالة الخصية والحبل المنوي عبر شق إربي للورم.'),
      ('Radical orchiectomy with abdominal exploration','ORCH','54535-00','Radical orchiectomy with exploration of the abdomen for a high or intra-abdominal tumour.','استئصال الخصية الجذري مع استكشاف البطن','استئصال الخصية الجذري مع استكشاف البطن لورم مرتفع أو داخل البطن.'),
      ('Reduction of testicular torsion','ORCH','54600-00','Surgical detorsion of a twisted testis with assessment of viability and fixation.','رد التواء الخصية','فك التواء الخصية جراحياً مع تقييم الحيوية والتثبيت.'),
      ('Orchiopexy, inguinal/scrotal approach','ORCH','54640-00','Mobilisation and scrotal fixation of an undescended testis via an inguinal/scrotal approach.','تثبيت الخصية الإربي/الصفني','تحرير وتثبيت الخصية الهاجرة في كيس الصفن عبر مدخل إربي/صفني.'),
      ('Orchiopexy, abdominal approach (Fowler-Stephens)','ORCH','54650-00','Abdominal orchiopexy for an intra-abdominal undescended testis (e.g. Fowler-Stephens).','تثبيت الخصية البطني','تثبيت الخصية الهاجرة داخل البطن عبر مدخل بطني (فاولر-ستيفنز).'),
      ('Laparoscopic orchiectomy','ORCH','54690-00','Laparoscopic removal of an intra-abdominal or impalpable testis.','استئصال الخصية بالتنظير','استئصال تنظيري لخصية داخل البطن أو غير مجسوسة.'),
      ('Epididymectomy, unilateral','ORCH','54860-00','Surgical removal of the epididymis on one side.','استئصال البربخ أحادي الجانب','إزالة جراحية للبربخ في جانب واحد.'),
      ('Excision of hydrocele, unilateral','ORCH','55040-00','Excision of a hydrocele sac from one side of the scrotum.','استئصال القيلة المائية أحادي الجانب','استئصال كيس القيلة المائية من جانب واحد من كيس الصفن.'),
      ('Repair of hydrocele (bottle type)','ORCH','55060-00','Repair of a tunica vaginalis hydrocele by the bottle (eversion) technique.','رأب القيلة المائية (تقنية القارورة)','رأب قيلة الغلالة الغمدية بتقنية القارورة (القلب للخارج).'),
      ('Incision and drainage of scrotum/testis','ORCH','54700-00','Incision and drainage of an abscess or haematoma of the testis, epididymis or scrotum.','شق وتصريف كيس الصفن/الخصية','شق وتصريف خراج أو ورم دموي في الخصية أو البربخ أو كيس الصفن.'),
      ('Testicular biopsy, incisional (open)','ORCH','54505-00','Open incisional biopsy of one or both testes for evaluation of pathology or fertility.','خزعة الخصية الشقّية المفتوحة','خزعة شقّية مفتوحة لخصية أو خصيتين لتقييم الإمراض أو الخصوبة.'),
      -- ── VARI: varicocele / vas / infertility ───────────────────────────────
      ('Varicocelectomy (spermatic vein ligation)','VARI','55530-00','Excision/ligation of dilated spermatic cord veins for varicocele.','استئصال دوالي الحبل المنوي','استئصال/ربط أوردة الحبل المنوي المتوسّعة لدوالي الحبل المنوي.'),
      ('Laparoscopic varicocelectomy','VARI','55550-00','Laparoscopic ligation of the spermatic veins for varicocele.','استئصال دوالي الحبل المنوي بالتنظير','ربط تنظيري لأوردة الحبل المنوي لدوالي الحبل المنوي.'),
      ('Vasovasostomy (vasectomy reversal)','VARI','55400-00','Microsurgical re-anastomosis of the vas deferens to restore fertility.','مفاغرة الأسهر (عكس قطع الأسهر)','مفاغرة دقيقة للأسهر لاستعادة الخصوبة.'),
      ('Vasectomy','VARI','55250-00','Bilateral division and ligation of the vas deferens for sterilisation.','قطع الأسهر','قطع وربط الأسهر ثنائي الجانب للتعقيم.'),
      ('Epididymovasostomy, unilateral','VARI','54900-00','Microsurgical anastomosis of the epididymis to the vas deferens for obstructive azoospermia.','مفاغرة البربخ بالأسهر أحادية الجانب','مفاغرة دقيقة للبربخ بالأسهر لانعدام النطاف الانسدادي.'),
      ('Testicular biopsy, needle','VARI','54500-00','Percutaneous needle biopsy of one or both testes for fertility evaluation.','خزعة الخصية بالإبرة','خزعة إبرية عبر الجلد لخصية أو خصيتين لتقييم الخصوبة.'),
      -- ── PENI: penis ────────────────────────────────────────────────────────
      ('Circumcision, clamp or device (newborn)','PENI','54150-00','Circumcision of a newborn using a clamp or device with a regional block.','الختان بالمشبك (الولدان)','ختان الوليد باستخدام مشبك أو أداة مع تخدير ناحيّ.'),
      ('Circumcision, surgical excision (older than 28 days)','PENI','54161-00','Surgical excision of the foreskin in a patient older than 28 days.','الختان بالاستئصال الجراحي','استئصال القلفة جراحياً لمريض أكبر من 28 يوماً.'),
      ('Excision of Peyronie plaque','PENI','54110-00','Excision of a fibrous Peyronie plaque from the penis, with or without grafting.','استئصال لويحة بيروني','استئصال لويحة ليفية من القضيب في داء بيروني، مع أو دون ترقيع.'),
      ('One-stage hypospadias repair (meatal advancement)','PENI','54322-00','Single-stage correction of distal hypospadias with meatal advancement or V-flap.','رأب المبال التحتاني بمرحلة واحدة','تصحيح المبال التحتاني الداني بمرحلة واحدة مع تقديم الصِّماخ أو رفرف V.'),
      ('Amputation of penis, complete','PENI','54125-00','Complete amputation of the penis, usually for advanced penile carcinoma.','بتر القضيب الكامل','بتر كامل للقضيب، عادةً لسرطانة قضيبية متقدمة.'),
      ('Destruction/excision of penile lesion','PENI','54060-00','Surgical excision of a penile skin lesion (condyloma, papilloma or similar).','إتلاف/استئصال آفة القضيب','استئصال جراحي لآفة جلدية قضيبية (ثؤلول تناسلي أو ورم حليمي أو ما شابه).'),
      -- ── EREC: erectile dysfunction / prosthesis / priapism ─────────────────
      ('Insertion of non-inflatable (semirigid) penile prosthesis','EREC','54400-00','Implantation of a semirigid non-inflatable penile prosthesis for erectile dysfunction.','زرع دعامة قضيبية غير قابلة للنفخ','زرع دعامة قضيبية شبه صلبة غير قابلة للنفخ لضعف الانتصاب.'),
      ('Insertion of inflatable penile prosthesis, self-contained','EREC','54401-00','Implantation of a self-contained (two-piece) inflatable penile prosthesis.','زرع دعامة قضيبية قابلة للنفخ ذاتية الاحتواء','زرع دعامة قضيبية قابلة للنفخ ذاتية الاحتواء (قطعتين).'),
      ('Insertion of inflatable multicomponent penile prosthesis','EREC','54405-00','Implantation of a multicomponent (three-piece) inflatable penile prosthesis.','زرع دعامة قضيبية قابلة للنفخ متعددة المكوّنات','زرع دعامة قضيبية قابلة للنفخ متعددة المكوّنات (ثلاث قطع).'),
      ('Corpora cavernosa–saphenous vein shunt (priapism)','EREC','54420-00','Creation of a cavernosa-to-saphenous-vein shunt to relieve ischaemic priapism.','تحويلة الجسم الكهفي إلى الوريد الصافن','إنشاء تحويلة من الجسم الكهفي إلى الوريد الصافن لتخفيف القُساح الإقفاري.'),
      ('Corpora cavernosa–corpus spongiosum shunt (priapism)','EREC','54430-00','Creation of a cavernosa-to-spongiosum shunt to relieve ischaemic priapism.','تحويلة الجسم الكهفي إلى الجسم الإسفنجي','إنشاء تحويلة من الجسم الكهفي إلى الجسم الإسفنجي لتخفيف القُساح الإقفاري.'),
      ('Intracavernosal injection for erectile dysfunction','EREC','54235-00','Injection of a vasoactive agent into the corpora cavernosa to induce erection.','الحقن داخل الجسم الكهفي لضعف الانتصاب','حقن عامل موسّع وعائي في الجسم الكهفي لإحداث الانتصاب.'),
      -- ── INCO: urinary incontinence ─────────────────────────────────────────
      ('Insertion of artificial urinary sphincter','INCO','53445-00','Placement of an inflatable artificial urinary sphincter to treat sphincteric incontinence.','زرع المصرّة البولية الاصطناعية','وضع مصرّة بولية اصطناعية قابلة للنفخ لعلاج السلس المصرّي.'),
      ('Sling operation for stress incontinence','INCO','57288-00','Placement of a fascial or synthetic sling beneath the urethra for stress incontinence.','عملية الحبال للسلس الإجهادي','وضع حبال من اللفافة أو مادة صناعية أسفل الإحليل للسلس الإجهادي.'),
      ('Endoscopic injection of urethral bulking agent','INCO','51715-00','Cystoscopic peri-urethral injection of a bulking agent to improve coaptation.','الحقن التنظيري لعامل توسيع إحليلي','حقن تنظيري حول الإحليل بعامل توسيع لتحسين التطابق المخاطي.'),
      ('Laparoscopic sling for stress incontinence','INCO','51992-00','Laparoscopic placement of a sling at the bladder-neck/urethra for stress incontinence.','عملية الحبال بالتنظير للسلس الإجهادي','وضع تنظيري لحبال عند عنق المثانة/الإحليل للسلس الإجهادي.'),
      ('Male urethral sling / suspension','INCO','53440-00','Placement of a fascial or synthetic sling to support the male urethra and restore continence.','الحبال الإحليلي الذكري','وضع حبال من اللفافة أو مادة صناعية لدعم الإحليل الذكري واستعادة الإمساك.'),
      ('Removal and replacement of artificial urinary sphincter','INCO','53447-00','Removal of an implanted artificial urinary sphincter and replacement in the same session.','إزالة واستبدال المصرّة البولية الاصطناعية','إزالة مصرّة بولية اصطناعية مزروعة واستبدالها في الجلسة نفسها.'),
      -- ── RETN: urethra / retention / augmentation ───────────────────────────
      ('Direct-vision internal urethrotomy','RETN','52276-00','Endoscopic incision of a urethral stricture under direct vision to relieve obstruction.','بضع الإحليل الداخلي بالرؤية المباشرة','شق تنظيري لتضيّق إحليلي بالرؤية المباشرة لتخفيف الانسداد.'),
      ('Urethroplasty, first stage','RETN','53400-00','First-stage urethroplasty for repair of a urethral stricture or fistula.','رأب الإحليل المرحلة الأولى','المرحلة الأولى من رأب الإحليل لإصلاح تضيّق أو ناسور إحليلي.'),
      ('One-stage urethroplasty, anterior urethra','RETN','53410-00','Single-stage reconstruction of the anterior male urethra with graft or flap.','رأب الإحليل بمرحلة واحدة (الإحليل الأمامي)','إعادة بناء الإحليل الأمامي الذكري بمرحلة واحدة بطُعم أو رفرف.'),
      ('Urethral dilation by filiform and follower','RETN','53620-00','Dilation of a urethral stricture using filiform and follower in the male.','توسيع الإحليل بالخيطي والتابع','توسيع تضيّق إحليلي باستخدام الخيطي والتابع لدى الذكر.'),
      ('Urethral dilation by sound or dilator (initial)','RETN','53600-00','Initial dilation of a male urethral stricture with a sound or dilator.','توسيع الإحليل بالمسبار/الموسّع (مبدئي)','توسيع مبدئي لتضيّق إحليلي ذكري بالمسبار أو الموسّع.'),
      ('Augmentation enterocystoplasty','RETN','51960-00','Augmentation of bladder capacity using a bowel segment for a small/contracted bladder.','رأب المثانة التوسيعي المعوي','زيادة سعة المثانة باستخدام قطعة معوية لمثانة صغيرة/متقفّعة.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM "main_diag_procs" WHERE "procCptId" IN (SELECT id FROM "proc_cpts" WHERE "alphaCode" IN ('NEPH','RTPX','ORCH','VARI','PENI','EREC','INCO','RETN'))`);
    await q.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('NEPH','RTPX','ORCH','VARI','PENI','EREC','INCO','RETN')`);
  }
}
