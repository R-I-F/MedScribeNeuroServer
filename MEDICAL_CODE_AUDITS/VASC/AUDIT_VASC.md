# VASC Department Audit
**Date (last updated)**: 2026-06-22
**Migrations applied**: 085–090
**Dept**: VASC — Vascular Surgery (جراحة الأوعية الدموية)
**Status**: ✅ COMPLETE — 100 diagnoses + 114 proc_cpts, all verified & embedded

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-06-22
**Current step**: DONE — full VASC audit complete (ICD-11 ✅, 100 diagnoses ✅, 114 proc_cpts ✅)
**Status**: complete

### Step status
- [x] Phase 1 — state loaded (28 diags, 0 procs, 12 main_diags)
- [x] Phase 2A — structural scan (0 orphans, 0 empty-diag main_diags, 0 Arabic errors; 12 NO_PROC = expected, no procs imported yet)
- [x] Phase 2B — ICD-11 audit (28/28 verified — 17 ❌ + 2 ⚠️ leaf = 19 to fix; 9 ✅)
- [x] Phase 2C — CPT audit — N/A (no proc_cpts exist yet)
- [x] MIG-A (085) — 18 codes fixed (16 UPDATE + 1 mesenteric rename + 1 gangrene merge), applied ✅, 17 rows re-embedded ✅
- [x] Phase 2D — 72 candidate diagnoses (→ 100 total; every main_diag ≥5). In "2D — Candidate diagnoses" table.
- [x] MIG-D (086 +35, 087 +37) — applied ✅; **100 diagnoses**, 0 orphans, every main_diag ≥5; 67 new rows re-embedded ✅ (5 shared rows already embedded)
- [x] Phase 2E — candidate procs (114 listed; 13 new alpha groups; all AAPC-verified ✅)
- [x] Phase 3 — proc migrations written (088 +53, 089 +61, 090 links)
- [x] Phase 4 — proc migrations applied ✅ (115 procs linked = 114 VASC + MNR; 0 NO_PROC)
- [x] Phase 5 — proc embeddings backfilled ✅ (111 new + 3 shared AMPU rows already embedded = all 114)
- [x] Phase 6 — finalized (audit + CLAUDE.md)

### Migration numbers (last applied = 087)
- 085 = FixVascIcdCodes (MIG-A) — **APPLIED ✅**
- 086 = AddVascDiagnoses1 (MIG-D batch 1, 35) — **APPLIED ✅**
- 087 = AddVascDiagnoses2 (MIG-D batch 2, 37) — **APPLIED ✅**
- 088 = ImportVascProcCpts1 (MIG-E batch 1) — pending 2E
- 089 = ImportVascProcCpts2 (MIG-E batch 2, if >40) — pending 2E
- 090 = LinkVascProcCptsToMainDiags (MIG-F) — pending 2E

### ▶ Next action
**Done.** VASC audit complete — 100 diagnoses (all ICD-11 verified ✅, all embedded ✅) and
114 dept-specific proc_cpts (all AAPC-verified ✅, all embedded ✅; 13 new alpha groups + MNR).
Every main_diag has ≥5 diagnoses and ≥5 procs; 0 orphans, 0 empty categories. Migrations
085–090 applied to staging. Files force-added to git, **not yet committed** (commit on explicit
request only). Optional future polish: add tibial/inframalleolar atherectomy & stent (2026 LER
codes 37281–37295) and IVL codes if deeper PAD-endovascular granularity is wanted.

---

## 🔬 Working notes (verification log — written incrementally, safe to keep)

### Phase 1 snapshot
| Metric | Value |
|---|---|
| Main_diags | 12 |
| Diagnoses (current) | 28 |
| Diagnoses gap to 100 | 72 |
| Proc_cpts — dept-specific (current) | 0 |
| Proc_cpts gap to 100 | 100 |
| Existing alpha-code groups | none (no procs imported) |

12 main_diags: abdominal aortic aneurysm (2 dx), aortic dissection (2), arterial trauma (2),
arteriovenous fistula (1), carotid artery disease (2), peripheral aneurysms (2), peripheral
artery disease (8), renal artery disease (2), thoracic aortic aneurysm (2), varicose veins (1),
vascular access (1), venous thromboembolism (3).

### 2A — Structural scan
- Orphaned diagnoses: **0**
- Empty main_diags (no diagnosis): **0**
- Empty main_diags (no proc): **12** — expected; no proc_cpts imported for VASC yet. Resolved by Phase 2E/3 (import ≥100 procs + link, incl. MNR to every main_diag).
- Arabic terminology (دماغ/مخ etc.): **0 errors** — VASC has no brain-anatomy terms.

### 2B — ICD-11 audit findings
| icdCode (current) | icdName | Rating | Correct code | Correct ICD-11 name |
|---|---|---|---|---|
| BA80.0 | abdominal aortic aneurysm | ❌ WRONG | BD50.4Z | Abdominal aortic aneurysm, unspecified |
| BA80.1 | ruptured abdominal aortic aneurysm | ❌ WRONG | BD50.41 | Abdominal aortic aneurysm with rupture |
| BD50.1 | ascending thoracic aortic dissection | ✅ OK | BD50.1 | Ascending aorta dissection not beyond arch (category; leaf BD50.1Z) |
| BD50.2 | descending thoracic aortic dissection | ✅ OK | BD50.2 | Descending aorta dissection and distal propagation (category; leaf BD50.2Z) |
| NC95.0 | injury of popliteal artery | ✅ OK | NC95.0 | Injury of popliteal artery (category; leaf NC95.0Z) |
| NC95.7 | injury of multiple blood vessels at lower leg level | ✅ OK | NC95.7 | exact leaf |
| BD52.1 | arteriovenous fistula, acquired | ✅ OK | BD52.1 | exact leaf |
| BA41.0 | carotid artery stenosis | ❌ WRONG (flagged-open) | BD55 | Asymptomatic stenosis of intracranial or extracranial artery (syn. "stenosis of carotid artery NOS") |
| BD53.4 | carotid body tumour | ❌ WRONG | 2F9A | Neoplasms of unknown behaviour of endocrine glands (syn. "carotid body tumour NOS") |
| BA80.3 | popliteal artery aneurysm | ❌ WRONG | BD51.6&XA44K1 | Aneurysm of popliteal artery |
| BA80.4 | femoral artery aneurysm | ❌ WRONG | BD51.6&XA2JF3 | Aneurysm of femoral artery |
| BD10.4 | subclavian artery stenosis | ❌ WRONG (flagged-open) | 8B22.A | Subclavian steal syndrome (WHO syn. "subclavian artery stenosis", score 1.0) |
| BD30.2 | acute limb ischaemia | ✅ OK | BD30.2 | Acute arterial occlusion block, lower-extremity (acceptable for ALI) |
| BD40.Y | mesenteric artery ischaemia | ❌ WRONG | DD30.1 | Acute mesenteric arterial ischaemia (BD40.Y is atherosclerosis-NOS, wrong concept) |
| BD40.Z | peripheral arterial occlusive disease | ✅ OK | BD40.Z | Atherosclerotic chronic arterial occlusive disease, unspecified |
| BD4Z | critical limb ischaemia | ❌ WRONG | BD40.0 | Lower limb atherosclerosis (WHO syn. "critical limb ischaemia", score 1.0) |
| BD53.1 | gangrene | ❌ WRONG | MC85 | Gangrene |
| BD53.2 | diabetic peripheral vascular disease | ❌ WRONG | BD53.Y | Other specified secondary disorders of arteries/arterioles (syn. "Diabetic peripheral angiopathy") |
| BD53.3 | thoracic outlet syndrome | ❌ WRONG | 8B91.Z | Brachial plexus disorders, unspecified (Title "Thoracic outlet syndrome") |
| BD40.2 | renal artery stenosis | ✅ OK | BD40.2 | Atherosclerosis of renal artery (syn. "renal artery stenosis due to atherosclerosis") |
| BD41.0 | arterial fibromuscular dysplasia | ✅ OK | BD41.0 | Arterial fibromuscular dysplasia |
| BD50.3 | thoracic aortic aneurysm - without rupture | ⚠️ APPROX (leaf) | BD50.3Z | Thoracic aortic aneurysm, unspecified (syn. "without rupture", score 1.0) |
| BD50.Z | aneurysm of aortic root | ❌ WRONG | BD50.3Y&XA01A6 | Ascending aorta aneurysm (BD50.Z was block-level unspecified) |
| BD74.1 | varicose veins of lower extremity | ⚠️ APPROX (leaf) | BD74.1Z | Lower limb varicose veins, not further specified (score 1.0) |
| GB60.0 | end-stage renal disease | ❌ WRONG | GB61.5 | Chronic kidney disease, stage 5 (GB60.0 was "Acute kidney failure, stage 1") |
| BD51.0 | deep vein thrombosis | ❌ WRONG | BD71.4 | Lower limb deep vein thrombosis (BD51.0 was "Aneurysm/dissection of carotid artery") |
| BD52.0 | chronic venous insufficiency | ❌ WRONG | BD74.Z | Chronic peripheral venous insufficiency of lower extremities, unspecified (BD52.0 in arterial block) |
| BD53.0 | lymphoedema | ❌ WRONG | BD93.Z | Lymphoedema, unspecified (BD53.0 in secondary-arterial block) |

**Phase 2B totals: 17 ❌ WRONG + 2 ⚠️ leaf-refine = 19 to fix in MIG-A; 9 ✅ OK.**
Systematic corruption: `BA80.x` (aneurysms→should be BD50.4/BD51.6), `BD53.x` (lymphoedema/gangrene/diabetic-PVD/TOS/carotid-body all sequentially mis-assigned), `BD51.0`/`BD52.0`/`GB60.0` point at unrelated entities. All 28 target codes verified distinct (no intra-dept collisions).

⚠️ **MIG-A collision risk**: several target codes (e.g. MC85 gangrene, BD71.4 DVT, GB61.5 ESRD, BD93.Z lymphoedema, BD50.4Z AAA) may already exist as shared rows owned by other depts. Before MIG-A, query staging `diagnoses` for each target `icdCode`; for any that already exist → use the merge pattern (delete wrong VASC row + link VASC dept/main_diag to the existing shared row) instead of UPDATE (which would violate the unique `icdCode` constraint).

### 2C — CPT audit findings
N/A — no proc_cpts imported for VASC yet.

### 2D — Candidate diagnoses (planned, fully specified)
| icdCode | EN name | AR name | EN description | AR description | main_diag | In DB? |
|---|---|---|---|---|---|---|
| BD51.5 | iliac artery aneurysm | أم دم الشريان الحرقفي | Focal dilatation of the common or internal iliac artery, often coexisting with AAA; risk of rupture when large; repaired by open or endovascular techniques. | توسّع موضعي في الشريان الحرقفي الأصلي أو الباطن، غالبًا ما يصاحب أم دم الأبهر البطني؛ خطر التمزق عند كبر الحجم؛ يُعالَج بالجراحة المفتوحة أو بالطرق الوعائية الداخلية. | peripheral aneurysms | NO |
| BD51.Y&XA0R02 | splenic artery aneurysm | أم دم الشريان الطحالي | Most common visceral artery aneurysm; higher rupture risk in pregnancy; treated by embolisation, ligation or aneurysmectomy. | أكثر أمهات الدم الحشوية شيوعًا؛ يرتفع خطر تمزقها أثناء الحمل؛ تُعالَج بالإصمام أو الربط أو استئصال أم الدم. | peripheral aneurysms | NO |
| DB98.9 | hepatic artery aneurysm | أم دم الشريان الكبدي | Second most common visceral artery aneurysm; may present with haemobilia or rupture; managed by endovascular embolisation or open repair. | ثاني أكثر أمهات الدم الحشوية شيوعًا؛ قد يتظاهر بنزف صفراوي أو تمزق؛ يُدار بالإصمام الوعائي الداخلي أو الإصلاح المفتوح. | peripheral aneurysms | NO |
| BD51.3&XA5D68 | subclavian artery aneurysm | أم دم الشريان تحت الترقوة | Aneurysm of the subclavian artery, often related to thoracic outlet syndrome or atherosclerosis; risk of thromboembolism to the arm; repaired by resection and bypass. | أم دم في الشريان تحت الترقوة، غالبًا ما يرتبط بمتلازمة المخرج الصدري أو تصلب الشرايين؛ خطر الانصمام الخثاري إلى الذراع؛ يُصلَح بالاستئصال والمجازة. | peripheral aneurysms | NO |
| BD51.0 | carotid artery aneurysm | أم دم الشريان السباتي | Aneurysm of the extracranial carotid artery; presents as a pulsatile neck mass or with cerebral embolism; treated by resection with interposition graft. | أم دم في الشريان السباتي خارج القحف؛ يتظاهر بكتلة نابضة في الرقبة أو بانصمام دماغي؛ يُعالَج بالاستئصال مع طعم بيني. | carotid artery disease | NO |
| BD51.4 | renal artery aneurysm | أم دم الشريان الكلوي | Aneurysm of the renal artery, often at a bifurcation; may cause hypertension or rupture; managed by endovascular or open reconstruction. | أم دم في الشريان الكلوي، غالبًا عند التفرّع؛ قد يسبب ارتفاع ضغط الدم أو التمزق؛ يُدار بإعادة البناء الوعائي الداخلي أو المفتوح. | renal artery disease | NO |
| BD50.3Z&XA75Z8 | aneurysm of aortic arch | أم دم قوس الأبهر | Aneurysmal dilatation of the aortic arch; repair requires hybrid or open techniques with cerebral protection. | توسّع أمّ دمّي في قوس الأبهر؛ يتطلب إصلاحه تقنيات هجينة أو مفتوحة مع حماية دماغية. | thoracic aortic aneurysm | NO |
| BD50.3Z&XA5H34 | descending thoracic aortic aneurysm | أم دم الأبهر الصدري الهابط | Aneurysm of the descending thoracic aorta; managed by thoracic endovascular aortic repair (TEVAR) or open graft replacement. | أم دم في الأبهر الصدري الهابط؛ يُدار بإصلاح الأبهر الصدري الوعائي الداخلي (تيفار) أو استبدال الطعم المفتوح. | thoracic aortic aneurysm | NO |
| BD50.5Z | thoracoabdominal aortic aneurysm | أم دم الأبهر الصدري البطني | Aneurysm spanning the thoracic and abdominal aorta (Crawford extents); complex open or branched-endovascular repair with spinal cord protection. | أم دم يمتد على الأبهر الصدري والبطني (تصنيف كروفورد)؛ إصلاح معقّد مفتوح أو وعائي داخلي متفرّع مع حماية الحبل الشوكي. | thoracic aortic aneurysm | NO |
| BD50.31 | ruptured thoracic aortic aneurysm | تمزق أم دم الأبهر الصدري | Rupture of a thoracic aortic aneurysm — a surgical emergency with high mortality; emergency TEVAR or open repair. | تمزق أم دم الأبهر الصدري — حالة جراحية طارئة عالية الوفيات؛ إصلاح طارئ بتيفار أو جراحة مفتوحة. | thoracic aortic aneurysm | NO |
| 4A44.8 | thromboangiitis obliterans (Buerger disease) | التهاب الأوعية الخثاري المسد (داء بورغر) | Non-atherosclerotic segmental inflammatory occlusion of small/medium limb arteries in young smokers; causes digital ischaemia and gangrene; smoking cessation is key, sympathectomy/amputation in severe cases. | انسداد التهابي قطعي غير تصلبي للشرايين الصغيرة والمتوسطة في الأطراف لدى المدخنين الشباب؛ يسبب نقص تروية الأصابع والغنغرينة؛ الإقلاع عن التدخين أساسي، مع قطع الودي أو البتر في الحالات الشديدة. | peripheral artery disease | NO |
| 4A44.1 | Takayasu arteritis | التهاب الشرايين لتاكاياسو | Large-vessel granulomatous arteritis of the aorta and its branches ("pulseless disease") in young women; causes stenoses and aneurysms; managed medically with bypass/angioplasty for critical lesions. | التهاب شرايين حُبيبي للأوعية الكبيرة يصيب الأبهر وفروعه ("الداء عديم النبض") لدى الشابات؛ يسبب تضيقات وأمهات دم؛ يُدار دوائيًا مع المجازة أو رأب الأوعية للآفات الحرجة. | peripheral artery disease | NO |
| BD40.Z&XA6Y34 | aortoiliac occlusive disease (Leriche syndrome) | مرض انسداد الأبهر والحرقفي (متلازمة لوريش) | Atherosclerotic occlusion of the distal aorta and iliac arteries; triad of claudication, impotence and absent femoral pulses; treated by aortobifemoral bypass or endovascular stenting. | انسداد تصلبي للأبهر القاصي والشرايين الحرقفية؛ ثلاثي العرج والعنانة وغياب النبض الفخذي؛ يُعالَج بمجازة أبهرية فخذية مزدوجة أو دعامات وعائية داخلية. | peripheral artery disease | NO |
| BD54 | diabetic foot ulcer | قرحة القدم السكرية | Neuro-ischaemic ulceration of the diabetic foot, often complicated by infection; managed by debridement, revascularisation, offloading and sometimes amputation. | تقرّح عصبي إقفاري في القدم السكرية، غالبًا ما يتعقّد بالعدوى؛ يُدار بالتنضير وإعادة التوعية وتخفيف الضغط وأحيانًا البتر. | peripheral artery disease | NO |
| BD53.4Z | cholesterol atheroembolism (blue toe syndrome) | الانصمام العصيدي الكوليسترولي (متلازمة إصبع القدم الأزرق) | Showering of cholesterol crystals from a proximal atheromatous plaque, often after intervention; causes painful cyanotic toes with intact pulses; managed by statin and plaque exclusion. | انتثار بلورات الكوليسترول من لويحة عصيدية قريبة، غالبًا بعد التدخل؛ يسبب أصابع قدم مزرقّة مؤلمة مع نبض سليم؛ يُدار بالستاتين وعزل اللويحة. | peripheral artery disease | NO |
| BD40.Y&XA81N7 | upper limb atherosclerosis | تصلب شرايين الطرف العلوي | Atherosclerotic stenosis or occlusion of upper-limb arteries causing arm claudication; treated by bypass or endovascular intervention. | تضيق أو انسداد تصلبي لشرايين الطرف العلوي يسبب عرج الذراع؛ يُعالَج بالمجازة أو التدخل الوعائي الداخلي. | peripheral artery disease | NO |
| BD50.0Z | type A aortic dissection (ascending, beyond arch) | تسلّخ الأبهر من النوع أ (الصاعد الممتد لما بعد القوس) | Stanford type A / DeBakey I dissection involving the ascending aorta and propagating beyond the arch; a surgical emergency requiring open repair. | تسلّخ ستانفورد نوع أ / دباكي I يشمل الأبهر الصاعد ويمتد إلى ما بعد القوس؛ حالة جراحية طارئة تتطلب إصلاحًا مفتوحًا. | aortic dissection | NO |
| BD50.21 | ruptured descending aortic dissection | تسلّخ الأبهر الهابط المتمزق | Descending aortic dissection complicated by rupture or distal propagation with rupture; emergency TEVAR or open repair. | تسلّخ الأبهر الهابط المتعقّد بالتمزق أو الامتداد القاصي مع التمزق؛ إصلاح طارئ بتيفار أو جراحة مفتوحة. | aortic dissection | NO |
| LD28.0Y | familial (Marfan-related) thoracic aortic dissection | تسلّخ الأبهر الصدري العائلي (المرتبط بمتلازمة مارفان) | Heritable thoracic aortic disease (e.g. Marfan, Loeys-Dietz) predisposing to aneurysm and dissection; prophylactic root replacement at threshold diameters. | مرض أبهري صدري وراثي (مثل مارفان ولويس-ديتز) يهيّئ لأم الدم والتسلّخ؛ استبدال الجذر الوقائي عند أقطار عتبية. | aortic dissection | NO |
| BB00.Z | pulmonary embolism | الانصمام الرئوي | Obstruction of the pulmonary arteries by thrombus, usually from lower-limb DVT; ranges from asymptomatic to massive PE with shock; managed by anticoagulation, thrombolysis or embolectomy. | انسداد الشرايين الرئوية بخثرة، عادةً من تجلط الأوردة العميقة بالطرف السفلي؛ يتراوح من اللاعرضي إلى الانصمام الكتلي مع الصدمة؛ يُدار بمضادات التخثر أو حل الخثرة أو استئصال الصمة. | venous thromboembolism | NO |
| BD50.4Z&XA2LN9 | infrarenal abdominal aortic aneurysm | أم دم الأبهر البطني تحت الكلوي | AAA located below the renal arteries (commonest site); amenable to standard EVAR or open infrarenal repair. | أم دم الأبهر البطني الواقع أسفل الشرايين الكلوية (أكثر المواقع شيوعًا)؛ قابل للإصلاح الوعائي الداخلي القياسي أو الإصلاح المفتوح تحت الكلوي. | abdominal aortic aneurysm | NO |
| BD50.4Z&XA5EX6 | suprarenal abdominal aortic aneurysm | أم دم الأبهر البطني فوق الكلوي | AAA involving the aorta above the renal arteries; requires fenestrated/branched EVAR or open suprarenal repair with renal protection. | أم دم الأبهر البطني الذي يشمل الأبهر فوق الشرايين الكلوية؛ يتطلب إصلاحًا وعائيًا مُنَفَّذًا أو متفرّعًا أو إصلاحًا مفتوحًا فوق الكلوي مع حماية كلوية. | abdominal aortic aneurysm | NO |
| BD50.40 | abdominal aortic aneurysm with perforation | أم دم الأبهر البطني مع انثقاب | Contained or frank perforation of an AAA; surgical emergency requiring immediate repair. | انثقاب محتوى أو صريح لأم دم الأبهر البطني؛ حالة جراحية طارئة تتطلب إصلاحًا فوريًا. | abdominal aortic aneurysm | NO |
| BD50.41&XA2LN9 | ruptured infrarenal abdominal aortic aneurysm | تمزق أم دم الأبهر البطني تحت الكلوي | Rupture of an infrarenal AAA; life-threatening emergency managed by emergency EVAR or open repair. | تمزق أم دم الأبهر البطني تحت الكلوي؛ حالة طارئة مهددة للحياة تُدار بالإصلاح الوعائي الداخلي الطارئ أو الجراحة المفتوحة. | abdominal aortic aneurysm | NO |
| BD5Y | mycotic (infected) aortic aneurysm | أم دم الأبهر الفطري (المُعدي) | Infective aneurysm of the aorta with vessel-wall infection; treated by debridement, in-situ or extra-anatomic reconstruction and antibiotics. | أم دم إنتاني في الأبهر مع عدوى جدار الوعاء؛ يُعالَج بالتنضير وإعادة البناء في الموضع أو خارج التشريحي مع المضادات الحيوية. | abdominal aortic aneurysm | NO |
| NC75.0Z | injury of femoral artery | إصابة الشريان الفخذي | Traumatic injury of the femoral artery (penetrating or blunt); managed by primary repair, vein graft or ligation; limb-threatening. | إصابة رضحية للشريان الفخذي (نافذة أو كليلة)؛ تُدار بالإصلاح الأولي أو طعم وريدي أو الربط؛ تهدد الطرف. | arterial trauma | NO |
| NC15.1Z | injury of brachial artery | إصابة الشريان العضدي | Traumatic injury of the brachial artery, often with supracondylar fractures; repaired to preserve forearm perfusion. | إصابة رضحية للشريان العضدي، غالبًا مع كسور فوق اللقمة؛ تُصلَح للحفاظ على تروية الساعد. | arterial trauma | NO |
| NA60.0Z | injury of carotid artery | إصابة الشريان السباتي | Traumatic carotid artery injury (blunt or penetrating); risk of stroke; managed by repair, stenting or ligation. | إصابة رضحية للشريان السباتي (كليلة أو نافذة)؛ خطر السكتة الدماغية؛ تُدار بالإصلاح أو الدعامة أو الربط. | arterial trauma | NO |
| NB30.1Z | injury of innominate or subclavian artery | إصابة الشريان اللامُسمّى أو تحت الترقوة | Traumatic injury of the innominate or subclavian artery; major haemorrhage risk; repaired via open or endovascular techniques. | إصابة رضحية للشريان اللامُسمّى أو تحت الترقوة؛ خطر نزف كبير؛ تُصلَح بتقنيات مفتوحة أو وعائية داخلية. | arterial trauma | NO |
| NB90.1Z | injury of inferior vena cava | إصابة الوريد الأجوف السفلي | Traumatic injury of the inferior vena cava; high mortality; managed by repair, ligation or packing. | إصابة رضحية للوريد الأجوف السفلي؛ وفيات عالية؛ تُدار بالإصلاح أو الربط أو الحشو. | arterial trauma | NO |
| ND56.5 | traumatic arteriovenous fistula | الناسور الشرياني الوريدي الرضحي | Abnormal artery-to-vein communication after trauma or iatrogenic puncture; causes high-output flow and steal; treated by surgical or endovascular closure. | اتصال شاذ بين الشريان والوريد بعد رض أو وخز علاجي المنشأ؛ يسبب جريانًا عالي النتاج وسرقة؛ يُعالَج بالإغلاق الجراحي أو الوعائي الداخلي. | arteriovenous fistula | NO |
| LA90.3Z | peripheral arteriovenous malformation | التشوه الشرياني الوريدي الطرفي | Congenital high-flow vascular malformation of a limb; may cause pain, bleeding or limb overgrowth; managed by embolisation and resection. | تشوه وعائي خِلقي عالي الجريان في أحد الأطراف؛ قد يسبب ألمًا أو نزفًا أو فرط نمو الطرف؛ يُدار بالإصمام والاستئصال. | arteriovenous fistula | NO |
| LA90.5 | pulmonary arteriovenous fistula | الناسور الشرياني الوريدي الرئوي | Direct pulmonary artery-to-vein shunt (often in HHT); causes hypoxaemia and paradoxical embolism; treated by transcatheter embolisation. | تحويلة مباشرة من الشريان إلى الوريد الرئوي (غالبًا في توسع الشعيرات النزفي الوراثي)؛ تسبب نقص الأكسجة والانصمام المتناقض؛ تُعالَج بالإصمام عبر القسطرة. | arteriovenous fistula | NO |
| DB98.73 | splanchnic arteriovenous fistula | الناسور الشرياني الوريدي الحشوي | Arteriovenous fistula of the splanchnic (visceral) circulation; may cause portal hypertension or bleeding; treated by embolisation or resection. | ناسور شرياني وريدي في الدوران الحشوي؛ قد يسبب ارتفاع ضغط الدم البابي أو النزف؛ يُعالَج بالإصمام أو الاستئصال. | arteriovenous fistula | NO |
| 8B22.42 | dural arteriovenous fistula | الناسور الشرياني الوريدي الجافوي | Acquired shunt between dural arteries and venous sinuses; presents with bruit, headache or haemorrhage; treated by endovascular embolisation. | تحويلة مكتسبة بين الشرايين الجافوية والجيوب الوريدية؛ تتظاهر بلغط أو صداع أو نزف؛ تُعالَج بالإصمام الوعائي الداخلي. | arteriovenous fistula | NO |
| 8B22.0 | extracranial carotid artery dissection | تسلّخ الشريان السباتي خارج القحف | Dissection of the extracranial carotid artery, a leading cause of stroke in the young; managed by antithrombotics or stenting. | تسلّخ الشريان السباتي خارج القحف، من الأسباب الرئيسية للسكتة لدى الشباب؛ يُدار بمضادات التخثر أو الدعامة. | carotid artery disease | NO |
| BD55&XA1XP6 | vertebral artery stenosis | تضيق الشريان الفقري | Stenosis of the vertebral artery causing posterior-circulation ischaemia; managed medically or by angioplasty/stenting. | تضيق الشريان الفقري يسبب نقص تروية الدوران الخلفي؛ يُدار دوائيًا أو برأب الأوعية والدعامة. | carotid artery disease | NO |
| GB90.3 | renal artery occlusion / infarction | انسداد الشريان الكلوي / احتشاء الكلية | Acute thromboembolic occlusion of the renal artery causing renal infarction; managed by anticoagulation, thrombolysis or revascularisation. | انسداد خثاري صمي حاد للشريان الكلوي يسبب احتشاء الكلية؛ يُدار بمضادات التخثر أو حل الخثرة أو إعادة التوعية. | renal artery disease | NO |
| BA04.Y | renovascular hypertension | ارتفاع ضغط الدم الكلوي الوعائي | Secondary hypertension from renal artery stenosis (atherosclerotic or fibromuscular); managed by angioplasty/stenting or revascularisation. | ارتفاع ضغط الدم الثانوي الناجم عن تضيق الشريان الكلوي (تصلبي أو ليفي عضلي)؛ يُدار برأب الأوعية والدعامة أو إعادة التوعية. | renal artery disease | NO |
| BD41.0&XA69V9 | renal artery fibromuscular dysplasia | خلل التنسج الليفي العضلي للشريان الكلوي | Fibromuscular dysplasia of the renal artery ("string of beads"), a cause of renovascular hypertension in young women; treated by balloon angioplasty. | خلل التنسج الليفي العضلي للشريان الكلوي ("سبحة الخرز")، سبب لارتفاع ضغط الدم الكلوي الوعائي لدى الشابات؛ يُعالَج برأب الأوعية بالبالون. | renal artery disease | NO |
| BD74.3Z | venous leg ulcer | قرحة الساق الوريدية | Chronic ulcer of the gaiter area from venous hypertension; managed by compression, venous intervention and wound care. | قرحة مزمنة في منطقة الساق السفلية ناجمة عن ارتفاع الضغط الوريدي؛ تُدار بالضغط والتدخل الوريدي والعناية بالجرح. | varicose veins | NO |
| BD74.31 | recurrent venous leg ulcer | قرحة الساق الوريدية الناكسة | Venous leg ulcer that recurs after healing, reflecting uncorrected venous hypertension; requires reassessment of reflux/obstruction. | قرحة ساق وريدية تعاود الظهور بعد الالتئام، تعكس ارتفاع ضغط وريدي غير مُصحَّح؛ تتطلب إعادة تقييم الارتجاع أو الانسداد. | varicose veins | NO |
| EF20.2 | lower limb venous telangiectases (spider veins) | توسع الشعيرات الوريدية بالطرف السفلي (الأوردة العنكبوتية) | Intradermal venous flares and reticular veins of the leg; mainly cosmetic, treated by sclerotherapy or laser. | توهجات وريدية داخل الأدمة وأوردة شبكية في الساق؛ تجميلية بشكل أساسي، تُعالَج بالعلاج بالتصليب أو الليزر. | varicose veins | NO |
| BD75.3 | pelvic varices (pelvic congestion syndrome) | دوالي الحوض (متلازمة احتقان الحوض) | Dilated pelvic veins causing chronic pelvic pain and vulvar/limb varices; treated by ovarian/pelvic vein embolisation. | أوردة حوضية متوسعة تسبب ألمًا حوضيًا مزمنًا ودوالي بالفرج والطرف؛ تُعالَج بإصمام الوريد المبيضي أو الحوضي. | varicose veins | NO |
| BD74.12&XA76A3 | varicose veins with reflux | الدوالي مع الارتجاع | Lower-limb varicose veins with saphenous/non-truncal reflux; treated by thermal ablation, foam sclerotherapy or stripping. | دوالي الطرف السفلي مع ارتجاع صافني أو غير جذعي؛ تُعالَج بالاجتثاث الحراري أو التصليب الرغوي أو السلخ. | varicose veins | NO |
| GB61.4 | chronic kidney disease, stage 4 | مرض الكلى المزمن، المرحلة الرابعة | Severe CKD (GFR 15–29) approaching dialysis; timing for permanent vascular access creation. | مرض كلى مزمن شديد (الترشيح الكبيبي 15–29) يقترب من الديلزة؛ توقيت إنشاء وصول وعائي دائم. | vascular access | NO |
| QB42 | dependence on renal dialysis (vascular access) | الاعتماد على الديلزة الكلوية (الوصول الوعائي) | Established dialysis dependence requiring functioning vascular access (AV fistula/graft); covers access maturation and surveillance. | اعتماد ثابت على الديلزة يتطلب وصولًا وعائيًا فعّالًا (ناسور أو طعم شرياني وريدي)؛ يشمل نضج الوصول ومراقبته. | vascular access | NO |
| BD73.1 | acquired superior vena cava / central vein stenosis | تضيق الوريد الأجوف العلوي / الوريد المركزي المكتسب | Central venous (SVC) stenosis or obstruction, often after catheters/pacemakers, compromising dialysis access; treated by angioplasty/stenting. | تضيق أو انسداد الوريد المركزي (الأجوف العلوي)، غالبًا بعد القساطر أو الناظمات، يعيق الوصول للديلزة؛ يُعالَج برأب الأوعية والدعامة. | vascular access | NO |
| BD73.20 | obstruction of peripheral vein (access stenosis) | انسداد الوريد الطرفي (تضيق الوصول) | Stenosis/obstruction of a peripheral vein compromising AV access outflow; treated by angioplasty or surgical revision. | تضيق أو انسداد وريد طرفي يعيق تدفق الوصول الشرياني الوريدي؛ يُعالَج برأب الأوعية أو المراجعة الجراحية. | vascular access | NO |
| BD71.0 | upper limb deep vein thrombosis | تجلط الأوردة العميقة بالطرف العلوي | DVT of the axillary/subclavian veins (Paget-Schroetter or catheter-related); managed by anticoagulation, thrombolysis or thoracic outlet decompression. | تجلط الأوردة العميقة المحورية/تحت الترقوة (باجيت-شروتر أو متعلق بالقسطرة)؛ يُدار بمضادات التخثر أو حل الخثرة أو تخفيف ضغط المخرج الصدري. | venous thromboembolism | NO |
| BD71.3 | iliac vein thrombosis | تجلط الوريد الحرقفي | Thrombosis of the iliac vein (often iliofemoral DVT, may relate to May-Thurner compression); managed by anticoagulation and catheter-directed thrombolysis/stenting. | تجلط الوريد الحرقفي (غالبًا تجلط حرقفي فخذي، قد يرتبط بانضغاط ماي-ثيرنر)؛ يُدار بمضادات التخثر وحل الخثرة الموجّه بالقسطرة أو الدعامة. | venous thromboembolism | NO |
| BD70.0 | superficial thrombophlebitis of lower limb | التهاب الوريد الخثاري السطحي بالطرف السفلي | Thrombosis and inflammation of a superficial leg vein; risk of extension to the deep system; managed by anti-inflammatories and anticoagulation if near the junction. | تجلط والتهاب وريد سطحي بالساق؛ خطر الامتداد إلى الجملة العميقة؛ يُدار بمضادات الالتهاب ومضادات التخثر عند القرب من الوصل. | venous thromboembolism | NO |
| BD71.1&XA7UV5 | inferior vena cava thrombosis | تجلط الوريد الأجوف السفلي | Thrombosis of the inferior vena cava, often extension of iliofemoral DVT or related to filters/tumour; managed by anticoagulation, thrombolysis or thrombectomy. | تجلط الوريد الأجوف السفلي، غالبًا امتداد لتجلط حرقفي فخذي أو متعلق بالمرشحات أو الورم؛ يُدار بمضادات التخثر أو حل الخثرة أو استئصال الخثرة. | venous thromboembolism | NO |
| DB98.3 | portal vein thrombosis | تجلط الوريد البابي | Thrombosis of the portal vein causing portal hypertension; associated with cirrhosis, malignancy or thrombophilia; managed by anticoagulation. | تجلط الوريد البابي يسبب ارتفاع ضغط الدم البابي؛ يرتبط بالتشمع أو الورم الخبيث أو أهبة التخثر؛ يُدار بمضادات التخثر. | venous thromboembolism | NO |
| BB00.0 | acute pulmonary thromboembolism | الانصمام الخثاري الرئوي الحاد | Acute PE from venous thromboembolism; risk-stratified by haemodynamic status; managed by anticoagulation, thrombolysis or embolectomy. | انصمام رئوي حاد ناجم عن الجلطة الوريدية؛ يُصنَّف الخطر حسب الحالة الديناميكية الدموية؛ يُدار بمضادات التخثر أو حل الخثرة أو استئصال الصمة. | venous thromboembolism | NO |
| BD30.20&XA44K1 | acute thromboembolic popliteal artery occlusion | انسداد الشريان المأبضي الخثاري الصمي الحاد | Acute embolic/thrombotic occlusion of the popliteal artery causing acute limb ischaemia; managed by embolectomy or thrombolysis. | انسداد صمي/خثاري حاد للشريان المأبضي يسبب نقص تروية حاد بالطرف؛ يُدار باستئصال الصمة أو حل الخثرة. | peripheral artery disease | NO |
| BD30.1Y&XA83D6 | acute iliac artery occlusion | انسداد الشريان الحرقفي الحاد | Acute occlusion of the iliac artery causing limb-threatening ischaemia; managed by thrombectomy, thrombolysis or bypass. | انسداد حاد للشريان الحرقفي يسبب نقص تروية يهدد الطرف؛ يُدار باستئصال الخثرة أو حل الخثرة أو المجازة. | peripheral artery disease | NO |
| DD31.0Y | chronic mesenteric ischaemia | نقص التروية المساريقي المزمن | Chronic atherosclerotic mesenteric arterial insufficiency causing postprandial pain and weight loss ("mesenteric angina"); treated by revascularisation. | قصور شرياني مساريقي تصلبي مزمن يسبب ألمًا بعد الأكل وفقدان وزن ("ذبحة مساريقية")؛ يُعالَج بإعادة التوعية. | peripheral artery disease | NO |
| BD42.Z | Raynaud phenomenon | ظاهرة رينو | Episodic digital vasospasm with colour change triggered by cold or stress; primary or secondary to connective-tissue disease; managed medically, with sympathectomy in refractory cases. | تشنج وعائي رقمي نوبي مع تغير اللون يثيره البرد أو التوتر؛ أولي أو ثانوي لمرض النسيج الضام؛ يُدار دوائيًا، مع قطع الودي في الحالات المعنّدة. | peripheral artery disease | NO |
| BD30.00&XA1138 | acute thromboembolic brachial artery occlusion | انسداد الشريان العضدي الخثاري الصمي الحاد | Acute embolic occlusion of the brachial artery causing arm ischaemia; managed by embolectomy. | انسداد صمي حاد للشريان العضدي يسبب نقص تروية الذراع؛ يُدار باستئصال الصمة. | peripheral artery disease | NO |
| BD40.1 | atherosclerosis of aorta | تصلب الشريان الأبهر | Atheromatous disease of the aorta, a source of atheroembolism and aneurysm; managed by risk-factor control and treatment of complications. | مرض عصيدي في الأبهر، مصدر للانصمام العصيدي وأم الدم؛ يُدار بالتحكم في عوامل الخطر ومعالجة المضاعفات. | peripheral artery disease | NO |
| BD30.10 | acute thromboembolic aortoiliac occlusion (saddle embolus) | الانسداد الأبهري الحرقفي الخثاري الصمي الحاد (الصمة السرجية) | Acute saddle embolus at the aortic bifurcation causing bilateral limb ischaemia; surgical emergency requiring embolectomy. | صمة سرجية حادة عند تفرع الأبهر تسبب نقص تروية الطرفين؛ حالة جراحية طارئة تتطلب استئصال الصمة. | peripheral artery disease | NO |
| BD30.2Y | acute lower limb arterial occlusion (femoral/crural) | الانسداد الشرياني الحاد بالطرف السفلي (الفخذي/الساقي) | Acute occlusion of the superficial femoral or crural arteries causing acute limb ischaemia; managed by thrombolysis or bypass. | انسداد حاد للشريان السطحي الفخذي أو الشرايين الساقية يسبب نقص تروية حاد بالطرف؛ يُدار بحل الخثرة أو المجازة. | peripheral artery disease | NO |
| BD41.Z | non-atherosclerotic chronic arterial occlusive disease | مرض انسداد الشرايين المزمن غير التصلبي | Chronic arterial occlusion from non-atherosclerotic causes (vasculitis, radiation, entrapment); managed by treating the underlying cause and revascularisation. | انسداد شرياني مزمن من أسباب غير تصلبية (التهاب الأوعية، الإشعاع، الانحباس)؛ يُدار بمعالجة السبب الكامن وإعادة التوعية. | peripheral artery disease | NO |
| BD30.0Y&XA38W3 | acute axillary artery occlusion | انسداد الشريان الإبطي الحاد | Acute occlusion of the axillary artery causing upper-limb ischaemia; managed by embolectomy or bypass. | انسداد حاد للشريان الإبطي يسبب نقص تروية الطرف العلوي؛ يُدار باستئصال الصمة أو المجازة. | peripheral artery disease | NO |
| BD71.2 | renal vein thrombosis | تجلط الوريد الكلوي | Thrombosis of the renal vein (nephrotic syndrome, tumour or trauma); may cause flank pain and renal impairment; managed by anticoagulation. | تجلط الوريد الكلوي (المتلازمة الكلائية أو الورم أو الرض)؛ قد يسبب ألمًا خاصرياً وقصورًا كلويًا؛ يُدار بمضادات التخثر. | venous thromboembolism | NO |
| BD71.1&XA5WA4 | superior vena cava thrombosis | تجلط الوريد الأجوف العلوي | Thrombosis of the superior vena cava, often catheter- or malignancy-related, causing SVC syndrome; managed by anticoagulation, thrombolysis or stenting. | تجلط الوريد الأجوف العلوي، غالبًا متعلق بالقسطرة أو الورم الخبيث، يسبب متلازمة الأجوف العلوي؛ يُدار بمضادات التخثر أو حل الخثرة أو الدعامة. | venous thromboembolism | NO |
| BD70.1 | superficial thrombophlebitis of upper limb | التهاب الوريد الخثاري السطحي بالطرف العلوي | Thrombophlebitis of superficial upper-limb veins, often infusion/cannula-related; managed conservatively. | التهاب وريد خثاري في الأوردة السطحية للطرف العلوي، غالبًا متعلق بالتسريب أو القنية؛ يُدار بشكل محافظ. | venous thromboembolism | NO |
| BD70.2 | thrombophlebitis migrans (Trousseau syndrome) | التهاب الوريد الخثاري المهاجر (متلازمة تروسو) | Recurrent migratory superficial thrombophlebitis, a marker of occult malignancy or vasculitis; warrants underlying-cause work-up. | التهاب وريد خثاري سطحي مهاجر متكرر، علامة على ورم خبيث خفي أو التهاب أوعية؛ يستلزم استقصاء السبب الكامن. | venous thromboembolism | NO |
| BD74.30 | primary venous leg ulcer | قرحة الساق الوريدية الأولية | First-presentation venous leg ulcer due to superficial/deep venous reflux; managed by compression and correction of reflux. | قرحة ساق وريدية لأول مرة بسبب ارتجاع وريدي سطحي أو عميق؛ تُدار بالضغط وتصحيح الارتجاع. | varicose veins | NO |
| BD50.30 | thoracic aortic aneurysm with perforation | أم دم الأبهر الصدري مع انثقاب | Perforation of a thoracic aortic aneurysm; surgical emergency requiring immediate repair. | انثقاب أم دم الأبهر الصدري؛ حالة جراحية طارئة تتطلب إصلاحًا فوريًا. | thoracic aortic aneurysm | NO |
| BD50.4Y | other specified abdominal aortic aneurysm | أم دم الأبهر البطني المحدد الآخر | Other specified AAA pattern (e.g. descending/atypical morphology) not covered by the standard sited codes; managed per size and anatomy. | نمط محدد آخر من أم دم الأبهر البطني (مثل المورفولوجيا الهابطة/غير النمطية) غير مشمول بالرموز الموضعية القياسية؛ يُدار حسب الحجم والتشريح. | abdominal aortic aneurysm | NO |

### 2E — Candidate proc_cpts (planned)
Compact index (full EN/AR title + description live in the migration files 088/089). Each
`numCode` AAPC-verified (`aapc.com/codes/cpt-codes/<code>`). Alpha groups (new, VASC had none):
AORT, EVAR, ENDO, BYPS, ENDA, PERA, AVFR, THRM, AMPU, DIAL, VARX, IVCF, TRMA + shared MNR.

| alphaCode | numCode | EN title | main_diag(s) | Verified |
|---|---|---|---|---|
| AORT | 35081-00 | Open repair, abdominal aortic aneurysm | abdominal aortic aneurysm | ✅ |
| AORT | 35082-00 | Open repair, ruptured abdominal aortic aneurysm | abdominal aortic aneurysm | ✅ |
| AORT | 35091-00 | Open repair, AAA involving visceral vessels | abdominal aortic aneurysm | ✅ |
| AORT | 35102-00 | Open repair, aortoiliac aneurysm | abdominal aortic aneurysm | ✅ |
| AORT | 35103-00 | Open repair, ruptured aortoiliac aneurysm | abdominal aortic aneurysm | ✅ |
| AORT | 33858-00 | Ascending aorta graft for dissection (CPB) | aortic dissection | ✅ (replaces deleted 33860) |
| AORT | 33863-00 | Ascending aorta + root replacement, valved conduit (Bentall) | aortic dissection | ✅ |
| AORT | 33871-00 | Aortic arch graft, reimplant arch vessels (CPB/DHCA) | thoracic aortic aneurysm, aortic dissection | ✅ (replaces deleted 33870) |
| AORT | 33875-00 | Descending thoracic aorta graft | thoracic aortic aneurysm | ✅ |
| AORT | 33877-00 | Thoracoabdominal aortic aneurysm graft | thoracic aortic aneurysm | ✅ |
| EVAR | 34701-00 | EVAR, infrarenal aorta, aorto-aortic tube (elective) | abdominal aortic aneurysm | ✅ |
| EVAR | 34702-00 | EVAR, ruptured infrarenal aorta, aorto-aortic tube | abdominal aortic aneurysm | ✅ |
| EVAR | 34703-00 | EVAR, aorto-uni-iliac endograft | abdominal aortic aneurysm | ✅ |
| EVAR | 34705-00 | EVAR, aorto-bi-iliac (bifurcated) endograft | abdominal aortic aneurysm | ✅ |
| EVAR | 34707-00 | Endovascular repair, ilio-iliac tube endograft | peripheral aneurysms | ✅ |
| EVAR | 34841-00 | Fenestrated EVAR, visceral aorta, one visceral artery | abdominal aortic aneurysm | ✅ |
| EVAR | 34845-00 | Fenestrated EVAR, visceral + infrarenal aorta | abdominal aortic aneurysm | ✅ |
| EVAR | 33880-00 | TEVAR, descending thoracic aorta, covering L subclavian | thoracic aortic aneurysm, aortic dissection | ✅ |
| EVAR | 33881-00 | TEVAR, descending thoracic aorta, not covering subclavian | thoracic aortic aneurysm, aortic dissection | ✅ |
| EVAR | 33883-00 | TEVAR, proximal extension endograft | thoracic aortic aneurysm | ✅ |
| ENDO | 37254-00 | Iliac angioplasty, stenosis, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37256-00 | Iliac angioplasty, occlusion, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37258-00 | Iliac stent (± angioplasty), stenosis, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37260-00 | Iliac stent, occlusion, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37263-00 | Femoral-popliteal angioplasty, stenosis, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37265-00 | Femoral-popliteal angioplasty, occlusion, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37267-00 | Femoral-popliteal stent (± angioplasty), stenosis, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37269-00 | Femoral-popliteal stent, occlusion, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37280-00 | Tibial-peroneal angioplasty, stenosis, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37296-00 | Inframalleolar (pedal) angioplasty, stenosis, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37236-00 | Transcatheter stent, visceral/other artery (not LE/carotid/coronary) | renal artery disease | ✅ |
| ENDO | 37246-00 | Transluminal angioplasty, visceral/other artery (not LE) | renal artery disease | ✅ |
| ENDO | 37215-00 | Cervical carotid artery stent with embolic protection | carotid artery disease | ✅ |
| ENDO | 37216-00 | Intrathoracic carotid/innominate artery stent | carotid artery disease | ✅ |
| ENDO | 37271-00 | Femoral-popliteal atherectomy, stenosis, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| ENDO | 37273-00 | Femoral-popliteal atherectomy, occlusion, initial vessel | peripheral artery disease | ✅ NEW-2026 |
| BYPS | 35646-00 | Aortobifemoral bypass graft (synthetic) | peripheral artery disease | ✅ |
| BYPS | 35647-00 | Aortofemoral bypass graft, unilateral (synthetic) | peripheral artery disease | ✅ |
| BYPS | 35621-00 | Axillofemoral bypass graft | peripheral artery disease | ✅ |
| BYPS | 35556-00 | Femoral-popliteal bypass with vein | peripheral artery disease | ✅ |
| BYPS | 35656-00 | Femoral-popliteal bypass with synthetic graft | peripheral artery disease | ✅ |
| BYPS | 35566-00 | Femoral-tibial/peroneal bypass with vein | peripheral artery disease | ✅ |
| BYPS | 35571-00 | Popliteal-tibial/peroneal bypass with vein | peripheral artery disease | ✅ |
| BYPS | 35661-00 | Femoro-femoral crossover bypass | peripheral artery disease | ✅ |
| BYPS | 35606-00 | Carotid-subclavian bypass graft | carotid artery disease | ✅ |
| BYPS | 35636-00 | Splenorenal bypass graft | renal artery disease | ✅ |
| BYPS | 35560-00 | Aortorenal bypass with vein graft | renal artery disease | ✅ (35560 is bypass, not endarterectomy) |
| ENDA | 35301-00 | Carotid/vertebral/subclavian endarterectomy (neck) | carotid artery disease | ✅ |
| ENDA | 35371-00 | Common femoral endarterectomy | peripheral artery disease | ✅ |
| ENDA | 35372-00 | Deep (profunda) femoral endarterectomy | peripheral artery disease | ✅ |
| ENDA | 35351-00 | Iliac endarterectomy | peripheral artery disease | ✅ |
| ENDA | 35331-00 | Abdominal aorta endarterectomy | peripheral artery disease | ✅ |
| ENDA | 35341-00 | Mesenteric/celiac/renal endarterectomy | renal artery disease | ✅ |
| THRM | 34201-00 | Embolectomy, femoropopliteal/aortoiliac, leg incision | peripheral artery disease | ✅ |
| THRM | 34203-00 | Embolectomy, popliteal-tibioperoneal, leg incision | peripheral artery disease | ✅ |
| THRM | 34101-00 | Embolectomy, axillary/brachial/subclavian/innominate, arm incision | peripheral artery disease, arterial trauma | ✅ |
| THRM | 34151-00 | Embolectomy, renal/celiac/mesenteric/aortoiliac, abdominal incision | renal artery disease, peripheral artery disease | ✅ |
| THRM | 37184-00 | Percutaneous arterial mechanical thrombectomy, primary | peripheral artery disease | ✅ |
| PERA | 35141-00 | Open repair, femoral artery aneurysm | peripheral aneurysms | ✅ |
| PERA | 35151-00 | Open repair, popliteal artery aneurysm | peripheral aneurysms | ✅ |
| PERA | 35131-00 | Open repair, iliac artery aneurysm | peripheral aneurysms | ✅ |
| PERA | 35121-00 | Open repair, hepatic/celiac/renal/mesenteric (visceral) artery aneurysm | peripheral aneurysms | ✅ |
| PERA | 35045-00 | Open repair, radial/ulnar artery aneurysm | peripheral aneurysms | ✅ |
| PERA | 35001-00 | Open repair, carotid/subclavian artery aneurysm (neck) | carotid artery disease | ✅ |
| PERA | 60600-00 | Excision of carotid body tumour | carotid artery disease | ✅ |
| AMPU | 27590-00 | Above-knee amputation (thigh) | peripheral artery disease | ✅ |
| AMPU | 27880-00 | Below-knee amputation | peripheral artery disease | ✅ |
| AMPU | 28805-00 | Transmetatarsal amputation of foot | peripheral artery disease | ✅ |
| AMPU | 28820-00 | Toe amputation at metatarsophalangeal joint | peripheral artery disease | ✅ |
| AMPU | 27295-00 | Hip disarticulation | peripheral artery disease | ✅ |
| THRM | 37211-00 | Transcatheter arterial thrombolysis infusion (initial day) | peripheral artery disease | ✅ |
| DIAL | 36821-00 | AV anastomosis, direct (Cimino fistula) | vascular access | ✅ |
| DIAL | 36818-00 | AV anastomosis, upper arm cephalic vein transposition | vascular access | ✅ |
| DIAL | 36819-00 | AV anastomosis, upper arm basilic vein transposition | vascular access | ✅ |
| DIAL | 36825-00 | AV graft for dialysis, autogenous vein | vascular access | ✅ |
| DIAL | 36830-00 | AV graft for dialysis, nonautogenous (synthetic) | vascular access | ✅ |
| DIAL | 36831-00 | Open thrombectomy, dialysis AV fistula/graft (no revision) | vascular access | ✅ |
| DIAL | 36833-00 | Open revision, dialysis AV fistula with thrombectomy | vascular access | ✅ |
| DIAL | 36832-00 | Open revision, dialysis AV fistula without thrombectomy | vascular access | ✅ |
| DIAL | 36558-00 | Insertion of tunneled centrally inserted CV (dialysis) catheter | vascular access | ✅ |
| DIAL | 36902-00 | Percutaneous angioplasty within dialysis circuit | vascular access | ✅ |
| DIAL | 37607-00 | Ligation/banding of angioaccess AV fistula | vascular access | ✅ (angioaccess, not congenital AVF) |
| AVFR | 35182-00 | Repair, congenital AV fistula, thorax/abdomen | arteriovenous fistula | ✅ |
| AVFR | 35184-00 | Repair, congenital AV fistula, extremities | arteriovenous fistula | ✅ |
| AVFR | 35188-00 | Repair, acquired/traumatic AV fistula, extremities | arteriovenous fistula | ✅ (AAPC lay text imprecise; CPT def = extremities) |
| AVFR | 35189-00 | Repair, acquired/traumatic AV fistula, thorax/abdomen | arteriovenous fistula | ✅ |
| AVFR | 37242-00 | Vascular embolization, arterial (AVM/AVF, non-tumor) | arteriovenous fistula | ✅ |
| AVFR | 37241-00 | Vascular embolization, venous (malformation/varices) | arteriovenous fistula, varicose veins | ✅ |
| VARX | 36475-00 | Endovenous radiofrequency ablation, first vein | varicose veins | ✅ |
| VARX | 36478-00 | Endovenous laser ablation, first vein | varicose veins | ✅ |
| VARX | 36465-00 | US-guided foam sclerosant, single truncal vein | varicose veins | ✅ |
| VARX | 36468-00 | Sclerotherapy of spider veins (telangiectasia) | varicose veins | ✅ |
| VARX | 36470-00 | Sclerotherapy, single incompetent vein | varicose veins | ✅ |
| VARX | 37700-00 | Ligation/division of long saphenous vein at SFJ | varicose veins | ✅ |
| VARX | 37722-00 | Ligation, division and stripping, long saphenous vein | varicose veins | ✅ |
| VARX | 37718-00 | Ligation, division and stripping, short saphenous vein | varicose veins | ✅ |
| VARX | 37765-00 | Stab phlebectomy of varicose veins, 10-20 incisions | varicose veins | ✅ |
| VARX | 37766-00 | Stab phlebectomy of varicose veins, >20 incisions | varicose veins | ✅ |
| IVCF | 37191-00 | Endovascular insertion of IVC filter | venous thromboembolism | ✅ |
| IVCF | 37193-00 | Endovascular retrieval of IVC filter | venous thromboembolism | ✅ |
| IVCF | 34401-00 | Thrombectomy, vena cava/iliac vein, abdominal incision | venous thromboembolism | ✅ |
| IVCF | 34421-00 | Thrombectomy, vena cava/iliac/femoropopliteal vein, leg incision | venous thromboembolism | ✅ |
| IVCF | 33910-00 | Pulmonary artery embolectomy with cardiopulmonary bypass | venous thromboembolism | ✅ |
| IVCF | 37187-00 | Percutaneous venous mechanical thrombectomy | venous thromboembolism | ✅ |
| IVCF | 37212-00 | Transcatheter venous thrombolysis infusion (initial day) | venous thromboembolism | ✅ |
| TRMA | 35206-00 | Repair of blood vessel, upper extremity (direct) | arterial trauma | ✅ |
| TRMA | 35226-00 | Repair of blood vessel, lower extremity (direct) | arterial trauma | ✅ |
| TRMA | 35236-00 | Repair of blood vessel with vein graft, upper extremity | arterial trauma | ✅ |
| TRMA | 35256-00 | Repair of blood vessel with vein graft, lower extremity | arterial trauma | ✅ |
| TRMA | 35266-00 | Repair of blood vessel with non-vein graft, upper extremity | arterial trauma | ✅ |
| TRMA | 35286-00 | Repair of blood vessel with non-vein graft, lower extremity | arterial trauma | ✅ |
| TRMA | 35201-00 | Repair of blood vessel, neck | arterial trauma | ✅ |
| TRMA | 35211-00 | Repair of intrathoracic vessel with cardiopulmonary bypass | arterial trauma | ✅ |
| TRMA | 35221-00 | Repair of intra-abdominal blood vessel | arterial trauma | ✅ |
| MNR | 00001-00 | Basic surgical step (shared) | ALL 12 main_diags | ✅ shared |

**Phase 2E total: 114 dept-specific proc_cpts verified (13 new alpha groups) + shared MNR.**
Per-main_diag dept-specific counts (all ≥5): AAA 11, aortic dissection 5, arterial trauma 10,
arteriovenous fistula 6, carotid artery disease 6, peripheral aneurysms 6, peripheral artery
disease 35, renal artery disease 6, thoracic aortic aneurysm 7, varicose veins 11, vascular
access 11, venous thromboembolism 7. **2 deleted codes resolved** (33860→33858, 33870→33871);
the **2026 LER restructure** (37220–37235 deleted) handled with new 37254–37296 territory codes.

### Migration log
| # | File | Purpose | Status |
|---|---|---|---|
| 085 | 1750000000085-FixVascIcdCodes.ts | Fix 18 ICD-11 codes (16 UPDATE + mesenteric rename + gangrene merge) | **applied ✅** |
| 086 | 1750000000086-AddVascDiagnoses1.ts | Add 35 diagnoses (AAA, dissection, trauma, AVF, carotid, periph aneurysms, renal, TAA) | **applied ✅** |
| 087 | 1750000000087-AddVascDiagnoses2.ts | Add 37 diagnoses (PAD, varicose, vascular access, VTE) | **applied ✅** |
| 088 | 1750000000088-ImportVascProcCpts1.ts | Import 53 proc_cpts (AORT, EVAR, ENDO, BYPS, ENDA) | **applied ✅** |
| 089 | 1750000000089-ImportVascProcCpts2.ts | Import 61 proc_cpts (THRM, PERA, AMPU, DIAL, AVFR, VARX, IVCF, TRMA) | **applied ✅** |
| 090 | 1750000000090-LinkVascProcCptsToMainDiags.ts | Link 114 procs to 12 main_diags + MNR to all | **applied ✅** |

---

## Summary (AUDIT COMPLETE — migrations 085–090)
| Metric | Count |
|---|---|
| Main_diags | 12 |
| Diagnoses (current) | **100** ✅ (every main_diag ≥5; max PAD 24) |
| Proc_cpts (current) | **114 dept-specific** ✅ (115 linked incl. shared MNR; every main_diag ≥5) |
| ICD-11 codes fixed (❌ wrong) | 16 (+1 gangrene merge = 17 wrong concepts) |
| ICD-11 codes updated (⚠️ approximate/leaf) | 1 (BD74.1→BD74.1Z); BD50.3 leaf-refine intentionally skipped |
| CPT codes fixed | N/A (no pre-existing procs); 2 deleted codes avoided at import (33860→33858, 33870→33871) |
| 2026 LER restructure handled | 37220–37235 deleted → used new territory codes 37254/37256/37258/37260/37263/37265/37267/37269/37271/37273/37280/37296 |
| Structural issues resolved | 1 (gangrene merge into shared MC85) + 12 NO_PROC main_diags now all populated |
| Cross-dept fixes (shared rows) | ESRD GB60.0→GB61.5 (TRS+UROL+VASC); aortic-root BD50.Z→BD50.3Y&XA01A6 (CTS+VASC) |
| Cross-dept shared procs reused | 3 AMPU codes (above/below-knee, etc.) already owned by ORTHO — ON CONFLICT shared them |
| New diagnoses added (this run) | 72 (migrations 086/087) → 100 total |
| New proc_cpts added (this run) | 114 (migrations 088/089) across 13 new alpha groups + MNR links (090) |
| Diagnoses re-embedded | 17 (MIG-A) + 67 (MIG-D) = 84 ✅ (all 100 embedded) |
| Proc_cpts embedded | 111 new + 3 shared (already embedded) = all 114 ✅ |

## ICD-11 Changes Applied (migration 085)
| Old code | Old name | New code | New name | Notes |
|---|---|---|---|---|
| BA80.0 | abdominal aortic aneurysm | BD50.4Z | Abdominal aortic aneurysm, unspecified | fabricated BA80.x block |
| BA80.1 | ruptured abdominal aortic aneurysm | BD50.41 | Abdominal aortic aneurysm with rupture | |
| BA41.0 | carotid artery stenosis | BD55 | Asymptomatic stenosis of intra/extracranial artery | ✅ resolves flagged-open code |
| BD53.4 | carotid body tumour | 2F9A | Neoplasms of unknown behaviour of endocrine glands | moved to neoplasm chapter |
| BA80.3 | popliteal artery aneurysm | BD51.6&XA44K1 | Aneurysm of popliteal artery | |
| BA80.4 | femoral artery aneurysm | BD51.6&XA2JF3 | Aneurysm of femoral artery | |
| BD10.4 | subclavian artery stenosis | 8B22.A | Subclavian steal syndrome (WHO syn. subclavian artery stenosis) | ✅ resolves flagged-open code |
| BD40.Y | mesenteric artery ischaemia | DD30.1 | Acute mesenteric arterial ischaemia | + renamed "acute mesenteric arterial ischaemia" |
| BD4Z | critical limb ischaemia | BD40.0 | Lower limb atherosclerosis (WHO syn. critical limb ischaemia) | |
| BD53.1 | gangrene | MC85 | Gangrene | **merge** into existing PRS-owned shared row |
| BD53.2 | diabetic peripheral vascular disease | BD53.Y | Other specified secondary disorders of arteries/arterioles | |
| BD53.3 | thoracic outlet syndrome | 8B91.Z | Brachial plexus disorders, unspecified | |
| BD50.Z | aneurysm of aortic root | BD50.3Y&XA01A6 | Ascending aorta aneurysm | shared CTS+VASC — also fixes CTS |
| BD74.1 | varicose veins of lower extremity | BD74.1Z | Lower limb varicose veins, not further specified | leaf refine |
| GB60.0 | end-stage renal disease | GB61.5 | Chronic kidney disease, stage 5 | shared TRS+UROL+VASC — fixes 3 depts |
| BD51.0 | deep vein thrombosis | BD71.4 | Lower limb deep vein thrombosis | BD51.0 was carotid-aneurysm code |
| BD52.0 | chronic venous insufficiency | BD74.Z | Chronic peripheral venous insufficiency of lower extremities | was in arterial block |
| BD53.0 | lymphoedema | BD93.Z | Lymphoedema, unspecified | |

**Skipped:** BD50.3 → BD50.3Z leaf refine (shared with CTS; parent category clinically acceptable — left as-is).

## CPT Changes Applied
N/A — VASC had no pre-existing proc_cpts to correct. During Phase 2E import, **2 AAPC-deleted
codes** were avoided and replaced with their current equivalents, and the **2026 AMA
lower-extremity endovascular revascularization restructure** was handled (the 37220–37235 family
was deleted effective 2026-01-01):
| Intended (deleted) | Replaced with | Reason |
|---|---|---|
| 33860 (ascending aorta graft) | 33858 (ascending aorta graft for dissection, CPB) | deleted 2020-01-01 |
| 33870 (transverse arch graft) | 33871 (aortic arch graft, CPB/DHCA) | deleted 2020-01-01 |
| 37220–37235 (LE endovascular) | 37254/37256/37258/37260 (iliac), 37263/37265/37267/37269/37271/37273 (fem-pop), 37280 (tibial), 37296 (inframalleolar) | whole family deleted 2026-01-01, replaced by 46 new territory codes |

## Structural Fixes
- **12 NO_PROC main_diags resolved** — every VASC category now has ≥5 dept-specific proc_cpts +
  shared MNR 00001-00 (migration 090). After migration: 0 empty-proc categories, 0 empty-diag
  categories, 0 orphaned diagnoses.
- **35560 reassigned** from the ENDA (endarterectomy) draft group to BYPS — AAPC confirms it is an
  aortorenal *bypass*, not an endarterectomy.
- **37607 grouped under DIAL** (angioaccess AV-fistula ligation), not AVFR — AAPC confirms it is an
  artificially-created (dialysis) fistula procedure.

## New Diagnoses Added
**72 diagnoses added (28 → 100)** via migrations 086 (35) + 087 (37). Full per-row specs
(ICD-11 code, EN/AR name, EN/AR description, main_diag) are in the **"2D — Candidate diagnoses"**
working-notes table above — all verified via `icd11_search`. Distribution by main_diag (final
counts): peripheral artery disease 24, venous thromboembolism 14, AAA 8, arterial trauma 7,
thoracic aortic aneurysm 7, varicose veins 7, AVF 6, peripheral aneurysms 6, renal artery
disease 6, aortic dissection 5, carotid artery disease 5, vascular access 5.
5 of the 72 codes were already present as other depts' shared rows (ON CONFLICT shared them).

## New Proc_cpts Added
**114 dept-specific proc_cpts added** (migrations 088 +53, 089 +61) across **13 new alpha groups**
(VASC previously had none), all AAPC-verified, linked to main_diags by migration 090. Full per-row
specs (alphaCode, numCode, EN/AR title + EN/AR description) live in the migration files; the
"2E — Candidate proc_cpts" index above lists every code with its main_diag and verification status.

| alphaCode | Group | Count | Primary main_diag(s) |
|---|---|---|---|
| AORT | Open aortic/thoracic aneurysm repair | 10 | AAA, aortic dissection, thoracic aortic aneurysm |
| EVAR | Endovascular aneurysm repair (abd + thoracic) | 10 | AAA, thoracic aortic aneurysm, aortic dissection, peripheral aneurysms |
| ENDO | Peripheral/visceral/carotid angioplasty·stent·atherectomy | 16 | peripheral artery disease, renal artery disease, carotid artery disease |
| BYPS | Open bypass | 11 | peripheral artery disease, carotid artery disease, renal artery disease |
| ENDA | Endarterectomy | 6 | peripheral artery disease, carotid artery disease, renal artery disease |
| THRM | Thrombectomy/embolectomy/thrombolysis (arterial) | 6 | peripheral artery disease, arterial trauma, renal artery disease |
| PERA | Peripheral/visceral aneurysm open repair + carotid body | 7 | peripheral aneurysms, carotid artery disease |
| AMPU | Amputation (3 rows shared with ORTHO) | 5 | peripheral artery disease |
| DIAL | Dialysis (haemodialysis) vascular access | 11 | vascular access |
| AVFR | AV fistula/malformation repair & embolization | 6 | arteriovenous fistula, varicose veins |
| VARX | Varicose/venous ablation & sclerotherapy | 10 | varicose veins |
| IVCF | IVC filter, venous thrombectomy, pulmonary embolectomy | 7 | venous thromboembolism |
| TRMA | Vascular trauma direct repair | 9 | arterial trauma |
| MNR | Basic surgical step (shared, link only) | — | all 12 |

## Still-Open Items
- ✅ Both previously-flagged VASC codes RESOLVED in migration 085: `BA41.0`→`BD55`, `BD10.4`→`8B22.A`.
- ✅ **Coverage extension COMPLETE**: 100 diagnoses (all ICD-11 verified + embedded) and 114
  dept-specific proc_cpts (all AAPC-verified + embedded). Every main_diag ≥5 diagnoses and ≥5 procs.
- Caveat on `8B22.A` (subclavian): WHO title is "subclavian steal syndrome"; we kept the clinical name "subclavian artery stenosis" (its score-1.0 WHO synonym). Acceptable but imperfect — note if a better extracranial-subclavian-stenosis leaf is found.
- `BD53.Y` (diabetic peripheral vascular disease) and `8B91.Z` (thoracic outlet syndrome) are "other specified"/parent-level codes — the most specific WHO entries available for those concepts.
- Optional future polish (not blocking): the 2026 LER restructure offers additional tibial/inframalleolar
  atherectomy & stent codes (37281–37295) and intravascular lithotripsy (IVL) codes — could be added if
  finer PAD-endovascular granularity is wanted. Current PAD coverage (36 procs) is already ample.
- AAPC lay summary for `35188` described "head/neck"; standard CPT defines it as *extremities* (35190 = head/neck). We used the CPT definition — flag if a coder prefers 35190.
