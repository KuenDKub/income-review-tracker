# Deploy: Vercel + Neon

คู่มือ deploy โปรเจค income-review-tracker บน Vercel (Next.js) + Neon (PostgreSQL) + Supabase Storage (ไฟล์อัปโหลด)

---

## สิ่งที่ต้องมี

- บัญชี [GitHub](https://github.com)
- บัญชี [Vercel](https://vercel.com)
- บัญชี [Neon](https://neon.tech)
- บัญชี [Supabase](https://supabase.com) (สำหรับไฟล์อัปโหลด)

---

## ขั้นตอนที่ 1: Push โปรเจคขึ้น GitHub

```bash
cd /path/to/income-review-tracker

# สร้าง repo (ถ้ายังไม่มี)
git init
git add .
git commit -m "Initial commit"

# สร้าง repo บน GitHub แล้ว push
git remote add origin https://github.com/YOUR_USERNAME/income-review-tracker.git
git branch -M main
git push -u origin main
```

---

## ขั้นตอนที่ 2: สร้าง Neon Database

### 2.1 สร้าง Project

1. ไปที่ [console.neon.tech](https://console.neon.tech)
2. คลิก **New Project**
3. ตั้งค่า:
   - **Project name:** `income-review-tracker`
   - **Region:** Singapore (ap-southeast-1) หรือใกล้ที่สุด
   - **Postgres version:** 17

### 2.2 Copy Connection String

หลังสร้างเสร็จ Neon แสดง Connection string:

- เลือก **Pooled connection** (เหมาะกับ serverless)
- คัดลอก Connection string (จะมีรูปแบบประมาณ):
  ```
  postgresql://user:password@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
  ```

### 2.3 รัน Schema (Migration)

**วิธี A: ใช้ Neon SQL Editor**

1. Neon Dashboard → **SQL Editor**
2. Copy เนื้อหาทั้งหมดจากไฟล์ `src/lib/db/schema.sql`
3. Paste ใน SQL Editor แล้วกด **Run**

**วิธี B: รันจากเครื่อง local**

```bash
# ใส่ DATABASE_URL ใน .env ชั่วคราว แล้วรัน
export DATABASE_URL="postgresql://..."  # จาก Neon
npm run db:migrate
```

---

## ขั้นตอนที่ 3: Deploy บน Vercel

### 3.1 Import Project

1. ไปที่ [vercel.com](https://vercel.com) → **Add New** → **Project**
2. เลือก repository `income-review-tracker` (เชื่อม GitHub ถ้ายังไม่ได้)
3. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detect)
   - Root Directory: `.` (default)
   - Build Command: `next build`
   - Output Directory: `.next`

### 3.2 ตั้งค่า Environment Variables

กด **Environment Variables** แล้วเพิ่ม:

| Name | Value | Environments |
|------|-------|--------------|
| `DATABASE_URL` | Connection string จาก Neon (pooled) | Production, Preview |
| `SUPABASE_S3_ENDPOINT` | `https://YOUR_PROJECT.storage.supabase.co/storage/v1/s3` | Production, Preview |
| `SUPABASE_S3_ACCESS_KEY_ID` | Access Key จาก Supabase | Production, Preview |
| `SUPABASE_S3_SECRET_ACCESS_KEY` | Secret Key จาก Supabase | Production, Preview |
| `SUPABASE_PUBLIC_URL` | `https://YOUR_PROJECT.supabase.co/storage/v1/object/public` | Production, Preview |
| `SUPABASE_STORAGE_BUCKET` | `income-review-tracker` | Production, Preview |

### 3.3 Deploy

กด **Deploy** — Vercel จะ build และ deploy อัตโนมัติ

---

## ขั้นตอนที่ 4: Supabase Storage (ถ้ายังไม่ได้ setup)

1. [Supabase Dashboard](https://supabase.com/dashboard) → เลือกโปรเจค
2. **Storage** → **New bucket**
3. สร้าง bucket ชื่อ `income-review-tracker` → **Public bucket**
4. **Settings** → **API** หรือ **Storage** → **S3 Access Keys**
5. สร้าง S3 credentials แล้วใส่ค่าใน Vercel (ตามตารางด้านบน)

---

## เช็คว่า Deploy สำเร็จ

1. **Build**: ต้องสีเขียว (passed)
2. **URL**: เปิด `https://your-project.vercel.app`
3. **Database**: เช็คว่าหน้า Dashboard / Jobs โหลดได้
4. **Upload**: ลองอัปโหลดไฟล์ใน Job → ควรเห็นรูปจาก Supabase URL

---

## การ Deploy ต่อในอนาคต

ทุกครั้งที่ push ขึ้น branch `main` Vercel จะ **auto-deploy** ให้เอง

```bash
git add .
git commit -m "Your message"
git push origin main
```

---

## ปัญหาที่พบบ่อย

### Error: DATABASE_URL is not set
→ ตรวจสอบว่าเพิ่ม env var ใน Vercel และเลือก scope = Production

### Error: connect ECONNREFUSED / timeout
→ ใช้ **pooled** connection string จาก Neon (มี `-pooler` ใน host)

### ไฟล์อัปโหลดไม่ได้ / NoSuchBucket
→ สร้าง bucket ใน Supabase และตรวจสอบ env vars

### หน้าเว็บ slow / cold start
→ ปกติสำหรับ serverless — request แรกหลัง idle จะช้ากว่า

---

## สรุป Checklist

- [ ] Push โปรเจคขึ้น GitHub
- [ ] สร้าง Neon project + copy pooled connection string
- [ ] รัน schema ใน Neon (SQL Editor หรือ `npm run db:migrate`)
- [ ] สร้าง Supabase bucket `income-review-tracker` (public)
- [ ] สร้าง Vercel project จาก GitHub repo
- [ ] ใส่ Environment Variables ทั้งหมด
- [ ] Deploy
