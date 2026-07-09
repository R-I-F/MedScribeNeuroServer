import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Seeds the lectures framework with the REAL production NS academic curriculum, captured from
 * the production MySQL `kasr-el-ainy.lectures` table on 2026-07-09 via
 * scripts/export-ns-lectures.ts (values inlined — this migration performs no live production
 * read). Only NS is copied for now; the other 14 departments are authored in later steps.
 *
 *  - 10 lecture_topics (the old free-text `mainTopic`), alphabetical → sortOrder.
 *  - 152 lectures: the outline-number prefix (e.g. "1.3.2") split into `lectureNumber`, the
 *    title text with the prefix stripped, `level` preserved verbatim (msc | md | NULL — 6 rows
 *    had no derivable level), and a numeric `sortOrder` derived from the parsed number.
 *
 * `arTitle` is left NULL on both tables (no Arabic exists in the source) — a later migration
 * backfills it. The legacy `google_uid` is intentionally not carried over.
 *
 * NB: some (topic, lectureNumber) pairs legitimately repeat in the source (e.g. spine "3.6.5"
 * twice, trauma "2.3.1" twice) — there is deliberately no uniqueness on lecture number.
 */
export class CopyNsLectures1750000000189 implements MigrationInterface {
  name = "CopyNsLectures1750000000189";

  // [topic, sortOrder]
  private readonly TOPICS: Array<[string, number]> = [
    ["adult hydrocephalus", 0],
    ["cns tumors", 1],
    ["ethics & regulations", 2],
    ["functional", 3],
    ["infections", 4],
    ["pediatrics", 5],
    ["peripheral nerves", 6],
    ["spine", 7],
    ["trauma & neurocritical care", 8],
    ["vascular", 9],
  ];

  // [topic, lectureNumber, title, level | null, sortOrder]
  private readonly LECTURES: Array<[string, string, string, string | null, number]> = [
    ["adult hydrocephalus", "1.00.0", "chiari malformations", "msc", 1000000],
    ["adult hydrocephalus", "1.10.1", "clinical manifestations of bih", "msc", 1010010],
    ["adult hydrocephalus", "1.10.2", "clinical manifestations of nph", "msc", 1010020],
    ["adult hydrocephalus", "1.10.3", "pathophysiology and management of bih, nph", "md", 1010030],
    ["adult hydrocephalus", "1.10.4", "new trends in management of bih, nph", "md", 1010040],
    ["adult hydrocephalus", "2.00.0", "arachnoid cysts", "msc", 2000000],
    ["adult hydrocephalus", "3.00.0", "dandy walker malformation", "msc", 3000000],
    ["cns tumors", "1.1.1", "cortical surface anatomy and craniometric points", "msc", 1001010],
    ["cns tumors", "1.1.2", "general management of gliomas", "msc", 1001020],
    ["cns tumors", "1.1.4", "new trends in glioma management", "md", 1001040],
    ["cns tumors", "1.2.1", "anatomy of the pineal region, circumventricular organs", "msc", 1002010],
    ["cns tumors", "1.2.2", "lesions of the pineal region", "msc", 1002020],
    ["cns tumors", "1.2.3", "surgical approaches to the pineal region", "md", 1002030],
    ["cns tumors", "1.3.2", "types and pathology of craniopharyngiomas", "msc", 1003020],
    ["cns tumors", "1.3.3", "management of craniopharyngioma", "md", 1003030],
    ["cns tumors", "1.3.4", "new trends in craniopharyngioma", "md", 1003040],
    ["cns tumors", "1.4.1", "clinical examination of cranial nerves", "msc", 1004010],
    ["cns tumors", "1.4.2", "types new classification and manifestations of pituitary adenomas", "msc", 1004020],
    ["cns tumors", "1.4.3", "management of pituitary adenomas", "md", 1004030],
    ["cns tumors", "1.4.4", "new trends in management of pituitary adenomas", "md", 1004040],
    ["cns tumors", "1.5.1", "anatomy of cranial nerves ( except 7,8)", "msc", 1005010],
    ["cns tumors", "1.5.3", "types of genetic syndromes involving the cns", "md", 1005030],
    ["cns tumors", "1.6.1", "normal basalis interna and externa anatomy, anatomy of the cranial fossas", "msc", 1006010],
    ["cns tumors", "1.6.2", "location and manifestations of skull base meningiomas", "msc", 1006020],
    ["cns tumors", "1.6.3a", "surgical approaches to the skull base: anterior cranial fossa", null, 1006031],
    ["cns tumors", "1.6.3b", "surgical approaches to the skull base", null, 1006032],
    ["cns tumors", "1.6.4", "new trends in management of skull base lesions", "md", 1006040],
    ["cns tumors", "1.7.1", "anatomy of the facial and vc nerves, anatomy of the cpa", "msc", 1007010],
    ["cns tumors", "1.7.2", "types and manifestations of cpa lesions", "msc", 1007020],
    ["cns tumors", "1.7.3", "surgical approaches to the cpa", "md", 1007030],
    ["cns tumors", "1.7.4", "new trends in management of cpa lesions", "md", 1007040],
    ["cns tumors", "1.8.1", "radiological anatomy of the brain", "msc", 1008010],
    ["cns tumors", "1.8.2", "manifestations, pathology and management of cns lymphoma", "msc", 1008020],
    ["cns tumors", "1.8.3", "decision making in management of cns metastasis", "md", 1008030],
    ["cns tumors", "1.8.4", "new trends in mets and lymphoma management", "md", 1008040],
    ["cns tumors", "1.9.1", "anatomy of the ventricles and surgical approaches", "msc", 1009010],
    ["cns tumors", "1.9.2", "types and pathology of intraventricular tumors", "msc", 1009020],
    ["cns tumors", "1.9.4", "new trends in management of intraventricular tumors", "md", 1009040],
    ["cns tumors", "1.11.1", "anatomy of the white matter", "msc", 1011010],
    ["cns tumors", "1.11.2", "diagnosis and management of radiation necrosis", "msc", 1011020],
    ["cns tumors", "1.11.3", "stereotactic radiosurgery and cyber knife", "md", 1011030],
    ["ethics & regulations", "0.1.1", "taking patients' history", "msc", 1010],
    ["ethics & regulations", "0.1.2", "how to take an informed consent in emergency and elective neurosurgical procedures", "msc", 1020],
    ["ethics & regulations", "0.1.2b", "rules of thumb in staff rounds", "msc", 1022],
    ["ethics & regulations", "0.1.3", "organizing m and m meetings", "md", 1030],
    ["functional", "6.1.1", "functional areas of the brain", "msc", 6001010],
    ["functional", "6.1.2", "basics and principals of stereotactic surgery", "msc", 6001020],
    ["functional", "6.1.4", "new trends in stereotactic surgeries", "md", 6001040],
    ["functional", "6.2.1", "classification of seizures, management of status epilepticus", "msc", 6002010],
    ["functional", "6.2.2", "seizure syndromes and anti-seizure medications", "msc", 6002020],
    ["functional", "6.2.3", "indications, types and techniques of epilepsy surgery", "md", 6002030],
    ["functional", "6.2.4", "new trends in epilepsy surgery", "md", 6002040],
    ["functional", "6.3.1", "anatomy of the trigeminal and facial nerves", "msc", 6003010],
    ["functional", "6.3.2", "management of trigeminal neuralgia, hemi-facial spasm", "msc", 6003020],
    ["functional", "6.3.3", "technique of microvascular decompression surgeries", "md", 6003030],
    ["functional", "6.3.4", "new trends in management of neuro-vascular compression", "md", 6003040],
    ["functional", "6.4.1", "mechanism and physiology of pain", "msc", 6004010],
    ["functional", "6.4.2", "medical management of pain and radiofrequency", "msc", 6004020],
    ["functional", "6.4.3", "surgical pain procedures and spine injection techniques", "md", 6004030],
    ["functional", "6.4.4", "new trends in pain management", "md", 6004040],
    ["infections", "7.1.1", "meningitis and ventriculitis", "msc", 7001010],
    ["infections", "7.1.2", "brain abscess", "msc", 7001020],
    ["infections", "7.1.2b", "subdural empeyma", "msc", 7001022],
    ["infections", "7.1.3", "neurotuberculosis", "md", 7001030],
    ["infections", "7.2.2", "viral infections of the brain", "msc", 7002020],
    ["infections", "7.2.3", "fungal infections of the cns", "md", 7002030],
    ["infections", "7.2.4", "amebic infectioons of the cns", "md", 7002040],
    ["pediatrics", "4.1.1", "anatomy of the ventricles", "msc", 4001010],
    ["pediatrics", "4.1.2", "evaluation and management of hydrocephalus", "msc", 4001020],
    ["pediatrics", "4.1.3", "endoscopic third ventriculostomy", "md", 4001030],
    ["pediatrics", "4.1.4", "new trends in management of hcp", "md", 4001040],
    ["pediatrics", "4.2.1", "embryology of the cranium development", "msc", 4002010],
    ["pediatrics", "4.2.2", "evaluation and management of arachnoid cysts", "msc", 4002020],
    ["pediatrics", "4.2.3", "evaluation and management of craniosynostosis", "md", 4002030],
    ["pediatrics", "4.3.1", "embryology of the spine and cranio-cervical junction", "msc", 4003010],
    ["pediatrics", "4.3.2", "management of spina bifida", "msc", 4003020],
    ["pediatrics", "4.3.3", "lipomyeloschesis and tethered cord syndrome", "md", 4003030],
    ["pediatrics", "4.3.4", "new trends in management of developmental spinal anomalies", "md", 4003040],
    ["pediatrics", "4.4.1", "pathophysiology of syrinx", "msc", 4004010],
    ["pediatrics", "4.4.2", "types and diagnosis of chiari malformation", "msc", 4004020],
    ["pediatrics", "4.4.3", "surgical management of chiari malformation", "md", 4004030],
    ["peripheral nerves", "8.1.1", "anatomy of the peripheral nerves (upper limb)", "msc", 8001010],
    ["peripheral nerves", "8.1.1b", "anatomy of the peripheral nerve (lowerlimb)", "msc", 8001012],
    ["peripheral nerves", "8.1.2", "physiology of muscle innervation", "msc", 8001020],
    ["peripheral nerves", "8.2.2", "peripheral nerve injuries", "msc", 8002020],
    ["peripheral nerves", "8.2.3", "brachial plexus injury", "md", 8002030],
    ["peripheral nerves", "8.2.3b", "nerve entrapment syndromes", "md", 8002032],
    ["spine", "3.1.1", "anatomy of the spine and blood supply of the spinal cord", "msc", 3001010],
    ["spine", "3.1.2", "history, examination and management of lumbar disc prolapse and cauda equina syndrome", "msc", 3001020],
    ["spine", "3.1.3", "interbody fusion types and techniques", "md", 3001030],
    ["spine", "3.1.4", "new trends in management of degenerative lumbar disease", "md", 3001040],
    ["spine", "3.2.1", "internal structures of the spinal cord and tractography", "msc", 3002010],
    ["spine", "3.2.2", "evaluation and approaches and management of the thoracic disc", "msc", 3002020],
    ["spine", "3.3.1", "anatomy of the cervical vertebrae and the cranio-cervical junction", "msc", 3003010],
    ["spine", "3.3.2", "myelopathy and evaluation of degenerative cervical disease", "msc", 3003020],
    ["spine", "3.3.3", "approaches and techniques of cervical fusion surgeries", "md", 3003030],
    ["spine", "3.4.1", "introduction to minimally invasive spine surgeries", "msc", 3004010],
    ["spine", "3.4.2", "types of minimally invasive spine surgeries", "msc", 3004020],
    ["spine", "3.4.3", "techniques, tips and tricks of minimally invasive spine surgeries", "md", 3004030],
    ["spine", "3.4.4", "new trends in minimally invasive spine surgeries", "md", 3004040],
    ["spine", "3.5.1", "anatomy and biomechanics of the spine", "msc", 3005010],
    ["spine", "3.5.2", "spine measurements and angles", "msc", 3005020],
    ["spine", "3.5.3", "surgical management of sagittal imbalance and degenerative scoliosis", "md", 3005030],
    ["spine", "3.5.4", "new trends in sagittal balance and degenerative scoliosos", "md", 3005040],
    ["spine", "3.6.1", "embryology of the spine and cord", "msc", 3006010],
    ["spine", "3.6.2", "evaluation and diagnosis of ais", "msc", 3006020],
    ["spine", "3.6.3", "decision making and management of ais", "md", 3006030],
    ["spine", "3.6.4", "new trends in idiopathic scoliosis", "md", 3006040],
    ["spine", "3.6.5", "sacral chordomas, management", null, 3006050],
    ["spine", "3.6.5", "new trends in sacroilitis managment", null, 3006050],
    ["spine", "3.7.2", "management of spine metastasis", "msc", 3007020],
    ["spine", "3.7.3", "paget's disease of the spine, rheumatoid arthritis and ankylosing spondylitis", "md", 3007030],
    ["spine", "3.7.4", "new trends in special conditions affecting the spine", "md", 3007040],
    ["trauma & neurocritical care", "2.1.1", "management of extradural hematomas", "msc", 2001010],
    ["trauma & neurocritical care", "2.1.1b", "compound depressed fractures", "msc", 2001012],
    ["trauma & neurocritical care", "2.1.2b", "acute and chronic subdural hematoma (including mma embolisation)", "msc", 2001022],
    ["trauma & neurocritical care", "2.1.3", "skull base repair in csf leak", "md", 2001030],
    ["trauma & neurocritical care", "2.2.1", "levels of consciousness, glasgow coma scale", "msc", 2002010],
    ["trauma & neurocritical care", "2.2.2", "measures to monitor and control intracranial pressure in comatosed patient", "msc", 2002020],
    ["trauma & neurocritical care", "2.2.2b", "herniation syndromes", "msc", 2002022],
    ["trauma & neurocritical care", "2.2.3", "brain death criteria in adults and children", "md", 2002030],
    ["trauma & neurocritical care", "2.2.4", "sodium homeostasis and osmolality", "md", 2002040],
    ["trauma & neurocritical care", "2.3.1", "atlantooccipital disclocation", "msc", 2003010],
    ["trauma & neurocritical care", "2.3.1", "occipital condyle fractures", "msc", 2003010],
    ["trauma & neurocritical care", "2.3.2", "atlantoaxial subluxation", "msc", 2003020],
    ["trauma & neurocritical care", "2.3.2b", "atlas 1 fractures", "msc", 2003022],
    ["trauma & neurocritical care", "2.3.3", "axis c2 fractures", "md", 2003030],
    ["trauma & neurocritical care", "2.3.4", "combination of c1 and c2 fractures", "md", 2003040],
    ["trauma & neurocritical care", "2.4.1", "cervical fractures", "msc", 2004010],
    ["vascular", "5.1.1", "anatomy of the vertebrobasilar system (part 1)", "msc", 5001010],
    ["vascular", "5.1.1a", "initial management of patient with sah", "msc", 5001011],
    ["vascular", "5.1.2", "sah grading and sequelae", "msc", 5001020],
    ["vascular", "5.1.2a", "diagnosis and management of cerebral vasospasm", "msc", 5001021],
    ["vascular", "5.1.4", "new trends in management of sah", "md", 5001040],
    ["vascular", "5.2.1", "anatomy of the carotid", "msc", 5002010],
    ["vascular", "5.2.3", "types and approaches to intracranial aneurysms", "md", 5002030],
    ["vascular", "5.2.3a", "management of giant aneurysms", "md", 5002031],
    ["vascular", "5.2.4", "new trends in aneurysmal management", "md", 5002040],
    ["vascular", "5.3.1", "anatomy of the aca, mca", "msc", 5003010],
    ["vascular", "5.3.2", "grading and management of avm", "msc", 5003020],
    ["vascular", "5.3.3", "management of cavernomas", "md", 5003030],
    ["vascular", "5.3.4", "new trends in management of brain stem cavernomas", "md", 5003040],
    ["vascular", "5.4.1", "anatomy of the venous system", "msc", 5004010],
    ["vascular", "5.4.3", "moya moya disease", "md", 5004030],
    ["vascular", "5.4.3a", "management of cerebral artery dissection", "md", 5004031],
    ["vascular", "5.4.4", "new trends in bypass surgeries", "md", 5004040],
    ["vascular", "5.5.1", "anatomy of the vertebrobasilar system (part 2)", "msc", 5005010],
    ["vascular", "5.5.2", "basic principles of 4 vessel angiography", "msc", 5005020],
    ["vascular", "5.5.3", "endovascular management of cns vascular lesion", "md", 5005030],
    ["vascular", "5.5.4", "new trends in endovascular management of intracranial aneurysms", "md", 5005040],
    ["vascular", "5.5.5", "managment of dural av fistulas", null, 5005050],
    ["vascular", "5.5.6", "managment of spinal avm", null, 5005060],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics ──────────────────────────────────────────────────────────────
    const topicRows = this.TOPICS.map(([t, ord]) => `('${q(t)}', ${ord})`).join(", ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "sortOrder")
      SELECT d."id", v.title, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ord)
      WHERE d."code" = 'NS'
    `);

    // ── Lectures ─────────────────────────────────────────────────────────────
    // Insert in batches of ~50 rows; each joins to its topic by (NS dept, title).
    const batchSize = 50;
    for (let i = 0; i < this.LECTURES.length; i += batchSize) {
      const batch = this.LECTURES.slice(i, i + batchSize);
      const rows = batch
        .map(([topic, num, title, level, ord]) => {
          const lvl = level ? `'${level}'` : "NULL";
          return `('${q(topic)}', '${q(num)}', '${q(title)}', ${lvl}, ${ord})`;
        })
        .join(",\n          ");
      await queryRunner.query(`
        INSERT INTO "lectures" ("topicId", "lectureNumber", "title", "level", "sortOrder")
        SELECT lt."id", v.number, v.title, v.level, v.ord
        FROM (VALUES ${rows}) AS v(topic, number, title, level, ord)
        JOIN "departments" d ON d."code" = 'NS'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the NS topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'NS'
    `);
  }
}
