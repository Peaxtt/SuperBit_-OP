# SuperBit JBC Extension — Handoff

## Overview

Fork of [YahBoom SuperBit MakeCode extension](https://github.com/lzty634158/SuperBit).  
Original `namespace SuperBit` (lines 1–429 of `main.ts`) is **untouched**.  
Two new namespaces appended below it:

| Namespace | Color | For which micro:bit |
|-----------|-------|---------------------|
| `JBC` | Blue | **Robot** — gyro PID navigation |
| `JBCJoystick` | Pink | **Joystick/Remote** — send commands + live PID tuning + plot |

**Target users:** Primary school kids at JBC competition.  
**Design rule:** Thai block labels, simple, fewer blocks = better.  
**No extra libraries needed** — uses only MakeCode built-ins: `radio`, `serial`, `music`, `input`, `pins`.

---

## Hardware (Robot micro:bit)

| Component | Detail |
|-----------|--------|
| Board | micro:bit + YahBoom SuperBit V2 |
| Left motor | M3 (polarity inverted: `outLeft = -left`) |
| Right motor | M1 (polarity inverted: `outRight = -right`) |
| Gripper servo | S5, 270° mode — 40° = closed, 75° = open |
| Gyro | MPU-6050 on I2C address 104 (P19=SCL, P20=SDA, fixed on micro:bit — cannot change) |
| Radio group | 67 |

---

## Radio protocol

| Sender | Name | Value | Meaning |
|--------|------|-------|---------|
| Joystick→Robot | `cmd` | 1 | หมุนขวา 90° |
| Joystick→Robot | `cmd` | 2 | เดินตรง 3 วิ |
| Joystick→Robot | `cmd` | 3 | หยุด |
| Joystick→Robot | `kp_s` | number | ตั้ง Kp เดินตรง live |
| Joystick→Robot | `ki_s` | number | ตั้ง Ki เดินตรง live |
| Joystick→Robot | `kd_s` | number | ตั้ง Kd เดินตรง live |
| Joystick→Robot | `kp_t` | number | ตั้ง Kp หมุน live |
| Joystick→Robot | `kd_t` | number | ตั้ง Kd หมุน live |
| Robot→Joystick | `cur` | degrees | heading จริง (ทุก 100ms) |
| Robot→Joystick | `tgt` | degrees | heading เป้าหมาย (ทุก 100ms) |

Joystick รับ `cur`/`tgt` แล้ว `serial.writeValue` → แสดงใน **MakeCode Data Viewer** เป็นกราฟทันที

---

## namespace JBC — Robot blocks

### Group: Setup

| Block | Function | Default |
|-------|----------|---------|
| เตรียมหุ่นยนต์ JBC | `initRobot()` | — wake MPU, calibrate gyro 200 samples, start 5 background tasks |
| เปิดใช้ IMU [toggle] | `setImu(on)` | `true` |

`initRobot()` ต้องเรียกก่อนทุกอย่าง — calibrate ใช้เวลา ~1 วิ (200 × 5ms), micro:bit แสดง 😴 ระหว่าง calibrate แล้ว 😊 เมื่อพร้อม

### Group: Movement

| Block | Function | IMU ON | IMU OFF |
|-------|----------|--------|---------|
| เดินตรง ความเร็ว _ เป็นเวลา _ ms | `moveStraight(speed, ms)` | PID รักษาหัว | สั่ง motor ตรงๆ |
| หมุน _ องศา | `turnDegrees(degrees)` | Gyro coarse+fine | เวลา × `ms_per_deg` |
| หยุดหุ่นยนต์ | `robotStop()` | หยุด PID + motor | หยุด motor |

`turnDegrees`: บวก = ขวา, ลบ = ซ้าย

### Group: Gripper

| Block | Function | Servo |
|-------|----------|-------|
| หุบคีม (จับของ) | `closeGripper()` | → 40° (soft-ramp) |
| แบคีม (ปล่อยของ) | `openGripper()` | → 75° (soft-ramp) |

Servo เคลื่อน ±1°/10ms (smooth) ไม่กระตุก

### Group: Tuning

**ถ้าไม่จูน ไม่ต้องแตะกลุ่มนี้เลย** — ค่า default ใช้งานได้ปกติ

| Block | Function | Default | จูนเมื่อ |
|-------|----------|---------|---------|
| ตั้ง PID เดินตรง Kp Ki Kd | `setStraightPID(kp,ki,kd)` | 15, 0.01, 3.0 | robot เบี้ยว/สั่น |
| ตั้ง PD หมุน Kp Kd | `setTurnPD(kp,kd)` | 8.0, 0.5 | หมุนเลย/ค้างไม่ถึงองศา |
| ตั้งเวลาหมุน _ ms ต่อองศา | `setTurnRate(ms)` | 6 | ใช้กับ IMU ปิดเท่านั้น |
| heading ปัจจุบัน | `currentHeading()` | — | อ่านค่าใส่ block เช็ค |
| รีเซ็ต heading | `resetHeading()` | — | reset ตอนเริ่ม run ใหม่ |

---

## namespace JBCJoystick — Joystick blocks

### Group: Control

| Block | Function | ผล |
|-------|----------|----|
| เตรียม Joystick | `init()` | ตั้ง radio 67 + เปิด auto-plot |
| สั่งหมุนขวา 90° | `cmdTurnRight90()` | ส่ง cmd=1 + แสดง "T" |
| สั่งเดินตรง 3 วิ | `cmdMoveStraight()` | ส่ง cmd=2 + แสดง "G" |
| สั่งหยุด | `cmdStop()` | ส่ง cmd=3 + แสดง ❌ |
| ส่งคำสั่ง _ | `sendCmd(n)` | ส่ง cmd=n |

### Group: Tune (Live PID tuning ผ่าน radio)

**ใช้สำหรับจูน PID โดยไม่ต้องรีสตาร์ทหุ่น** — ส่งค่าใหม่ หุ่นอัพเดททันที ดูผลใน Data Viewer

| Block | ส่ง | Default | แนะนำ |
|-------|-----|---------|-------|
| ส่ง Kp เดินตรง | `kp_s` | 15.0 | ลดถ้าสั่น |
| ส่ง Ki เดินตรง | `ki_s` | 0.01 | เพิ่มถ้า drift |
| ส่ง Kd เดินตรง | `kd_s` | 3.0 | เพิ่มถ้าตอบสนองช้า |
| ส่ง Kp หมุน | `kp_t` | 8.0 | ลดถ้า overshoot |
| ส่ง Kd หมุน | `kd_t` | 0.5 | เพิ่มถ้า overshoot |

---

## วิธีดู Plot (Data Viewer)

1. เสียบ **Joystick** micro:bit เข้า USB
2. MakeCode → เมนูล่าง → **Show data Device**
3. กดปุ่มบน Joystick สั่งหุ่นทำงาน
4. กราฟจะแสดง `cur` (เส้นสีน้ำเงิน) vs `tgt` (เส้นสีแดง)
5. ถ้า `cur` ตามไม่ทัน `tgt` → เพิ่ม Kp / ถ้าสั่น → ลด Kp / ถ้าค้างไม่ถึง → เพิ่ม Ki

---

## ตัวอย่างโปรแกรม Robot

```ts
// on start
JBC.initRobot()

// on forever (ว่างเปล่าก็ได้ — PID ทำงาน background อยู่แล้ว)
```

หุ่นรับคำสั่งจาก Joystick อัตโนมัติหลัง `initRobot()`

## ตัวอย่างโปรแกรม Joystick

```ts
// on start
JBCJoystick.init()

// button A → หมุนขวา
input.onButtonPressed(Button.A, function() {
    JBCJoystick.cmdTurnRight90()
})

// button B → เดินตรง
input.onButtonPressed(Button.B, function() {
    JBCJoystick.cmdMoveStraight()
})

// button A+B → หยุด
input.onButtonPressed(Button.AB, function() {
    JBCJoystick.cmdStop()
})
```

## ตัวอย่าง Joystick จูน PID

```ts
// กด A ส่ง Kp เดินตรง = 12 (ลดจาก 15 เพราะสั่น)
input.onButtonPressed(Button.A, function() {
    JBCJoystick.tuneKpStraight(12)
})
// ดูกราฟใน Data Viewer — ถ้า cur ตาม tgt ดีขึ้น → โอเค
```

---

## Background tasks (เริ่มโดย initRobot)

| Task | ทุกๆ | หน้าที่ |
|------|------|--------|
| `_startServoRamp` | 10 ms | servo S5 เคลื่อน ±1°/tick |
| `_startPID` | 10 ms | อ่าน gyro, คำนวณ heading + PID |
| `_startMotorOutput` | forever | ส่งค่า M1/M3 พร้อม deadband |
| `_startTelemetry` | 100 ms | ส่ง cur/tgt ผ่าน radio |
| `_startRadioReceiver` | event | รับ cmd + kp/ki/kd จาก Joystick |

---

## สิ่งที่ต้องปรับบนหุ่นจริง

1. **`setTurnRate`** — ค่า default 6 ms/องศา ที่ speed 150 เป็นประมาณ ต้องทดสอบสั่งหมุน 360° แล้ว adjust
2. **deadband 55** — ถ้าหุ่นไม่เริ่มหมุน → เพิ่ม / ถ้าหมุนกระตุก → ลด (แก้ใน `_startMotorOutput` บรรทัด `< 55`)
3. **PID gains** — ใช้ค่า default ก่อน จูน live ผ่าน Joystick Tune blocks

---

## Files changed

| File | Change |
|------|--------|
| `main.ts` | เพิ่ม namespace JBC + JBCJoystick — SuperBit ไม่แตะ |
| `pxt.json` | name=`superbit-jbc`, version=`1.0.0` |
| `HANDOFF.md` | ไฟล์นี้ |

## Changelog

### Latest fixes (2026-06-16)
- **Bug 1:** JSDoc comment "เดินตรง..." วางผิดที่บน `setImu()` → แก้ JSDoc ให้ถูกต้องทั้งสอง function
- **Bug 2:** `_jbc_imuEnabled` ไม่ถูกเช็คใน `_startPID()` → เพิ่ม early return พร้อม update `_jbc_lastTime` เพื่อกัน dt spike ตอน re-enable
- **Bug 3:** PID tuning variables (`_jbc_Kp_*` ฯลฯ) อยู่คนละที่กับ state variables อื่น → ย้ายมารวมกันทั้งหมดที่ block เดียวหลัง `MPU_ADDR`

## To load in MakeCode

Push repo to GitHub → MakeCode **Extensions** → วาง GitHub URL → category `JBC` (blue) และ `JBCJoystick` (pink) จะปรากฏ
