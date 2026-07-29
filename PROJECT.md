# ระบบดูแลผู้สูงอายุ (bai-ykw15)

เว็บแอปสำหรับผู้สูงอายุ ผู้ดูแล และบุคลากรทางการแพทย์ ใช้ Supabase เป็น backend

**Repo:** https://github.com/yankawee-bai/bai-ykw15
**Supabase project:** `vboyxvlhztdrtswfuhzw`

---

## เทคโนโลยีที่ใช้

| ส่วน            | ใช้อะไร                                                    |
| --------------- | ---------------------------------------------------------- |
| หน้าเว็บ        | HTML + CSS + JavaScript ล้วน ไม่มี framework ไม่ต้อง build |
| Auth + Database | Supabase (แผนฟรี)                                          |
| Supabase SDK    | `@supabase/supabase-js@2` โหลดจาก CDN                      |
| Deploy          | GitHub Pages                                               |

ไม่ต้องติดตั้ง npm หรือรัน build ใด ๆ เปิดไฟล์ผ่าน local server ก็ทำงานได้เลย

---

## ไฟล์ในโปรเจกต์

| ไฟล์                       | หน้าที่                                             |
| -------------------------- | --------------------------------------------------- |
| `index.html`               | หน้าแรก แนะนำระบบ พาไปสมัครสมาชิกหรือเข้าสู่ระบบ    |
| `supabase-config.js`       | Config กลางของ Supabase (URL + anon key + client) ใช้ร่วมทุกหน้า |
| `register.html`            | สมัครสมาชิก เลือกบทบาท แล้วบันทึกลงตาราง `profiles` |
| `login.html`               | เข้าสู่ระบบ ดึง role แล้วพาไปหน้าตามบทบาท           |
| `elderly-home.html`        | หน้าหลักของผู้สูงอายุ (ยังเป็นโครงเปล่า)            |
| `caregiver-dashboard.html` | แดชบอร์ดผู้ดูแล (ยังเป็นโครงเปล่า)                  |
| `medical-dashboard.html`   | แดชบอร์ดบุคลากรทางการแพทย์ (ยังเป็นโครงเปล่า)       |

ทุกหน้า dashboard มี **session guard** อยู่แล้ว — ถ้ายังไม่ล็อกอินจะเด้งกลับ `login.html` และถ้า role ไม่ตรงกับหน้านั้นจะถูกส่งไปหน้าของตัวเอง

**`caregiver_links.sql`** ไม่ใช่ไฟล์ที่เว็บโหลด แต่เป็นสคริปต์ตั้งค่าฐานข้อมูล รันครั้งเดียวใน Supabase SQL editor (ดูรายละเอียดในหัวข้อโครงสร้างฐานข้อมูล → ตาราง `caregiver_links`)

**หมายเหตุเรื่อง script order:** ทุกหน้าต้องโหลดตามลำดับนี้เสมอ เพราะ `supabase-config.js` ใช้ `window.supabase` จาก SDK และหน้าต่าง ๆ ใช้ `supabaseClient` ที่ config ประกาศไว้ (global, ไม่ได้ใช้ module):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
<script>
  // โค้ดของหน้านั้น ๆ ใช้ supabaseClient ได้เลย
</script>
```

---

## เริ่มต้นใช้งาน (สำหรับคนที่เพิ่งเข้าทีม)

### 1. โคลนโปรเจกต์

```
git clone https://github.com/yankawee-bai/bai-ykw15.git
cd bai-ykw15
```

### 2. รันเว็บ

อย่าเปิดไฟล์ด้วยการดับเบิลคลิก (จะได้ URL แบบ `file://` ซึ่งอาจติด CORS) ให้รัน local server แทน

```
python -m http.server 3000
```

แล้วเปิด http://localhost:3000/register.html

### 3. ขอสิทธิ์เข้า Supabase

ถ้าต้องแก้ตาราง เขียน RLS policy หรือปรับ Auth settings ให้ขอเจ้าของโปรเจกต์เชิญเข้า Supabase organization

ถ้าแค่รันเว็บดูเฉย ๆ ไม่ต้องขอ เพราะ publishable key อยู่ในโค้ดแล้ว

---

## โครงสร้างฐานข้อมูล

### ตาราง `profiles`

| คอลัมน์      | ชนิด        | หมายเหตุ                                                  |
| ------------ | ----------- | --------------------------------------------------------- |
| `id`         | uuid        | PK, อ้างอิง `auth.users(id)`, ลบ user แล้วลบตาม           |
| `full_name`  | text        | ชื่อ-นามสกุล                                              |
| `role`       | text        | `elderly` / `caregiver` / `medical` (มี check constraint) |
| `email`      | text        | unique, เก็บซ้ำจาก `auth.users.email` เพราะฝั่ง client ด้วย anon key query `auth.users` ตรงไม่ได้ ใช้สำหรับผู้ดูแลค้นหาผู้สูงอายุตอนขอเชื่อมโยง (ดูหัวข้อ `caregiver_links`) |
| `created_at` | timestamptz | ค่าเริ่มต้น `now()`                                       |

### SQL ที่ใช้ตั้งค่า (รันไปแล้ว ไม่ต้องรันซ้ำ)

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('elderly','caregiver','medical')),
  created_at timestamptz default now()
);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

alter table public.profiles enable row level security;

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
```

### RLS

เปิด RLS ไว้ ทุก policy บังคับ `auth.uid() = id` — แต่ละคนเห็นและแก้ได้เฉพาะโปรไฟล์ตัวเอง (มี policy เพิ่มเติมจากตาราง `caregiver_links` ด้านล่าง ที่เปิดให้คู่ที่เชื่อมโยงกันแล้วเห็นโปรไฟล์กันได้)

**สำคัญ:** publishable key อยู่ในโค้ดที่ใครก็เปิดดูได้ ความปลอดภัยทั้งหมดอยู่ที่ RLS ฝั่ง database เพราะฉะนั้น **ตารางใหม่ทุกตารางต้องเปิด RLS และเขียน policy เสมอ** ห้ามลืม

---

### ตาราง `caregiver_links`

เชื่อมความสัมพันธ์ผู้ดูแล ↔ ผู้สูงอายุ แบบ many-to-many (ผู้ดูแล 1 คนดูแลผู้สูงอายุได้หลายคน และผู้สูงอายุ 1 คนมีผู้ดูแลได้หลายคน) สคริปต์เต็มอยู่ที่ `caregiver_links.sql`

| คอลัมน์         | ชนิด        | หมายเหตุ                                              |
| --------------- | ----------- | ------------------------------------------------------ |
| `id`            | uuid        | PK                                                      |
| `caregiver_id`  | uuid        | FK → `profiles(id)`, ต้องมี `role = 'caregiver'`        |
| `elderly_id`    | uuid        | FK → `profiles(id)`, ต้องมี `role = 'elderly'`          |
| `status`        | text        | `pending` / `accepted` / `declined`                     |
| `requested_by`  | uuid        | FK → `profiles(id)`, ตอนนี้ล็อกไว้ให้เป็นฝั่ง caregiver เสมอ |
| `created_at`    | timestamptz | ค่าเริ่มต้น `now()`                                     |
| `responded_at`  | timestamptz | เวลาที่ผู้สูงอายุตอบรับ/ปฏิเสธ (อัปเดตเองตอน update)    |

**flow:** ผู้ดูแลค้นหาผู้สูงอายุด้วยอีเมลผ่านฟังก์ชัน `find_elderly_by_email()` (SECURITY DEFINER, ไม่เปิด RLS ของ `profiles` ให้ทุกคน) → insert แถว `status = 'pending'` → ผู้สูงอายุเป็นคนกด accepted/declined เอง → ยกเลิกหรือตัดความสัมพันธ์ได้ทั้งสองฝ่ายผ่าน delete

RLS บังคับว่า:
- เห็นได้เฉพาะคู่ที่ตัวเองอยู่ในแถวนั้น
- มีแค่ caregiver เป็นฝ่ายสร้างคำขอได้ (insert)
- มีแค่ elderly เป็นฝ่าย update status ได้
- caregiver ยกเลิกได้เฉพาะคำขอที่ยัง pending, elderly ตัดความสัมพันธ์ได้ทุกเมื่อ
- เพิ่ม select policy ให้ `profiles` อีก 1 อัน: คู่ที่ `status = accepted` แล้วเห็นชื่อกันได้ (ไม่งั้น join จะได้ `null` เพราะ policy เดิมของ `profiles` เปิดให้เห็นแค่โปรไฟล์ตัวเอง)

มี trigger `enforce_caregiver_link_roles` กันไว้อีกชั้นด้วย เผื่อ insert ผิด role (เช่นเอา `caregiver_id` ที่จริงเป็น `elderly` มาใส่) จะ error ทันทีตั้งแต่ระดับ database

---

## ตั้งค่า Supabase Auth

Authentication → Sign In / Providers

| ตัวเลือก                   | ค่าปัจจุบัน | เหตุผล                       |
| -------------------------- | ----------- | ---------------------------- |
| Allow new users to sign up | **ON**      | ให้สมัครสมาชิกได้            |
| Confirm email              | **OFF**     | ปิดชั่วคราวระหว่างพัฒนา      |
| Email provider             | **Enabled** | ใช้ล็อกอินด้วยอีเมล/รหัสผ่าน |

### ทำไมต้องปิด Confirm email

SMTP ในตัวของ Supabase ส่งได้แค่ **2 อีเมล/ชั่วโมง** ทั้งโปรเจกต์ และส่งได้เฉพาะอีเมลที่เป็นสมาชิกทีมเท่านั้น พอทดสอบสมัครซ้ำ ๆ จะติด `email rate limit exceeded` ทันที

ปิดแล้วระบบไม่ส่งอีเมลเลย ทดสอบด้วยอีเมลปลอมอย่าง `test1@test.com` ได้ไม่จำกัด

> ⚠️ **ก่อนใช้งานจริงต้องเปิดกลับ** เพราะตอนนี้ใครสมัครด้วยอีเมลปลอมก็ได้ ซึ่งรับไม่ได้กับระบบที่เก็บข้อมูลสุขภาพ ตอนเปิดกลับต้องตั้ง custom SMTP (เช่น Resend) และย้ายการสร้าง profile ไปเป็น database trigger ด้วย เพราะตอนเปิด confirm จะยังไม่มี session ตอนสมัคร → insert จากฝั่ง client จะไม่ผ่าน RLS

---

## Deploy ขึ้น GitHub Pages

1. push ขึ้น `main`
2. GitHub repo → **Settings → Pages** → Source: Deploy from a branch → `main` / `(root)` → Save
3. รอ ~1 นาที ได้ URL `https://yankawee-bai.github.io/bai-ykw15/login.html`
4. เอา URL ไปใส่ที่ Supabase → **Authentication → URL Configuration** → Site URL

repo ต้องเป็น **public** ถ้าจะใช้ Pages ฟรี

---

## กฎการทำงานร่วมกัน

- `git pull` ก่อน `git push` ทุกครั้ง
- แบ่งกันชัด ๆ ว่าใครดูแลไฟล์ไหน จะได้ไม่แก้ชนกัน
- งานที่ใหญ่หน่อยให้แยก branch แล้วเปิด Pull Request

### ห้าม commit เด็ดขาด

`service_role` key, `sb_secret_...`, รหัสผ่าน database, API key ของ SMTP — พวกนี้ข้าม RLS ได้หมด และ git history ลบยาก ต่อให้ลบไฟล์ทีหลังก็ยังขุดเจอ

`sb_publishable_...` ที่อยู่ในโค้ดตอนนี้ปลอดภัย เพราะออกแบบมาให้เปิดเผยได้

---

## สิ่งที่ยังต้องทำ

### ระยะสั้น

- [x] แยก config Supabase ออกเป็น `supabase-config.js` (ตอนนี้ copy ซ้ำอยู่ 5 ไฟล์)
- [ ] ออกแบบและสร้างเนื้อหาจริงในหน้า dashboard ทั้ง 3
- [x] สร้าง `index.html` เป็นหน้าแรก
- [x] ตารางเชื่อมความสัมพันธ์ ผู้ดูแล ↔ ผู้สูงอายุ (`caregiver_links` — schema/RLS/function เสร็จแล้ว ทดสอบผ่าน console)
- [ ] สร้าง UI ขอ/ยอมรับเชื่อมโยงใน `caregiver-dashboard.html` และ `elderly-home.html` (ตอนนี้ทดสอบผ่าน DevTools console เท่านั้น)

### ระยะยาว

- [ ] เตือนกินยา / ตารางยา
- [ ] บันทึกสัญญาณชีพ (ความดัน ชีพจร น้ำตาล)
- [ ] ปุ่มขอความช่วยเหลือฉุกเฉิน + แจ้งเตือนผู้ดูแล
- [ ] นัดหมายแพทย์
- [ ] เปิด Confirm email + ตั้ง custom SMTP + ย้ายไปใช้ database trigger

---

## แก้ปัญหาที่เจอบ่อย

| ข้อความ error                                | สาเหตุและวิธีแก้                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| `Email signups are disabled`                 | Allow new users to sign up หรือ Email provider ปิดอยู่ — เปิดแล้วกด Save   |
| `permission denied for table profiles`       | ยังไม่ได้รันคำสั่ง `grant` — ดูหัวข้อโครงสร้างฐานข้อมูล                    |
| `new row violates row-level security policy` | ยังไม่ได้สร้าง policy หรือตอน insert ไม่มี session (Confirm email ยังเปิด) |
| `email rate limit exceeded`                  | โควตา 2 อีเมล/ชม. เต็ม — ปิด Confirm email แล้วรอครบ 1 ชม.                 |
| เข้าสู่ระบบแล้วขึ้น "ไม่พบข้อมูลโปรไฟล์"     | ไม่มีแถวใน `profiles` หรือ RLS select policy หาย                           |
| หน้า dashboard เด้งกลับ login ตลอด           | session หมดอายุ หรือ role ในตารางไม่ตรงกับหน้าที่เปิด                      |
| `supabase is not defined` หรือ `supabaseClient is not defined` | script โหลดผิดลำดับ — ต้องโหลด SDK ก่อน แล้วค่อยโหลด `supabase-config.js` ก่อน script ของหน้านั้น |
| join `caregiver_links` ไป `profiles` แล้วได้ `profiles: null` | ไม่ใช่ query ผิด — RLS ของ `profiles` เดิมเปิดให้เห็นแค่โปรไฟล์ตัวเอง ต้องมี select policy เพิ่มที่อนุญาตให้คู่ `status = accepted` เห็นกันได้ (มีอยู่แล้วในสคริปต์ `caregiver_links.sql`) |
