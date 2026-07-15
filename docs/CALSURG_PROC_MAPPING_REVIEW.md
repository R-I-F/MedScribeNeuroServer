# cal_surgs — legacy proc → proc_cpt mapping (CLINICALLY REVISED)

> ✅ **APPROVED by user 2026-07-14** ("no gate consider it approved") — including the ⚠️-flagged rows. The `procCptId` backfill is applied on `ka-institute` (4,608/5,578 stamped; the remaining 970 have no procedure recorded). The calendar UI now serves EN (procCpt) / AR (arabProc) by language.

Revised 2026-07-14T09:35:15.111Z — manual 1-by-1 clinical review of the semantic-search draft.
**73** legacy procedures · **33 kept · 24 remapped · 16 routed to new procedures** · **14 flagged** for a human eye.

Seven procedures the catalog was missing were added to the hub (migration `1750000000234-AddNsMissingProcCpts.ts`), each linked to its NS main-diagnosis category, and mirrored to KA. The `procCptId` backfill has NOT run yet (0/5578), so this corrects the map before any surgery record is stamped.

⚠️ = still needs your confirmation (ambiguous legacy term or no exact proc). Sorted by uses (desc).

| uses | legacy (ar) | cat | verdict | → final proc_cpt (en) | → final (ar) | was | note |
|---|---|---|---|---|---|---|---|
| 737 | ورم بالمخ | CRAN | ✅ keep | gross total resection | استئصال كلي | — | Brain tumour resection. Correct, 737 uses. |
| 659 | صمام بالمخ | VSHN | 🔁 remap | vp shunt | شنت بطيني بريتوني | vp shunt (fixed pressure) | 'Valve in brain' = VP shunt, type unspecified → generic, not 'fixed pressure'. 659 uses. |
| 451 | تثبيت فقرات | FUSN | ✅ keep | fixation via pedicle screws and rods | تثبيت بمسامير العنيق والقضبان | — | Spinal fixation → pedicle screws and rods (the default construct). 451 uses, correct. |
| 293 | بذل من الظهر | MNR | 🔁 remap | lumbar puncture | البزل القطني | posterior fusion | Tap from the back = lumbar puncture. Was 'posterior fusion' (badly wrong), 293 uses. |
| 230 | درنقة خارجية | CRAN | ✅ keep | evd | تصريف بطيني خارجي | — | External drain = EVD. Correct. |
| 221 | إصلاح كسر بعظمة الجمجمة | CRAN | ✅ keep | elevation of depressed fracture | رفع الكسر المنخفض | — | Skull fracture repair = elevation of depressed fracture. Correct, 221 uses. |
| 207 | توسيع القناة العصبية | LAM | 🔁 remap ⚠️ | laminoplasty | رأب الصفيحة الفقرية | carpal tunnel | 'Widening the neural canal' = spinal canal decompression/laminoplasty, not carpal tunnel; 207 uses — could also be 'decompression'. |
| 172 | تفريغ نزيف تحت الام الجافيه | CRAN | 🔁 remap | evacuation of the hematoma | إخلاء الورم الدموي | vacuum drainage | Subdural haematoma — 'evacuation of the hematoma' covers extradural/subdural; was 'vacuum drainage', 172 uses. |
| 168 | مراجعة صمام مخي بروتوني | VSHN | ➕ new | shunt revision or replacement | مراجعة أو استبدال الشنت | vp shunt (fixed pressure) | VP shunt revision — distinct from insertion, 168 uses. |
| 140 | غضروف | FUSN | 🔁 remap | fenestration | فنسترة الصفيحة الفقرية | carpal tunnel | Colloquial 'disc' = laminotomy + disc excision (microdiscectomy). Was carpal tunnel (wrong). |
| 115 | منظار المخ | CRAN | ✅ keep ⚠️ | biopsy | خزعة مخية | — | Generic 'brain endoscopy' — biopsy is one common use but the term spans ETV/cyst fenestration/tumour; 115 uses, review. |
| 115 | تفريغ نزيف بالمخ | CRAN | ✅ keep | evacuation | إخلاء الدم | — | Intracerebral haemorrhage → evacuation. Correct. |
| 105 | تنظيف جرح | MNR | ✅ keep | debridement (bone) | تنضير الجرح | — | Wound cleaning/debridement. Acceptable. |
| 89 | تنظيف خراج خارج الام الجافيه | CRAN | ➕ new | drainage of intracranial abscess | تصريف خراج داخل القحف | vacuum drainage | Extradural abscess (infection) — was 'vacuum drainage' (wrong). |
| 73 | تفريغ نزيف فوق الام الجافيه | CRAN | 🔁 remap | evacuation of the hematoma | إخلاء الورم الدموي | evacuation | Extradural haematoma — the EDH/SDH proc, not intracerebral 'evacuation'. |
| 56 | تركيب صمام قطني بريتوني | LAM | 🔁 remap | lumboperitoneal shunt | شنت قطني بريتوني | vp shunt (fixed pressure) | Lumboperitoneal shunt — an exact proc exists; was 'vp shunt'. 56 uses. |
| 52 | بذل من اليافوج | MNR | 🔁 remap | tapping | شفط السائل البطيني | coiling | Tap through the anterior fontanelle (infant) — ventricular/subdural tap, not coiling. |
| 51 | ورم بالنخاع الشوكي | LAM | ➕ new | excision of intraspinal tumor | استئصال ورم داخل القناة الشوكية | cordotomy | Spinal cord tumour — was 'cordotomy' (a pain ablation, wrong). |
| 49 | ترقيع عظام الجمجمة بالمنظار | CRAN | ➕ new | cranioplasty | رأب عظام الجمجمة | foraminoplasty | Skull bone graft = cranioplasty, not 'foraminoplasty'. |
| 49 | حقن بالفقرات | LAM | ✅ keep ⚠️ | vertebroplasty | رأب الفقرة | — | 'Injection into vertebrae' → vertebroplasty (cement); could be a facet/epidural injection. |
| 41 | توسيع الحجرة الخلفية بالجمجمة | CRAN | 🔁 remap ⚠️ | bony decompression | إزالة ضغط عظمي | burr holes | Posterior fossa decompression (e.g. Chiari); 'burr holes' too weak. bony decompression is the closest bucket. |
| 41 | تمدد شرياني بالمخ | CRAN | 🔁 remap | clipping | ربط الأم الدموية بالقصاصة | wrapping | Cerebral aneurysm — primary treatment is clipping, not 'wrapping' (last-resort). 41 uses. |
| 33 | استئصال كيس بالظهر | LAM | 🔁 remap | laminectomy | استئصال الصفيحة الفقرية | repair duroplasty | Excision of spinal cyst via laminectomy; was 'repair duroplasty'. |
| 32 | قياس ضغط السائل الشوكي | MNR | ✅ keep | manometry | قياس الضغط البطيني | — | CSF pressure measurement → manometry. Correct. |
| 28 | خراج بالمخ | CRAN | ➕ new | drainage of intracranial abscess | تصريف خراج داخل القحف | foreign body removal | Brain abscess — was 'foreign body removal' (wrong). |
| 26 | عينة | CRAN | ✅ keep | biopsy | خزعة مخية | — | Specimen = biopsy. Correct. |
| 26 | استئصال ورم بعصب الزراع | PRPH | ✅ keep | peripheral nerve tumor | استئصال ورم غمد العصب المحيطي | — | Arm nerve tumour → peripheral nerve tumour. Correct. |
| 26 | ورم بالفقرات | LAM | ✅ keep | corpectomy | استئصال جسم الفقرة | — | Vertebral (bone) tumour = corpectomy. Acceptable. |
| 25 | ترقيع عظام الجمجمة | CRAN | ➕ new | cranioplasty | رأب عظام الجمجمة | elevation of depressed fracture | Skull bone graft = cranioplasty, not 'elevation of depressed fracture'. |
| 22 | وحمه دمويه بالمخ | CRAN | ✅ keep | evacuation | إخلاء الدم | — | Intracerebral haematoma → evacuation. Acceptable. |
| 20 | ورم بالغده النخاميه | CRAN | ➕ new | transsphenoidal resection of pituitary tumor | استئصال ورم الغدة النخامية عبر الوتدي | gross total resection | Pituitary tumour is transsphenoidal, not an open craniotomy 'gross total resection'. |
| 19 | ازالة درنقة مخية خارجية | VSHN | 🔁 remap ⚠️ | other procedure | إجراء آخر | foreign body removal | Removal of an EVD — a minor bedside/OR step; 'foreign body removal from brain' is clinically wrong. No dedicated proc. |
| 18 | استئصال عظام الجمجمة لازالة الضغط | CRAN | ✅ keep | decompressive craniectomy | قراضة الجمجمة التخفيفية | — | Decompressive craniectomy. Correct. |
| 18 | ازالة بؤرة تشنجية بالمخ | CRAN | ✅ keep | lesionectomy | استئصال البؤرة الصرعية | — | Excision of epileptogenic focus → lesionectomy. Correct. |
| 13 | غضروف قطني بالمنظار | LAM | 🔁 remap | fenestration | فنسترة الصفيحة الفقرية | discectomy (as part of interbody fusion) | Endoscopic lumbar discectomy = laminotomy + disc excision. |
| 12 | كي حراري بالمخ | CRAN | ✅ keep ⚠️ | lesion / ultrasonic ablation | استئصال الآفة بالموجات فوق الصوتية المركزة | — | Thermal/RF brain ablation; mapped to focused-ultrasound ablation — same family, modality differs. |
| 12 | تجميل عظام الجمجمه | CRAN | ➕ new | cranioplasty | رأب عظام الجمجمة | elevation of depressed fracture | Skull bone reconstruction = cranioplasty, not 'elevation of depressed fracture'. |
| 11 | حقن موضعي | LAM | ✅ keep | local injection | حقن موضعي للمفصل الوجيهي | — | Local (facet) injection. Correct. |
| 9 | إزالة كيس علي المخ | CRAN | ✅ keep | cyst fenestration | استئصال الكيس بالمنظار العصبي | — | Intracranial cyst → cyst fenestration. Correct. |
| 9 | تركيب ايبيديورال | VSHN | 🔁 remap ⚠️ | csf diversion neither vp shunt nor etv | تحويل السائل المخي الشوكي (غير شنت VP أو ETV) | evd | 'Epidural' placement — likely an epidural ICP monitor/catheter; was EVD (ventricular). Confirm. |
| 9 | إزالة صمام | VSHN | ➕ new | shunt revision or replacement | مراجعة أو استبدال الشنت | vp shunt (fixed pressure) | Shunt removal — distinct from insertion. |
| 8 | اصلاح الضفيره العصبيه | PRPH | ✅ keep | brachial plexus injury | إصلاح الضفيرة العضدية | — | Brachial plexus repair. Correct. |
| 8 | إصلاح اعوجاج بالعمود الفقري | FUSN | 🔁 remap | fixation via pedicle screws and rods | تثبيت بمسامير العنيق والقضبان | kyphoplasty (thoracic) | Deformity/scoliosis correction = instrumented fusion, not 'kyphoplasty' (cement). |
| 8 | إزالة خراج بالفقرات | LAM | 🔁 remap | laminectomy | استئصال الصفيحة الفقرية | evacuation | Spinal (vertebral) abscess drainage via laminectomy — cranial 'evacuation' was wrong category. |
| 8 | تركيب درنقه مخيه داخلية | CRAN | 🔁 remap | vp shunt | شنت بطيني بريتوني | evd | 'Internal' cerebral drain = internalised shunt, not an external EVD. |
| 8 | ازلة مسامير لتثبيت قديم | FUSN | ➕ new | removal of spinal instrumentation | إزالة تثبيت العمود الفقري | fixation via screws and plate | Removal of old hardware — no removal proc existed; was 'fixation via screws and plate' (insertion). |
| 7 | مراجعة صمام ظهري بريتوني | VSHN | ➕ new | shunt revision or replacement | مراجعة أو استبدال الشنت | vp shunt (fixed pressure) | Lumbo/spino-peritoneal shunt revision. |
| 7 | تسليك عصب اليد | PRPH | 🔁 remap ⚠️ | carpal tunnel | تحرير النفق الرسغي | ulnar nerve entrapment (cubital tunnel syndrome) | Release of hand/wrist nerve → carpal tunnel (median); could be ulnar. Review. |
| 6 | تحرير الحبل الشوكي | LAM | ✅ keep | release of the tethered cord | تحرير الحبل الشوكي المربوط | — | Release of tethered cord. Correct. |
| 6 | إزالة صمام +تركيب صمام | VSHN | ➕ new | shunt revision or replacement | مراجعة أو استبدال الشنت | vp shunt (fixed pressure) | Remove + insert = shunt replacement. |
| 6 | مراجعة للتثبيت | FUSN | 🔁 remap | fixation otherwise | تثبيت فقري بأسلوب آخر | fixation via hooks | Generic revision of spinal fixation — hardware type unspecified. |
| 5 | ورم بقاع الجمجمة | CRAN | ✅ keep | gross total resection | استئصال كلي | — | Skull-base tumour resection. Acceptable. |
| 5 | تركيب صمام اومية بالمخ | CRAN | ➕ new | ommaya reservoir insertion or revision | تركيب أو مراجعة خزان أوماية | vp shunt (fixed pressure) | Ommaya reservoir insertion — not a VP shunt. |
| 4 | ورم بالظهر | LAM | ➕ new | excision of intraspinal tumor | استئصال ورم داخل القناة الشوكية | repair duroplasty | Spinal tumour — no intraspinal-tumour proc existed; was 'repair duroplasty'. |
| 4 | مراجعة صمام بالبطن | VSHN | ➕ new | shunt revision or replacement | مراجعة أو استبدال الشنت | vp shunt (programmable) | Shunt revision (peritoneal end) — distinct from shunt insertion. |
| 4 | ورم بالمخ بالمنظار | CRAN | ✅ keep | gross total resection | استئصال كلي | — | Endoscopic brain tumour resection. Acceptable. |
| 4 | ورم بالجمجمه | CRAN | ✅ keep | gross total resection | استئصال كلي | — | Cranial tumour resection. Acceptable. |
| 3 | اصلاح تشوه شرياني | CRAN | ✅ keep | clipping | ربط الأم الدموية بالقصاصة | — | Vascular malformation repair → clipping. Acceptable. |
| 3 | قيلة بالظهر | LAM | ✅ keep ⚠️ | repair duroplasty | ترميم الجافية ورأبها | — | Meningocele repair; 'repair duroplasty' acceptable but a dedicated myelomeningocele-repair proc would be cleaner (3 uses). |
| 3 | توصيل عصب اليد | PRPH | ✅ keep | nerve injury otherwise | إصلاح إصابة العصب المحيطي | — | Hand nerve repair → nerve injury otherwise. Acceptable. |
| 3 | استئصال ورم بالضفيره العصبيه | PRPH | ✅ keep | peripheral nerve tumor | استئصال ورم غمد العصب المحيطي | — | Plexus tumour → peripheral nerve tumour. Correct. |
| 2 | مويامويا | CRAN | 🔁 remap | indirect bypass | مجازة وعائية غير مباشرة | clipping | Moyamoya revascularisation = indirect bypass (EDAS/EMS), not aneurysm clipping. |
| 2 | قطع جذور الاعصاب | LAM | ✅ keep | rhizotomy | قطع الجذر العصبي | — | Rhizotomy. Correct. |
| 2 | استئصال الفص الامامي للمخ | CRAN | ✅ keep | lobectomy | استئصال الفص المخي | — | Frontal lobectomy → lobectomy. Correct. |
| 2 | مراجعة صمام اوميا | VSHN | ➕ new | ommaya reservoir insertion or revision | تركيب أو مراجعة خزان أوماية | vp shunt (fixed pressure) | Ommaya reservoir revision — not a VP shunt (no peritoneal drainage). |
| 1 | مراجعة وتثبيت جهاز تنظم كهرباء المخ | CRAN | 🔁 remap ⚠️ | deep brain stimulation | تحفيز المخ العميق | Vagal nerve stimulator implantation | Revision of a brain neurostimulator → DBS more likely than vagal for 'المخ'. |
| 1 | تفريغ هواء بالمخ | CRAN | ✅ keep ⚠️ | tapping | شفط السائل البطيني | — | Evacuation of pneumocephalus (air); 'tapping' acceptable, 1 use. |
| 1 | اختبار بالكوفين | LAM | ✅ keep ⚠️ | tap test | اختبار البزل | — | Ambiguous term, 1 use; tap test is a plausible CSF test but unverified. |
| 1 | اصلاح ضلع عنقي وتسليك الاعصاب | PRPH | 🔁 remap ⚠️ | other procedure | إجراء آخر | laminoplasty | Cervical rib + nerve release = thoracic outlet decompression; no proc exists, 1 use. |
| 1 | ازالة كيس دهني من القناه العصبيه | LAM | 🔁 remap ⚠️ | laminectomy | استئصال الصفيحة الفقرية | cyst fenestration | Excision of intraspinal lipoma/dermoid; 1 use, may involve tethered-cord release. |
| 1 | تسليك شريان من عصب مخي | CRAN | 🔁 remap | microvascular decompression | إزالة الضغط الوعائي الدقيق | direct bypass | Freeing an artery off a cranial nerve = MVD, not 'direct bypass'. |
| 1 | ازالة جسم غريب من الجمجمة | CRAN | ✅ keep | foreign body removal | إزالة جسم غريب من المخ | — | Foreign body removal from skull/brain. Correct. |
| 1 | رفع الضغط عن العصب البصري | CRAN | ✅ keep | bony decompression | إزالة ضغط عظمي | — | Optic nerve decompression = bony decompression. Correct. |

## New procedures introduced (hub migration 1750000000234)

| proc_cpt (en) | proc_cpt (ar) | cat | numCode | NS main-diagnosis link |
|---|---|---|---|---|
| transsphenoidal resection of pituitary tumor | استئصال ورم الغدة النخامية عبر الوتدي | CRAN | 61548-00 | cns tumors |
| excision of intraspinal tumor | استئصال ورم داخل القناة الشوكية | LAM | 63275-00 | cns tumors |
| drainage of intracranial abscess | تصريف خراج داخل القحف | CRAN | 61320-00 | cns infection |
| cranioplasty | رأب عظام الجمجمة | CRAN | 62140-00 | cranial trauma |
| shunt revision or replacement | مراجعة أو استبدال الشنت | VSHN | 62230-00 | csf disorders / congenital hydrocephalus |
| ommaya reservoir insertion or revision | تركيب أو مراجعة خزان أوماية | CRAN | 61215-00 | cns tumors / csf disorders |
| removal of spinal instrumentation | إزالة تثبيت العمود الفقري | FUSN | 22850-00 | spinal degenerative / spinal trauma |
