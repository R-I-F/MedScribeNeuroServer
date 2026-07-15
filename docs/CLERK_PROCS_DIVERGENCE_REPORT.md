# clerk_procs legacy import — algorithm vs approved-mapping divergence report

Generated 2026-07-14T23:34:07.653Z by scripts/rebuild-calsurgs-clerkprocs.cjs (plan §7.2.1).
Per Q2 (user 2026-07-15): the APPROVED clinical mapping is what got stored; the algorithm column is diagnostic.

**81 titles · agree 44 · disagree 29 · no-approved-mapping 8**

| clerk phrase | approved → stored | algorithm best match | score | agrees |
|---|---|---|---|---|
| ورم بالنخاع الشوكي | excision of intraspinal tumor | excision of intraspinal tumor | 0.703 | ✅ |
| تسليك القناة الرسغية | — | carpal tunnel | 0.735 | n/a |
| تمدد شرياني بالمخ | clipping | wrapping | 0.708 | ❌ |
| ورم بقاع الجمجمة | gross total resection | gross total resection | 0.681 | ✅ |
| ازالة درنقة مخية خارجية | other procedure | foreign body removal | 0.738 | ❌ |
| تركيب درنقه مخيه داخلية | vp shunt | evd | 0.68 | ❌ |
| ترقيع عظام الجمجمة | cranioplasty | cranioplasty | 0.777 | ✅ |
| ورم بالمخ بالمنظار | gross total resection | gross total resection | 0.693 | ✅ |
| بذل من اليافوج | tapping | coiling | 0.599 | ❌ |
| مويامويا | indirect bypass | clipping | 0.68 | ❌ |
| استئصال ورم بعصب الزراع | peripheral nerve tumor | peripheral nerve tumor | 0.749 | ✅ |
| اصلاح الضفيره العصبيه | brachial plexus injury | brachial plexus injury | 0.767 | ✅ |
| ازالة جسم غريب من الجمجمة | foreign body removal | foreign body removal | 0.799 | ✅ |
| كي حراري بالمخ | lesion / ultrasonic ablation | lesion / ultrasonic ablation | 0.669 | ✅ |
| تسليك عصب الرجل | — | ulnar nerve entrapment (cubital tunnel syndrome) | 0.718 | n/a |
| استكشاف العصب الكعبري و اصلاحه | — | ulnar nerve entrapment (cubital tunnel syndrome) | 0.727 | n/a |
| استئصال ورم بالضفيره العصبيه | peripheral nerve tumor | peripheral nerve tumor | 0.749 | ✅ |
| مراجعة صمام اوميا | ommaya reservoir insertion or revision | ommaya reservoir insertion or revision | 0.644 | ✅ |
| قطع جذور الاعصاب | rhizotomy | rhizotomy | 0.728 | ✅ |
| قيلة بالظهر | repair duroplasty | repair duroplasty | 0.665 | ✅ |
| تركيب صمام قطني بريتوني | lumboperitoneal shunt | vp shunt (fixed pressure) | 0.743 | ❌ |
| ورم بالمخ | gross total resection | gross total resection | 0.687 | ✅ |
| توصيل عصب اليد | nerve injury otherwise | nerve injury otherwise | 0.717 | ✅ |
| مراجعة صمام بالبطن | shunt revision or replacement | vp shunt (programmable) | 0.652 | ❌ |
| ازالة بؤرة تشنجية بالمخ | lesionectomy | lesionectomy | 0.771 | ✅ |
| ازالة كيس دهني من القناه العصبيه | laminectomy | excision of intraspinal tumor | 0.712 | ❌ |
| ورم بالفقرات | corpectomy | excision of intraspinal tumor | 0.714 | ❌ |
| رفع الضغط عن العصب البصري | bony decompression | bony decompression | 0.696 | ✅ |
| قياس ضغط السائل الشوكي | manometry | manometry | 0.762 | ✅ |
| تنظيف خراج خارج الام الجافيه | drainage of intracranial abscess | drainage of intracranial abscess | 0.688 | ✅ |
| مراجعة للتثبيت | fixation otherwise | fixation via hooks | 0.617 | ❌ |
| حقن بالفقرات | vertebroplasty | vertebroplasty | 0.726 | ✅ |
| ورم بالظهر | excision of intraspinal tumor | excision of intraspinal tumor | 0.684 | ✅ |
| تثبيت فقرات | fixation via pedicle screws and rods | fixation via pedicle screws and rods | 0.683 | ✅ |
| استئصال كيس بالظهر | laminectomy | excision of intraspinal tumor | 0.689 | ❌ |
| إزالة قفص كربوني | — | removal of spinal instrumentation | 0.69 | n/a |
| حقن موضعي | local injection | local injection | 0.77 | ✅ |
| إزالة كيس علي المخ | cyst fenestration | cyst fenestration | 0.748 | ✅ |
| تسليك عصب اليد | carpal tunnel | ulnar nerve entrapment (cubital tunnel syndrome) | 0.742 | ❌ |
| إصلاح اعوجاج بالعمود الفقري | fixation via pedicle screws and rods | kyphoplasty (thoracic) | 0.701 | ❌ |
| ورم بالجمجمه | gross total resection | gross total resection | 0.683 | ✅ |
| خراج بالمخ | drainage of intracranial abscess | drainage of intracranial abscess | 0.734 | ✅ |
| توصيل شرايين بالمخ | — | direct bypass | 0.748 | n/a |
| منظار المخ | biopsy | biopsy | 0.679 | ✅ |
| مراجعة صمام ظهري بريتوني | shunt revision or replacement | vp shunt (fixed pressure) | 0.683 | ❌ |
| درنقة خارجية | evd | evd | 0.639 | ✅ |
| ازلة مسامير لتثبيت قديم | removal of spinal instrumentation | removal of spinal instrumentation | 0.714 | ✅ |
| ترقيع عظام الجمجمة بالمنظار | cranioplasty | cranioplasty | 0.729 | ✅ |
| صمام بالمخ | vp shunt | vp shunt (fixed pressure) | 0.691 | ❌ |
| إصلاح كسر بعظمة الجمجمة | elevation of depressed fracture | elevation of depressed fracture | 0.747 | ✅ |
| مراجعة صمام مخي بروتوني | shunt revision or replacement | vp shunt (fixed pressure) | 0.668 | ❌ |
| إزالة صمام +تركيب صمام | shunt revision or replacement | vp shunt (fixed pressure) | 0.668 | ❌ |
| تفريغ نزيف بالمخ | evacuation | evacuation | 0.753 | ✅ |
| تنظيف جرح | debridement (bone) | debridement (bone) | 0.708 | ✅ |
| تركيب صمام اومية بالمخ | ommaya reservoir insertion or revision | ommaya reservoir insertion or revision | 0.747 | ✅ |
| تسليك شريان من عصب مخي | microvascular decompression | direct bypass | 0.719 | ❌ |
| اصلاح تشوه شرياني | clipping | clipping | 0.69 | ✅ |
| وحمه دمويه بالمخ | evacuation | evacuation | 0.692 | ✅ |
| استئصال الفص الامامي للمخ | lobectomy | lobectomy | 0.735 | ✅ |
| غضروف قطني بالمنظار | fenestration | discectomy (as part of interbody fusion) | 0.669 | ❌ |
| تفريغ نزيف تحت الام الجافيه | evacuation of the hematoma | vacuum drainage | 0.665 | ❌ |
| ورم بالغده النخاميه | transsphenoidal resection of pituitary tumor | transsphenoidal resection of pituitary tumor | 0.704 | ✅ |
| ترقيع الام الجافية | — | duroplasty | 0.748 | n/a |
| قيلة بالمخ | — | cyst fenestration | 0.686 | n/a |
| اختبار بالكوفين | tap test | tap test | 0.626 | ✅ |
| تفريغ نزيف فوق الام الجافيه | evacuation of the hematoma | evacuation | 0.666 | ❌ |
| استئصال عظام الجمجمة لازالة الضغط | decompressive craniectomy | decompressive craniectomy | 0.773 | ✅ |
| غضروف | fenestration | carpal tunnel | 0.637 | ❌ |
| توسيع القناة العصبية | laminoplasty | carpal tunnel | 0.699 | ❌ |
| مراجعة وتثبيت جهاز تنظم كهرباء المخ | deep brain stimulation | Vagal nerve stimulator implantation | 0.719 | ❌ |
| بذل من الظهر | lumbar puncture | posterior fusion | 0.656 | ❌ |
| توسيع الحجرة الخلفية بالجمجمة | bony decompression | burr holes | 0.695 | ❌ |
| تحرير الحبل الشوكي | release of the tethered cord | release of the tethered cord | 0.776 | ✅ |
| تفريغ هواء بالمخ | tapping | tapping | 0.686 | ✅ |
| استئصال ورم بفروة الرأس | — | gross total resection | 0.697 | n/a |
| تجميل عظام الجمجمه | cranioplasty | cranioplasty | 0.709 | ✅ |
| إزالة صمام | shunt revision or replacement | shunt revision or replacement | 0.668 | ✅ |
| إزالة خراج بالفقرات | laminectomy | drainage of intracranial abscess | 0.694 | ❌ |
| عينة | biopsy | biopsy | 0.651 | ✅ |
| تركيب ايبيديورال | csf diversion neither vp shunt nor etv | evd | 0.677 | ❌ |
| اصلاح ضلع عنقي وتسليك الاعصاب | other procedure | laminoplasty | 0.679 | ❌ |