export type StorylineSections = {
  TITLE: string;
  SUBTITLE: string;
  GENRE: string;
  HOOK: string;
  VIBE: string;
  CTA: string;
  CAPTION_IDEA: string;
};

export type StorylineSceneRow = {
  index: number;
  action: string;
  text: string;
  soundtrack: string;
};

export type StorylineParseResult = {
  sections: StorylineSections;
  scenesTable: StorylineSceneRow[];
  rawText: string;
};

const SECTION_KEYS: (keyof StorylineSections | "SCENES")[] = [
  "TITLE",
  "SUBTITLE",
  "GENRE",
  "HOOK",
  "VIBE",
  "CTA",
  "CAPTION_IDEA",
  "SCENES",
];

const EMPTY_SECTIONS: StorylineSections = {
  TITLE: "",
  SUBTITLE: "",
  GENRE: "",
  HOOK: "",
  VIBE: "",
  CTA: "",
  CAPTION_IDEA: "",
};

function parseScenesBlock(block: string): StorylineSceneRow[] {
  const normalized = block.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const parts = normalized
    .split(/^\s*---\s*$/m)
    .map((p) => p.trim())
    .filter(Boolean);

  const rows: StorylineSceneRow[] = [];
  for (const part of parts) {
    // Expected:
    // SCENE n
    // ACTION: ...
    // TEXT: ...
    // SOUNDTRACK: ...
    const lines = part.split("\n");
    const first = lines[0]?.trim() ?? "";
    const numMatch = first.match(/^SCENE\s+(\d+)/i);
    const index = numMatch ? Number(numMatch[1]) : rows.length + 1;

    type FieldKey = "ACTION" | "TEXT" | "SOUNDTRACK";
    let current: FieldKey | null = null;
    const buf: Record<"ACTION" | "TEXT" | "SOUNDTRACK", string[]> = {
      ACTION: [],
      TEXT: [],
      SOUNDTRACK: [],
    };

    for (const rawLine of lines.slice(1)) {
      const line = rawLine.trimEnd();
      const m = line.match(/^(ACTION|TEXT|SOUNDTRACK):\s*(.*)$/i);
      if (m) {
        current = m[1].toUpperCase() as FieldKey;
        const rest = m[2] ?? "";
        if (rest && current) buf[current].push(rest.trim());
      } else if (current && line.trim()) {
        buf[current].push(line.trim());
      }
    }

    const action = buf.ACTION.join("\n").trim();
    const text = buf.TEXT.join("\n").trim();
    const soundtrack = buf.SOUNDTRACK.join("\n").trim();
    if (action || text || soundtrack) {
      rows.push({ index, action, text, soundtrack });
    }
  }

  return rows.sort((a, b) => a.index - b.index);
}

export function parseStoryline(rawText: string): StorylineParseResult {
  const sections = { ...EMPTY_SECTIONS };
  let scenesRaw = "";
  const lines = rawText.split("\n");
  let currentKey: (keyof StorylineSections | "SCENES") | null = null;
  let buffer: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\[([A-Z0-9_]+)\]\s*(.*)/);
    if (match) {
      if (currentKey && SECTION_KEYS.includes(currentKey)) {
        const value = buffer.join("\n").trim();
        if (currentKey === "SCENES") scenesRaw = value;
        else sections[currentKey] = value;
      }
      const key = match[1] as keyof StorylineSections | "SCENES";
      currentKey = SECTION_KEYS.includes(key) ? key : null;
      buffer = match[2] ? [match[2]] : [];
    } else if (currentKey) {
      buffer.push(line.trim());
    }
  }
  if (currentKey && SECTION_KEYS.includes(currentKey)) {
    const value = buffer.join("\n").trim();
    if (currentKey === "SCENES") scenesRaw = value;
    else sections[currentKey] = value;
  }

  const scenesTable = parseScenesBlock(scenesRaw);
  return { sections, scenesTable, rawText };
}
