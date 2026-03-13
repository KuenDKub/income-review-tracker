export function buildSystemPrompt(): string {
  return `You are a viral TikTok content strategist and storyline writer for review content.
Write the storyline in Thai (ภาษาไทย) as the primary language.
You MAY use English only for proper nouns and product terms when appropriate (creator name, brand, product name, ingredient names like Zinc PCA).

Your goal: create storylines that feel native to TikTok — hook-first, fast-paced, emotionally charged, and shareable.
Apply these current trends:
- เริ่มด้วย pattern interrupt หรือ controversial hook ใน 3 วินาทีแรก
- ใช้ storytelling แบบ "relatable struggle → unexpected twist → satisfying payoff"
- ใส่ moments ที่คนอยากแคปหน้าจอ (screenshot-worthy) หรือ duet/stitch
- เน้น emotional trigger: เซอร์ไพรส์, ขำ, อยากรู้ต่อ, หรือ "นี่คือฉันเลย"
- ความยาวและ pacing ต้องเหมาะกับคลิป 30–90 วินาที
- ใช้ภาษาพูด เป็นกันเอง เหมือน influencer จริง ไม่ใช่บทความ

Output ONLY this format, no extra text:

[TITLE] ต้องเป็นหัวเอกสารบรรทัดแรก รูปแบบ: "TikTok : <creatorName>"
[SUBTITLE] ต้องเป็นหัวเอกสารบรรทัดที่สอง รูปแบบ: "Storyline - <productName>"
[GENRE] แนวคอนเทนต์ (เช่น รีวิวจริงใจ / ช็อค-เรียล / คอมเมดี้รีวิว / ดราม่าแฝง)
[HOOK] ประโยคเปิดที่ต้องหยุดสไลด์ภายใน 3 วินาที — ต้องเป็น pattern interrupt
[VIBE] อารมณ์โดยรวมของคลิป และ trend sound/aesthetic ที่เหมาะ
[SCENES]
---
SCENE 1
ACTION: (มุมกล้อง/สถานที่/แอคชั่น) เขียนสั้น กระชับ เหมือนช่อง "Scene (มุมกล้อง/outdoor)" และ **ห้าม** ใส่คำว่า "Scene" หรือเลขซีนใน ACTION
TEXT: (ข้อความสั้นที่จะขึ้นบนจอ / caption) 1–2 บรรทัด เหมือนช่อง "Text"
SOUNDTRACK: (เสียงพากย์/บรรยาย/เพลงประกอบ) โทน influencer พูดจริง สามารถหลายบรรทัดได้ เหมือนช่อง "Soundtrack"
---
SCENE 2
ACTION: ...
TEXT: ...
SOUNDTRACK: ...
---
(ต้องมีอย่างน้อย 6 scenes และมากที่สุดไม่เกิน 15 scenes)
[CTA] call-to-action ปิดคลิปแบบที่ influencer ใช้จริง (กระตุ้น comment / save / share) ห้ามปล่อยว่างหรือจบกลางประโยค
[CAPTION_IDEA] แนวแคปชั่น + hashtag ที่เหมาะกับ TikTok ตอนนี้ ห้ามปล่อยว่างหรือจบกลางประโยค

Style guide (match this document/table style):
- ACTION: บอกภาพ/มุม/โลเคชันแบบตรงไปตรงมา เช่น "บรรยากาศ outdoor ถือของใกล้กล้อง" หรือ "ซูมรากผม เห็นความมันชัดๆ"
- TEXT: สั้นและคม อาจขึ้นเป็น 2 บรรทัด เช่นชื่อสินค้า (อนุญาตอังกฤษ)
- SOUNDTRACK: เล่าเป็นจังหวะ มีเหตุผล/ผลลัพธ์ชัด ใช้คำเชื่อมแบบพูดจริง (แต่ไม่เวิ่น)
`;
}

export function buildUserPrompt(reviewPrompt: string): string {
  return `สร้าง storyline สไตล์ TikTok influencer เป็นภาษาไทย สำหรับคอนเทนต์รีวิวนี้: ${reviewPrompt}

คิดแบบ content creator ที่รู้จัก algorithm — hook แรง, เนื้อหากระชับ, ปิดให้คนอยากกด share`;
}

export type StorylineBrief = {
  brandName?: string;
  productName?: string;
  details?: string;
  conditions?: string;
  sellingPoints?: string;
  vibeMood?: string;
  extraNotes?: string;
};

function normalizeMultiline(value: string | undefined): string {
  return (value ?? "").trim().replace(/\r\n/g, "\n");
}

export function buildUserPromptFromBrief(brief: StorylineBrief): string {
  const brandName = normalizeMultiline(brief.brandName);
  const productName = normalizeMultiline(brief.productName);
  const details = normalizeMultiline(brief.details);
  const conditions = normalizeMultiline(brief.conditions);
  const sellingPoints = normalizeMultiline(brief.sellingPoints);
  const vibeMood = normalizeMultiline(brief.vibeMood);
  const extraNotes = normalizeMultiline(brief.extraNotes);

  const lines: string[] = [];
  lines.push("สร้าง storyline สไตล์ TikTok influencer เป็นภาษาไทย โดยต้องทำตาม format ที่กำหนดอย่างเคร่งครัด");
  lines.push("");
  lines.push("[BRIEF]");
  if (brandName) lines.push(`- Brand: ${brandName}`);
  if (productName) lines.push(`- Product: ${productName}`);
  if (details) lines.push(`- รายละเอียด/บริบท: ${details}`);
  if (sellingPoints) lines.push(`- จุดขายหลัก (USP): ${sellingPoints}`);
  if (vibeMood) lines.push(`- Vibe/Mood ที่ต้องการ: ${vibeMood}`);
  if (conditions) lines.push(`- เงื่อนไข/ข้อห้าม/ข้อควรมี: ${conditions}`);
  if (extraNotes) lines.push(`- โน้ตเพิ่มเติม: ${extraNotes}`);
  lines.push("");
  lines.push("[GOAL]");
  lines.push("- Hook แรงใน 3 วินาทีแรก, pacing กระชับ, ภาษาพูดแบบ influencer");
  lines.push("- ใส่เหตุผล/ผลลัพธ์ชัดเจน และจบด้วย CTA + CAPTION_IDEA ที่คนอยากคอมเมนต์/เซฟ/แชร์");

  return lines.join("\n").trim();
}
