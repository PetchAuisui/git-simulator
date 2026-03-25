# Git Terminal Simulator

เว็บ interactive สำหรับเรียนรู้คำสั่ง Git พร้อม Git Graph แบบ real-time

```
git-simulator/
├── backend/          ← Node.js + Express API
│   ├── server.js     ← Entry point, routes
│   ├── gitCommands.js← Logic คำสั่ง git ทั้งหมด
│   ├── gitState.js   ← State manager (commits, branches, ฯลฯ)
│   └── package.json
│
├── frontend/         ← HTML + CSS + Vanilla JS
│   ├── index.html    ← โครงสร้าง UI
│   ├── style.css     ← Dark theme styles
│   └── app.js        ← Logic / API calls / Render
│
└── README.md
```

## วิธีรัน

### 1. เริ่ม Backend

```bash
cd backend
npm install
npm start         # production
# หรือ
npm run dev       # development (nodemon auto-reload)
```

Backend จะรันที่ `http://localhost:3001`

### 2. เปิด Frontend

```bash
# วิธีง่ายที่สุด — เปิดไฟล์ตรงๆ
open frontend/index.html

# หรือใช้ live-server
npx live-server frontend/
```

> ⚠️ ต้องรัน backend ก่อน ไม่งั้น frontend จะแจ้ง "offline"

---

## API Endpoints

| Method | Path                      | Description               |
|--------|---------------------------|---------------------------|
| POST   | `/api/command`            | รันคำสั่ง git              |
| GET    | `/api/status/:sessionId`  | ดูสถานะ repo              |
| GET    | `/api/graph/:sessionId`   | ดู commit graph           |
| POST   | `/api/reset/:sessionId`   | รีเซ็ต session            |
| GET    | `/api/sessions`           | debug: ดู sessions ทั้งหมด |

### ตัวอย่าง Request

```http
POST /api/command
Content-Type: application/json

{
  "sessionId": "abc123",
  "command": "git commit -m \"initial commit\""
}
```

### ตัวอย่าง Response

```json
{
  "lines": [
    { "text": "[main a1b2c3d] initial commit", "type": "success" },
    { "text": " 3 files changed", "type": "out" }
  ],
  "status": {
    "initialized": true,
    "currentBranch": "main",
    "staged": [],
    "untracked": []
  },
  "graph": [
    {
      "id": "c1",
      "hash": "a1b2c3d4567",
      "msg": "initial commit",
      "branch": "main",
      "isHEAD": true,
      "branchTips": ["main"],
      "tagTips": []
    }
  ]
}
```

## คำสั่ง Git ที่รองรับ

`init` `status` `add` `commit` `branch` `checkout` `switch`
`merge` `log` `diff` `reset` `revert` `stash` `tag`
`remote` `push` `pull` `fetch` `clone` `config` `show`
`cherry-pick` `rebase`
