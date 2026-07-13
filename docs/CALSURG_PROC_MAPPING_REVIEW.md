# cal_surgs — legacy proc → proc_cpt mapping (CLINICALLY REVISED)

Revised 2026-07-13T23:18:11.754Z — manual 1-by-1 clinical review of the semantic-search draft.
**73** legacy procedures · **33 kept · 24 remapped · 16 routed to new procedures** · **14 flagged** for a human eye.

Seven procedures the catalog was missing were added to the hub (migration `1750000000234-AddNsMissingProcCpts.ts`), each linked to its NS main-diagnosis category, and mirrored to KA. The `procCptId` backfill has NOT run yet (0/5578), so this corrects the map before any surgery record is stamped.

⚠️ = still needs your confirmation (ambiguous legacy term or no exact proc). Sorted by uses (desc).

| uses | legacy (ar) | cat | verdict | → final proc_cpt | was | note |
|---|---|---|---|---|---|---|
| 737 | ورم بالمخ | CRAN | ✅ keep | gross total resection | — | Brain tumour resection. Correct, 737 uses. |
| 659 | صمام بالمخ | VSHN | 🔁 remap | vp shunt | vp shunt (fixed pressure) | 'Valve in brain' = VP shunt, type unspecified → generic, not 'fixed pressure'. 659 uses. |
| 451 | تثبيت فقرات | FUSN | ✅ keep | fixation via pedicle screws and rods | — | Spinal fixation → pedicle screws and rods (the default construct). 451 uses, correct. |
| 293 | بذل من الظهر | MNR | 🔁 remap | lumbar puncture | posterior fusion | Tap from the back = lumbar puncture. Was 'posterior fusion' (badly wrong), 293 uses. |
| 230 | درنقة خارجية | CRAN | ✅ keep | evd | — | External drain = EVD. Correct. |
| 221 | إصلاح كسر بعظمة الجمجمة | CRAN | ✅ keep | elevation of depressed fracture | — | Skull fracture repair = elevation of depressed fracture. Correct, 221 uses. |
| 207 | توسيع القناة العصبية | LAM | 🔁 remap ⚠️ | laminoplasty | carpal tunnel | 'Widening the neural canal' = spinal canal decompression/laminoplasty, not carpal tunnel; 207 uses — could also be 'decompression'. |
| 172 | تفريغ نزيف تحت الام الجافيه | CRAN | 🔁 remap | evacuation of the hematoma | vacuum drainage | Subdural haematoma — 'evacuation of the hematoma' covers extradural/subdural; was 'vacuum drainage', 172 uses. |
| 168 | مراجعة صمام مخي بروتوني | VSHN | ➕ new | shunt revision or replacement | vp shunt (fixed pressure) | VP shunt revision — distinct from insertion, 168 uses. |
| 140 | غضروف | FUSN | 🔁 remap | fenestration | carpal tunnel | Colloquial 'disc' = laminotomy + disc excision (microdiscectomy). Was carpal tunnel (wrong). |
| 115 | منظار المخ | CRAN | ✅ keep ⚠️ | biopsy | — | Generic 'brain endoscopy' — biopsy is one common use but the term spans ETV/cyst fenestration/tumour; 115 uses, review. |
| 115 | تفريغ نزيف بالمخ | CRAN | ✅ keep | evacuation | — | Intracerebral haemorrhage → evacuation. Correct. |
| 105 | تنظيف جرح | MNR | ✅ keep | debridement (bone) | — | Wound cleaning/debridement. Acceptable. |
| 89 | تنظيف خراج خارج الام الجافيه | CRAN | ➕ new | drainage of intracranial abscess | vacuum drainage | Extradural abscess (infection) — was 'vacuum drainage' (wrong). |
| 73 | تفريغ نزيف فوق الام الجافيه | CRAN | 🔁 remap | evacuation of the hematoma | evacuation | Extradural haematoma — the EDH/SDH proc, not intracerebral 'evacuation'. |
| 56 | تركيب صمام قطني بريتوني | LAM | 🔁 remap | lumboperitoneal shunt | vp shunt (fixed pressure) | Lumboperitoneal shunt — an exact proc exists; was 'vp shunt'. 56 uses. |
| 52 | بذل من اليافوج | MNR | 🔁 remap | tapping | coiling | Tap through the anterior fontanelle (infant) — ventricular/subdural tap, not coiling. |
| 51 | ورم بالنخاع الشوكي | LAM | ➕ new | excision of intraspinal tumor | cordotomy | Spinal cord tumour — was 'cordotomy' (a pain ablation, wrong). |
| 49 | ترقيع عظام الجمجمة بالمنظار | CRAN | ➕ new | cranioplasty | foraminoplasty | Skull bone graft = cranioplasty, not 'foraminoplasty'. |
| 49 | حقن بالفقرات | LAM | ✅ keep ⚠️ | vertebroplasty | — | 'Injection into vertebrae' → vertebroplasty (cement); could be a facet/epidural injection. |
| 41 | توسيع الحجرة الخلفية بالجمجمة | CRAN | 🔁 remap ⚠️ | bony decompression | burr holes | Posterior fossa decompression (e.g. Chiari); 'burr holes' too weak. bony decompression is the closest bucket. |
| 41 | تمدد شرياني بالمخ | CRAN | 🔁 remap | clipping | wrapping | Cerebral aneurysm — primary treatment is clipping, not 'wrapping' (last-resort). 41 uses. |
| 33 | استئصال كيس بالظهر | LAM | 🔁 remap | laminectomy | repair duroplasty | Excision of spinal cyst via laminectomy; was 'repair duroplasty'. |
| 32 | قياس ضغط السائل الشوكي | MNR | ✅ keep | manometry | — | CSF pressure measurement → manometry. Correct. |
| 28 | خراج بالمخ | CRAN | ➕ new | drainage of intracranial abscess | foreign body removal | Brain abscess — was 'foreign body removal' (wrong). |
| 26 | عينة | CRAN | ✅ keep | biopsy | — | Specimen = biopsy. Correct. |
| 26 | استئصال ورم بعصب الزراع | PRPH | ✅ keep | peripheral nerve tumor | — | Arm nerve tumour → peripheral nerve tumour. Correct. |
| 26 | ورم بالفقرات | LAM | ✅ keep | corpectomy | — | Vertebral (bone) tumour = corpectomy. Acceptable. |
| 25 | ترقيع عظام الجمجمة | CRAN | ➕ new | cranioplasty | elevation of depressed fracture | Skull bone graft = cranioplasty, not 'elevation of depressed fracture'. |
| 22 | وحمه دمويه بالمخ | CRAN | ✅ keep | evacuation | — | Intracerebral haematoma → evacuation. Acceptable. |
| 20 | ورم بالغده النخاميه | CRAN | ➕ new | transsphenoidal resection of pituitary tumor | gross total resection | Pituitary tumour is transsphenoidal, not an open craniotomy 'gross total resection'. |
| 19 | ازالة درنقة مخية خارجية | VSHN | 🔁 remap ⚠️ | other procedure | foreign body removal | Removal of an EVD — a minor bedside/OR step; 'foreign body removal from brain' is clinically wrong. No dedicated proc. |
| 18 | استئصال عظام الجمجمة لازالة الضغط | CRAN | ✅ keep | decompressive craniectomy | — | Decompressive craniectomy. Correct. |
| 18 | ازالة بؤرة تشنجية بالمخ | CRAN | ✅ keep | lesionectomy | — | Excision of epileptogenic focus → lesionectomy. Correct. |
| 13 | غضروف قطني بالمنظار | LAM | 🔁 remap | fenestration | discectomy (as part of interbody fusion) | Endoscopic lumbar discectomy = laminotomy + disc excision. |
| 12 | كي حراري بالمخ | CRAN | ✅ keep ⚠️ | lesion / ultrasonic ablation | — | Thermal/RF brain ablation; mapped to focused-ultrasound ablation — same family, modality differs. |
| 12 | تجميل عظام الجمجمه | CRAN | ➕ new | cranioplasty | elevation of depressed fracture | Skull bone reconstruction = cranioplasty, not 'elevation of depressed fracture'. |
| 11 | حقن موضعي | LAM | ✅ keep | local injection | — | Local (facet) injection. Correct. |
| 9 | إزالة كيس علي المخ | CRAN | ✅ keep | cyst fenestration | — | Intracranial cyst → cyst fenestration. Correct. |
| 9 | تركيب ايبيديورال | VSHN | 🔁 remap ⚠️ | csf diversion neither vp shunt nor etv | evd | 'Epidural' placement — likely an epidural ICP monitor/catheter; was EVD (ventricular). Confirm. |
| 9 | إزالة صمام | VSHN | ➕ new | shunt revision or replacement | vp shunt (fixed pressure) | Shunt removal — distinct from insertion. |
| 8 | اصلاح الضفيره العصبيه | PRPH | ✅ keep | brachial plexus injury | — | Brachial plexus repair. Correct. |
| 8 | إصلاح اعوجاج بالعمود الفقري | FUSN | 🔁 remap | fixation via pedicle screws and rods | kyphoplasty (thoracic) | Deformity/scoliosis correction = instrumented fusion, not 'kyphoplasty' (cement). |
| 8 | إزالة خراج بالفقرات | LAM | 🔁 remap | laminectomy | evacuation | Spinal (vertebral) abscess drainage via laminectomy — cranial 'evacuation' was wrong category. |
| 8 | تركيب درنقه مخيه داخلية | CRAN | 🔁 remap | vp shunt | evd | 'Internal' cerebral drain = internalised shunt, not an external EVD. |
| 8 | ازلة مسامير لتثبيت قديم | FUSN | ➕ new | removal of spinal instrumentation | fixation via screws and plate | Removal of old hardware — no removal proc existed; was 'fixation via screws and plate' (insertion). |
| 7 | مراجعة صمام ظهري بريتوني | VSHN | ➕ new | shunt revision or replacement | vp shunt (fixed pressure) | Lumbo/spino-peritoneal shunt revision. |
| 7 | تسليك عصب اليد | PRPH | 🔁 remap ⚠️ | carpal tunnel | ulnar nerve entrapment (cubital tunnel syndrome) | Release of hand/wrist nerve → carpal tunnel (median); could be ulnar. Review. |
| 6 | تحرير الحبل الشوكي | LAM | ✅ keep | release of the tethered cord | — | Release of tethered cord. Correct. |
| 6 | إزالة صمام +تركيب صمام | VSHN | ➕ new | shunt revision or replacement | vp shunt (fixed pressure) | Remove + insert = shunt replacement. |
| 6 | مراجعة للتثبيت | FUSN | 🔁 remap | fixation otherwise | fixation via hooks | Generic revision of spinal fixation — hardware type unspecified. |
| 5 | ورم بقاع الجمجمة | CRAN | ✅ keep | gross total resection | — | Skull-base tumour resection. Acceptable. |
| 5 | تركيب صمام اومية بالمخ | CRAN | ➕ new | ommaya reservoir insertion or revision | vp shunt (fixed pressure) | Ommaya reservoir insertion — not a VP shunt. |
| 4 | ورم بالظهر | LAM | ➕ new | excision of intraspinal tumor | repair duroplasty | Spinal tumour — no intraspinal-tumour proc existed; was 'repair duroplasty'. |
| 4 | مراجعة صمام بالبطن | VSHN | ➕ new | shunt revision or replacement | vp shunt (programmable) | Shunt revision (peritoneal end) — distinct from shunt insertion. |
| 4 | ورم بالمخ بالمنظار | CRAN | ✅ keep | gross total resection | — | Endoscopic brain tumour resection. Acceptable. |
| 4 | ورم بالجمجمه | CRAN | ✅ keep | gross total resection | — | Cranial tumour resection. Acceptable. |
| 3 | اصلاح تشوه شرياني | CRAN | ✅ keep | clipping | — | Vascular malformation repair → clipping. Acceptable. |
| 3 | قيلة بالظهر | LAM | ✅ keep ⚠️ | repair duroplasty | — | Meningocele repair; 'repair duroplasty' acceptable but a dedicated myelomeningocele-repair proc would be cleaner (3 uses). |
| 3 | توصيل عصب اليد | PRPH | ✅ keep | nerve injury otherwise | — | Hand nerve repair → nerve injury otherwise. Acceptable. |
| 3 | استئصال ورم بالضفيره العصبيه | PRPH | ✅ keep | peripheral nerve tumor | — | Plexus tumour → peripheral nerve tumour. Correct. |
| 2 | مويامويا | CRAN | 🔁 remap | indirect bypass | clipping | Moyamoya revascularisation = indirect bypass (EDAS/EMS), not aneurysm clipping. |
| 2 | قطع جذور الاعصاب | LAM | ✅ keep | rhizotomy | — | Rhizotomy. Correct. |
| 2 | استئصال الفص الامامي للمخ | CRAN | ✅ keep | lobectomy | — | Frontal lobectomy → lobectomy. Correct. |
| 2 | مراجعة صمام اوميا | VSHN | ➕ new | ommaya reservoir insertion or revision | vp shunt (fixed pressure) | Ommaya reservoir revision — not a VP shunt (no peritoneal drainage). |
| 1 | مراجعة وتثبيت جهاز تنظم كهرباء المخ | CRAN | 🔁 remap ⚠️ | deep brain stimulation | Vagal nerve stimulator implantation | Revision of a brain neurostimulator → DBS more likely than vagal for 'المخ'. |
| 1 | تفريغ هواء بالمخ | CRAN | ✅ keep ⚠️ | tapping | — | Evacuation of pneumocephalus (air); 'tapping' acceptable, 1 use. |
| 1 | اختبار بالكوفين | LAM | ✅ keep ⚠️ | tap test | — | Ambiguous term, 1 use; tap test is a plausible CSF test but unverified. |
| 1 | اصلاح ضلع عنقي وتسليك الاعصاب | PRPH | 🔁 remap ⚠️ | other procedure | laminoplasty | Cervical rib + nerve release = thoracic outlet decompression; no proc exists, 1 use. |
| 1 | ازالة كيس دهني من القناه العصبيه | LAM | 🔁 remap ⚠️ | laminectomy | cyst fenestration | Excision of intraspinal lipoma/dermoid; 1 use, may involve tethered-cord release. |
| 1 | تسليك شريان من عصب مخي | CRAN | 🔁 remap | microvascular decompression | direct bypass | Freeing an artery off a cranial nerve = MVD, not 'direct bypass'. |
| 1 | ازالة جسم غريب من الجمجمة | CRAN | ✅ keep | foreign body removal | — | Foreign body removal from skull/brain. Correct. |
| 1 | رفع الضغط عن العصب البصري | CRAN | ✅ keep | bony decompression | — | Optic nerve decompression = bony decompression. Correct. |

## New procedures introduced (hub migration 1750000000234)

| proc_cpt | cat | numCode | NS main-diagnosis link |
|---|---|---|---|
| transsphenoidal resection of pituitary tumor | CRAN | 61548-00 | cns tumors |
| excision of intraspinal tumor | LAM | 63275-00 | cns tumors |
| drainage of intracranial abscess | CRAN | 61320-00 | cns infection |
| cranioplasty | CRAN | 62140-00 | cranial trauma |
| shunt revision or replacement | VSHN | 62230-00 | csf disorders / congenital hydrocephalus |
| ommaya reservoir insertion or revision | CRAN | 61215-00 | cns tumors / csf disorders |
| removal of spinal instrumentation | FUSN | 22850-00 | spinal degenerative / spinal trauma |
