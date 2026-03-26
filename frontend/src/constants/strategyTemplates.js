function buildDirectionalAction(action, amount) {
  const suffix = action === "shoot" ? ` ${amount}` : ""
  return [
    `if ((dir - 1) ^ 2) then {`,
    `  if ((dir - 2) ^ 2) then {`,
    `    if ((dir - 3) ^ 2) then {`,
    `      if ((dir - 4) ^ 2) then {`,
    `        if ((dir - 5) ^ 2) then ${action} upleft${suffix} else ${action} downleft${suffix}`,
    `      } else ${action} down${suffix}`,
    `    } else ${action} downright${suffix}`,
    `  } else ${action} upright${suffix}`,
    `} else ${action} up${suffix}`,
  ].join("\n")
}

function buildRandomMoveAction() {
  return [
    "dir = random % 6 + 1",
    buildDirectionalAction("move"),
  ].join("\n")
}

function buildHunterStrategy({ attackCost, fallbackMove }) {
  return [
    "loc = opponent",
    "dir = loc % 10",
    "if (loc / 10 - 1) then {",
    buildDirectionalAction("move"),
    "} else if (loc) then {",
    buildDirectionalAction("shoot", attackCost),
    "} else {",
    fallbackMove || buildRandomMoveAction(),
    "}",
  ].join("\n")
}

function buildBudgetShooterStrategy({ attackCost, fallbackMove, minBudget }) {
  return [
    "loc = opponent",
    "dir = loc % 10",
    `if (Budget - ${minBudget}) then {`,
    "  if (loc / 10 - 1) then {",
    buildDirectionalAction("move")
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
    "  } else if (loc) then {",
    buildDirectionalAction("shoot", attackCost)
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n"),
    `  } else ${fallbackMove}`,
    "} else done",
  ].join("\n")
}

const TEMPLATE_MAP = {
  palrose: [
    {
      id: "palrose-bulwark",
      name: "Bulwark Advance",
      description: "เดินเข้าหาศัตรูและยิงแรงปานกลางเมื่อประชิด",
      strategy: buildHunterStrategy({ attackCost: 18 }),
    },
    {
      id: "palrose-guard",
      name: "Guard Post",
      description: "เน้นยืนคุมพื้นที่ ถ้าไม่เห็นศัตรูจะรอ",
      strategy: buildBudgetShooterStrategy({
        attackCost: 14,
        fallbackMove: buildRandomMoveAction(),
        minBudget: 20,
      }),
    },
  ],
  robolo: [
    {
      id: "robolo-skirmish",
      name: "Skirmish Bot",
      description: "วิ่งหาเป้าหมายและยิงเบาแต่สม่ำเสมอ",
      strategy: buildHunterStrategy({ attackCost: 12 }),
    },
    {
      id: "robolo-economy",
      name: "Eco Bot",
      description: "จะโจมตีเมื่อมีงบเหลือพอ ไม่งั้นรอ",
      strategy: buildBudgetShooterStrategy({
        attackCost: 10,
        fallbackMove: buildRandomMoveAction(),
        minBudget: 15,
      }),
    },
  ],
  stony: [
    {
      id: "stony-burst",
      name: "Burst Assassin",
      description: "เข้าไวและยิงหนักเมื่อเจอศัตรูติดตัว",
      strategy: buildHunterStrategy({ attackCost: 30 }),
    },
    {
      id: "stony-finisher",
      name: "Finisher",
      description: "เก็บงบก่อน แล้วค่อยยิงแรงเมื่อพร้อม",
      strategy: buildBudgetShooterStrategy({
        attackCost: 26,
        fallbackMove: buildRandomMoveAction(),
        minBudget: 28,
      }),
    },
  ],
  warrior: [
    {
      id: "warrior-frontline",
      name: "Frontline",
      description: "เดินตรงเข้าหาศัตรูและยิงพลังกลาง",
      strategy: buildHunterStrategy({ attackCost: 16 }),
    },
    {
      id: "warrior-anchor",
      name: "Anchor",
      description: "เข้าหาศัตรู แต่ถ้าไม่มีเป้าจะหยุดถือพื้นที่",
      strategy: buildBudgetShooterStrategy({
        attackCost: 18,
        fallbackMove: buildRandomMoveAction(),
        minBudget: 22,
      }),
    },
  ],
  celeb: [
    {
      id: "celeb-sniper",
      name: "Sniper",
      description: "ไล่ระยะยิงและใช้พลังโจมตีค่อนข้างสูง",
      strategy: buildHunterStrategy({ attackCost: 24 }),
    },
    {
      id: "celeb-kiter",
      name: "Kiter",
      description: "ค่อย ๆ ไล่เป้าและเก็บงบก่อนยิง",
      strategy: buildBudgetShooterStrategy({
        attackCost: 20,
        fallbackMove: buildRandomMoveAction(),
        minBudget: 24,
      }),
    },
  ],
  vanguard: [
    {
      id: "vanguard-hold",
      name: "Hold Line",
      description: "เข้าไปคุมพื้นที่และยิงเมื่อประชิด",
      strategy: buildHunterStrategy({ attackCost: 18 }),
    },
  ],
  ranger: [
    {
      id: "ranger-hunt",
      name: "Hunter",
      description: "ตามล่าศัตรูและยิงทันทีเมื่อมีโอกาส",
      strategy: buildHunterStrategy({ attackCost: 22 }),
    },
  ],
  default: [
    {
      id: "default-safe",
      name: "Safe Idle",
      description: "เทมเพลตปลอดภัยสำหรับทดสอบระบบ",
      strategy: "done",
    },
  ],
}

export function getTemplatesForMinion(minion) {
  const key = String(minion?.id || "").toLowerCase()
  return TEMPLATE_MAP[key] ?? TEMPLATE_MAP.default
}
