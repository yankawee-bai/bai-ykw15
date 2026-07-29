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
| `supabase-config.js`       | Config กลางของ Supabase (URL + anon key + client) ใช้ร่วมทุกหน้า |
| `register.html`            | สมัครสมาชิก เลือกบทบาท แล้วบันทึกลงตาราง `profiles` |
| `login.html`               | เข้าสู่ระบบ ดึง role แล้วพาไปหน้าตามบทบาท           |
| `elderly-home.html`        | หน้าหลักของผู้สูงอายุ (ยังเป็นโครงเปล่า)            |
| `caregiver-dashboard.html` | แดชบอร์ดผู้ดูแล (ยังเป็นโครงเปล่า)                  |
| `medical-dashboard.html`   | แดชบอร์ดบุคลากรทางการแพทย์ (ยังเป็นโครงเปล่า)       |

ทุกหน้า dashboard มี **session guard** อยู่แล้ว — ถ้ายังไม่ล็อกอินจะเด้งกลับ `login.html` และถ้า role ไม่ตรงกับหน้านั้นจะถูกส่งไปหน้าของตัวเอง

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
python3 -m http.server 3000
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

เปิด RLS ไว้ ทุก policy บังคับ `auth.uid() = id` — แต่ละคนเห็นและแก้ได้เฉพาะโปรไฟล์ตัวเอง

**สำคัญ:** publishable key อยู่ในโค้ดที่ใครก็เปิดดูได้ ความปลอดภัยทั้งหมดอยู่ที่ RLS ฝั่ง database เพราะฉะนั้น **ตารางใหม่ทุกตารางต้องเปิด RLS และเขียน policy เสมอ** ห้ามลืม

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
- [ ] สร้าง `index.html` เป็นหน้าแรก
- [ ] ตารางเชื่อมความสัมพันธ์ ผู้ดูแล ↔ ผู้สูงอายุ

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
