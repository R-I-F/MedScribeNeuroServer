import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PRS proc_cpts — batch 1 of 2 (48 procedures).
 * Groups: FLAP (flaps), GRFT (skin/soft-tissue grafts), HSGY (hand surgery),
 * CLEF (cleft & craniofacial), BURN (burn surgery).
 *
 * Every CPT code verified against AAPC (aapc.com/codes/cpt-codes/<code>); none
 * deleted. numCode uses the canonical "NNNNN-00" form. Links to main_diags are
 * added by migration 084.
 */
export class ImportPrsProcCpts11750000000082 implements MigrationInterface {
  name = "ImportPrsProcCpts11750000000082";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── FLAP: pedicled, free and adjacent-tissue flaps ───────────────────
      ('Muscle or myocutaneous flap, trunk','FLAP','15734-00','Elevation and transfer of a muscle, myocutaneous or fasciocutaneous flap from the trunk to cover an adjacent defect.','شريحة عضلية أو جلدية عضلية من الجذع','رفع ونقل شريحة عضلية أو جلدية عضلية أو لفافية جلدية من الجذع لتغطية عيب مجاور.'),
      ('Muscle or myocutaneous flap, upper extremity','FLAP','15736-00','Elevation and transfer of a muscle or myocutaneous flap from the upper extremity to cover a local wound or defect.','شريحة عضلية للطرف العلوي','رفع ونقل شريحة عضلية أو جلدية عضلية من الطرف العلوي لتغطية جرح أو عيب موضعي.'),
      ('Muscle or myocutaneous flap, lower extremity','FLAP','15738-00','Elevation and transfer of a muscle or myocutaneous flap (eg, gastrocnemius) from the lower extremity to cover a defect.','شريحة عضلية للطرف السفلي','رفع ونقل شريحة عضلية أو جلدية عضلية (مثل التوأمية) من الطرف السفلي لتغطية عيب.'),
      ('Free muscle flap with microvascular anastomosis','FLAP','15756-00','Transfer of a free muscle or myocutaneous flap with microsurgical re-anastomosis of its vascular pedicle to recipient vessels.','شريحة عضلية حرة بمفاغرة وعائية مجهرية','نقل شريحة عضلية أو جلدية عضلية حرة مع إعادة مفاغرة معنقها الوعائي مجهرياً بأوعية الموقع المتلقي.'),
      ('Free skin (fasciocutaneous) flap with microvascular anastomosis','FLAP','15757-00','Transfer of a free fasciocutaneous skin flap with microvascular anastomosis to resurface a defect.','شريحة جلدية لفافية حرة بمفاغرة مجهرية','نقل شريحة جلدية لفافية حرة مع مفاغرة وعائية مجهرية لتغطية عيب.'),
      ('Free fascial flap with microvascular anastomosis','FLAP','15758-00','Transfer of a free fascial flap with its blood supply, anastomosed microsurgically at the recipient site.','شريحة لفافية حرة بمفاغرة مجهرية','نقل شريحة لفافية حرة مع إمدادها الدموي، تُفاغَر مجهرياً في الموقع المتلقي.'),
      ('Island pedicle flap','FLAP','15740-00','Transfer of an island pedicle flap on an identified vascular pedicle to close an adjacent defect.','شريحة جزيرية معنقدة','نقل شريحة جزيرية على معنق وعائي محدد لإغلاق عيب مجاور.'),
      ('Forehead flap','FLAP','15731-00','Axial forehead (paramedian) flap based on the supratrochlear vessels for reconstruction of nasal or facial defects.','شريحة الجبهة','شريحة جبهية محورية (مجاورة للخط الناصف) معتمدة على الأوعية فوق البكرية لترميم عيوب الأنف أو الوجه.'),
      ('Pedicle or tubed flap, trunk','FLAP','15570-00','Formation of a direct or tubed pedicle flap of the trunk for staged transfer to a distant defect.','شريحة معنقدة أو أنبوبية للجذع','تكوين شريحة معنقدة مباشرة أو أنبوبية من الجذع لنقل مرحلي إلى عيب بعيد.'),
      ('Adjacent tissue transfer, 30.1-60 sq cm','FLAP','14301-00','Transfer or rearrangement of adjacent healthy tissue (eg, rotation or transposition flap) to close a defect of 30.1-60 sq cm.','نقل نسيج مجاور 30-60 سم²','نقل أو إعادة ترتيب نسيج سليم مجاور (مثل شريحة التدوير أو الانتقال) لإغلاق عيب بمساحة 30-60 سم².'),
      ('Transfer of delayed pedicle flap','FLAP','15650-00','Transfer of a previously delayed pedicle flap from its donor site to a different recipient location.','نقل شريحة معنقدة مؤجلة','نقل شريحة معنقدة سبق تأجيلها من موقعها المانح إلى موقع متلقٍ آخر.'),

      -- ── GRFT: skin and soft-tissue grafts ────────────────────────────────
      ('Split-thickness skin graft, trunk or extremities','GRFT','15100-00','Harvest and placement of a split-thickness autograft to the trunk, arms or legs (first 100 sq cm).','طعم جلدي جزئي السماكة للجذع أو الأطراف','حصاد وتطبيق طعم ذاتي جزئي السماكة على الجذع أو الذراعين أو الساقين (أول 100 سم²).'),
      ('Split-thickness skin graft, face, hands or feet','GRFT','15120-00','Harvest and placement of a split-thickness autograft to the face, scalp, neck, hands, feet or genitalia (first 100 sq cm).','طعم جلدي جزئي السماكة للوجه أو اليدين أو القدمين','حصاد وتطبيق طعم ذاتي جزئي السماكة على الوجه أو فروة الرأس أو العنق أو اليدين أو القدمين أو الأعضاء التناسلية (أول 100 سم²).'),
      ('Full-thickness skin graft, trunk','GRFT','15200-00','Harvest and inset of a full-thickness skin graft (20 sq cm or less) to a trunk defect with donor-site closure.','طعم جلدي كامل السماكة للجذع','حصاد وتثبيت طعم جلدي كامل السماكة (20 سم² أو أقل) لعيب في الجذع مع إغلاق الموقع المانح.'),
      ('Full-thickness skin graft, scalp or extremities','GRFT','15220-00','Harvest and inset of a full-thickness skin graft (20 sq cm or less) to the scalp, arms or legs.','طعم جلدي كامل السماكة لفروة الرأس أو الأطراف','حصاد وتثبيت طعم جلدي كامل السماكة (20 سم² أو أقل) لفروة الرأس أو الذراعين أو الساقين.'),
      ('Full-thickness skin graft, face or hands','GRFT','15240-00','Harvest and inset of a full-thickness skin graft (20 sq cm or less) to the forehead, cheeks, chin, neck, hands or feet.','طعم جلدي كامل السماكة للوجه أو اليدين','حصاد وتثبيت طعم جلدي كامل السماكة (20 سم² أو أقل) للجبهة أو الخدين أو الذقن أو العنق أو اليدين أو القدمين.'),
      ('Full-thickness skin graft, nose, ears or eyelids','GRFT','15260-00','Harvest and inset of a full-thickness skin graft (20 sq cm or less) to the nose, ears, eyelids or lips.','طعم جلدي كامل السماكة للأنف أو الأذنين أو الجفون','حصاد وتثبيت طعم جلدي كامل السماكة (20 سم² أو أقل) للأنف أو الأذنين أو الجفون أو الشفتين.'),
      ('Pinch skin graft','GRFT','15050-00','Application of one or more small pinch grafts to cover a small granulating wound up to 2 cm in diameter.','طعم جلدي بالقرص','تطبيق طعم أو أكثر من الطعوم القرصية الصغيرة لتغطية جرح محبب صغير حتى 2 سم في القطر.'),
      ('Derma-fat-fascia graft','GRFT','15770-00','Harvest and inset of a composite dermis-fat-fascia graft to augment or fill a soft-tissue defect.','طعم أدمي شحمي لفافي','حصاد وتثبيت طعم مركّب من الأدمة والشحم واللفافة لتعزيز أو ملء عيب نسيجي رخو.'),
      ('Autologous fat grafting','GRFT','15771-00','Grafting of autologous fat harvested by liposuction (up to 50 cc) to restore contour of the trunk, breast or extremities.','تطعيم شحمي ذاتي','تطعيم شحم ذاتي محصود بشفط الدهون (حتى 50 سم³) لاستعادة قوام الجذع أو الثدي أو الأطراف.'),
      ('Acellular dermal matrix implant','GRFT','15777-00','Placement of an acellular dermal matrix to reinforce soft tissue, commonly in implant-based breast or trunk reconstruction.','زرع مطرس أدمي لا خلوي','وضع مطرس أدمي لا خلوي لتدعيم النسيج الرخو، وشائعاً في ترميم الثدي أو الجذع المعتمد على الزرعة.'),

      -- ── HSGY: hand surgery ───────────────────────────────────────────────
      ('Flexor tendon repair, zone 2','HSGY','26356-00','Primary repair of a lacerated flexor tendon of a finger within zone 2 (no man''s land) with early protected mobilisation.','إصلاح الوتر القابض في المنطقة الثانية','إصلاح أولي لوتر قابض ممزق للإصبع ضمن المنطقة الثانية مع تحريك مبكر محمي.'),
      ('Flexor tendon repair, not zone 2','HSGY','26350-00','Primary repair or advancement of a flexor tendon of the hand outside zone 2, without a free graft.','إصلاح الوتر القابض خارج المنطقة الثانية','إصلاح أولي أو تقديم لوتر قابض في اليد خارج المنطقة الثانية دون طعم حر.'),
      ('Nail bed repair','HSGY','11760-00','Repair of a lacerated, crushed or avulsed nail bed to restore a smooth nail and prevent deformity.','إصلاح سرير الظفر','إصلاح سرير ظفر ممزق أو مسحوق أو منتزع لاستعادة ظفر أملس ومنع التشوه.'),
      ('Amputation of finger or thumb','HSGY','26951-00','Amputation of a finger or thumb at a joint or phalanx with nerve handling and direct wound closure.','بتر الإصبع أو الإبهام','بتر إصبع أو إبهام عند مفصل أو سلامية مع معالجة العصب وإغلاق مباشر للجرح.'),
      ('Replantation of digit','HSGY','20816-00','Microsurgical replantation of a completely amputated finger, with bone, tendon, nerve and vessel repair.','إعادة زرع الإصبع','إعادة زرع مجهرية لإصبع مبتور تماماً مع إصلاح العظم والوتر والعصب والوعاء.'),
      ('Pollicisation / thumb reconstruction','HSGY','26550-00','Reconstruction of a thumb by transposing a finger (usually the index) with its neurovascular pedicle.','إبهام الإصبع / إعادة بناء الإبهام','إعادة بناء الإبهام بنقل إصبع (عادةً السبابة) مع معنقه الوعائي العصبي.'),
      ('Percutaneous fixation of phalangeal fracture','HSGY','26727-00','Closed reduction and percutaneous skeletal fixation of an unstable phalangeal shaft fracture with manipulation.','تثبيت كسر السلامية عبر الجلد','رد مغلق وتثبيت هيكلي عبر الجلد لكسر غير مستقر في جدل السلامية مع المداورة.'),
      ('Percutaneous fixation of metacarpal fracture','HSGY','26608-00','Percutaneous pinning of a displaced metacarpal fracture with K-wires to maintain alignment.','تثبيت كسر المشط عبر الجلد','تثبيت كسر مشطي منزاح عبر الجلد بأسلاك كيرشنر للحفاظ على المحاذاة.'),
      ('Tendon transfer in the hand','HSGY','26480-00','Transfer or transplant of a tendon in the carpometacarpal area or dorsum of the hand to restore lost function.','نقل الوتر في اليد','نقل أو زرع وتر في المنطقة الرسغية السنعية أو ظهر اليد لاستعادة وظيفة مفقودة.'),
      ('Extensor tendon central slip repair','HSGY','26426-00','Repair of the extensor central slip over the proximal interphalangeal joint to correct a boutonnière deformity.','إصلاح الشريحة المركزية للوتر الباسط','إصلاح الشريحة المركزية للوتر الباسط فوق المفصل بين السلاميات القريب لتصحيح تشوه عروة الزر.'),

      -- ── CLEF: cleft & craniofacial ───────────────────────────────────────
      ('Cheiloplasty, unilateral cleft lip','CLEF','40700-00','Primary single-stage repair of a unilateral cleft lip and nasal deformity.','رأب الشفة لشق أحادي الجانب','إصلاح أولي بمرحلة واحدة لشق شفة أحادي الجانب وتشوه الأنف.'),
      ('Cheiloplasty, bilateral cleft lip','CLEF','40701-00','Primary one-stage repair of a bilateral cleft lip with reconstruction of the lip and nasal base.','رأب الشفة لشق ثنائي الجانب','إصلاح أولي بمرحلة واحدة لشق شفة ثنائي الجانب مع إعادة بناء الشفة وقاعدة الأنف.'),
      ('Secondary cleft lip repair','CLEF','40720-00','Secondary (revision) repair of a cleft lip or nasal deformity after an unsatisfactory primary result.','إصلاح ثانوي لشق الشفة','إصلاح ثانوي (مراجعة) لشق الشفة أو تشوه الأنف بعد نتيجة أولية غير مُرضية.'),
      ('Palatoplasty, cleft palate','CLEF','42200-00','Repair of a cleft palate to close the oronasal communication and reconstruct the palatal musculature.','رأب الحنك المشقوق','إصلاح شق الحنك لإغلاق الاتصال الفموي الأنفي وإعادة بناء عضلات الحنك.'),
      ('Palatoplasty with soft-palate lengthening','CLEF','42220-00','Cleft palate repair with secondary lengthening of the soft palate to improve velopharyngeal function.','رأب الحنك مع إطالة الحنك الرخو','إصلاح شق الحنك مع إطالة ثانوية للحنك الرخو لتحسين الوظيفة البلعومية الحنكية.'),
      ('Pharyngeal flap for cleft palate','CLEF','42225-00','Attachment of a pharyngeal flap during palatoplasty to correct velopharyngeal incompetence.','شريحة بلعومية لشق الحنك','تثبيت شريحة بلعومية أثناء رأب الحنك لتصحيح القصور البلعومي الحنكي.'),
      ('Repair of anterior (hard) palate with vomer flap','CLEF','42235-00','Closure of a residual anterior hard-palate cleft using a vomer flap.','إصلاح الحنك الأمامي الصلب بشريحة الميكعة','إغلاق شق متبقٍ في الحنك الصلب الأمامي باستخدام شريحة الميكعة.'),
      ('Rhinoplasty for cleft nasal deformity','CLEF','30460-00','Rhinoplasty to correct the secondary nasal deformity associated with cleft lip and palate.','رأب الأنف لتشوه الأنف الشقّي','رأب الأنف لتصحيح تشوه الأنف الثانوي المرتبط بشق الشفة والحنك.'),

      -- ── BURN: burn surgery ───────────────────────────────────────────────
      ('Dressing/debridement of small burn','BURN','16020-00','Dressing and/or debridement of a small partial-thickness burn (under 5% TBSA).','تضميد/تنضير حرق صغير','تضميد و/أو تنضير حرق صغير جزئي السماكة (أقل من 5% من مساحة سطح الجسم).'),
      ('Dressing/debridement of medium burn','BURN','16025-00','Dressing and/or debridement of a medium partial-thickness burn (5-10% TBSA).','تضميد/تنضير حرق متوسط','تضميد و/أو تنضير حرق متوسط جزئي السماكة (5-10% من مساحة سطح الجسم).'),
      ('Dressing/debridement of large burn','BURN','16030-00','Dressing and/or debridement of a large partial-thickness burn (over 10% TBSA or multiple sites).','تضميد/تنضير حرق كبير','تضميد و/أو تنضير حرق كبير جزئي السماكة (أكثر من 10% من مساحة سطح الجسم أو مواقع متعددة).'),
      ('Escharotomy, initial incision','BURN','16035-00','Incision of constricting full-thickness burn eschar to relieve pressure and restore perfusion.','بضع الخشارة، الشق الأول','شق خشارة حرق كامل السماكة المُضيِّقة لتخفيف الضغط واستعادة التروية.'),
      ('Escharotomy, each additional incision','BURN','16036-00','Each additional escharotomy incision beyond the first to decompress a circumferential burn.','بضع الخشارة، كل شق إضافي','كل شق إضافي لبضع الخشارة بعد الأول لفك ضغط حرق محيطي.'),
      ('Surgical preparation of burn wound, trunk or extremities','BURN','15002-00','Excisional preparation of a burn wound, scar contracture or open wound of the trunk, arms or legs to receive a graft.','تحضير جراحي لجرح الحرق للجذع أو الأطراف','تحضير استئصالي لجرح حرق أو تقفع ندبي أو جرح مفتوح في الجذع أو الذراعين أو الساقين لتلقي طعم.'),
      ('Surgical preparation of burn wound, face or hands','BURN','15004-00','Excisional preparation of a burn wound or scar of the face, neck, hands, feet or genitalia to receive a graft.','تحضير جراحي لجرح الحرق للوجه أو اليدين','تحضير استئصالي لجرح حرق أو ندبة في الوجه أو العنق أو اليدين أو القدمين أو الأعضاء التناسلية لتلقي طعم.'),
      ('Harvest of skin for tissue-cultured graft','BURN','15040-00','Harvest of 100 sq cm or less of skin to grow a tissue-cultured autograft for extensive burns.','حصاد جلد لطعم مزروع نسيجياً','حصاد 100 سم² أو أقل من الجلد لإنماء طعم ذاتي مزروع نسيجياً للحروق الواسعة.'),
      ('Epidermal autograft, trunk or extremities','BURN','15110-00','Harvest and placement of an epidermal autograft to the trunk, arms or legs (first 100 sq cm).','طعم بشري ذاتي للجذع أو الأطراف','حصاد وتطبيق طعم بشري ذاتي للجذع أو الذراعين أو الساقين (أول 100 سم²).')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('FLAP','GRFT','HSGY','CLEF','BURN')`);
  }
}
