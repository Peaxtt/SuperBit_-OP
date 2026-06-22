/*
Copyright (C): 2010-2019, Shenzhen Yahboom Tech
modified from liusen
load dependency
"SuperBit": "file:../pxt-Superbit"
*/

//% color="#ECA40D" weight=20 icon="\uf085"
namespace SuperBit {

    const PCA9685_ADD = 0x40
    const MODE1 = 0x00
    const MODE2 = 0x01
    const SUBADR1 = 0x02
    const SUBADR2 = 0x03
    const SUBADR3 = 0x04

    const LED0_ON_L = 0x06
    const LED0_ON_H = 0x07
    const LED0_OFF_L = 0x08
    const LED0_OFF_H = 0x09

    const ALL_LED_ON_L = 0xFA
    const ALL_LED_ON_H = 0xFB
    const ALL_LED_OFF_L = 0xFC
    const ALL_LED_OFF_H = 0xFD

    const PRESCALE = 0xFE

    const STP_CHA_L = 2047
    const STP_CHA_H = 4095

    const STP_CHB_L = 1
    const STP_CHB_H = 2047

    const STP_CHC_L = 1023
    const STP_CHC_H = 3071

    const STP_CHD_L = 3071
    const STP_CHD_H = 1023

    let initialized = false
    let yahStrip: neopixel.Strip;

   
    export enum enMusic {

        dadadum = 0,
        entertainer,
        prelude,
        ode,
        nyan,
        ringtone,
        funk,
        blues,

        birthday,
        wedding,
        funereal,
        punchline,
        baddy,
        chase,
        ba_ding,
        wawawawaa,
        jump_up,
        jump_down,
        power_up,
        power_down
    }
    

    
    export enum enSteppers {
        B1 = 0x1,
        B2 = 0x2
    }
    export enum enPos { 
        //% blockId="forward" block="forward"
        forward = 1,
        //% blockId="reverse" block="reverse"
        reverse = 2,
        //% blockId="stop" block="stop"
        stop = 3
    }

    export enum enTurns {
        //% blockId="T1B4" block="1/4"
        T1B4 = 90,
        //% blockId="T1B2" block="1/2"
        T1B2 = 180,
        //% blockId="T1B0" block="1"
        T1B0 = 360,
        //% blockId="T2B0" block="2"
        T2B0 = 720,
        //% blockId="T3B0" block="3"
        T3B0 = 1080,
        //% blockId="T4B0" block="4"
        T4B0 = 1440,
        //% blockId="T5B0" block="5"
        T5B0 = 1800
    }
    
    export enum enServo {
        
        S1 = 0,
        S2,
        S3,
        S4,
        S5,
        S6,
        S7,
        S8
    }
    export enum enMotors {
        M1 = 8,
        M2 = 10,
        M3 = 12,
        M4 = 14
    }

    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2ccmd(addr: number, value: number) {
        let buf = pins.createBuffer(1)
        buf[0] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }

    function initPCA9685(): void {
        i2cwrite(PCA9685_ADD, MODE1, 0x00)
        setFreq(50);
        initialized = true
    }

    function setFreq(freq: number): void {
        // Constrain the frequency
        let prescaleval = 25000000;
        prescaleval /= 4096;
        prescaleval /= freq;
        prescaleval -= 1;
        let prescale = prescaleval; //Math.Floor(prescaleval + 0.5);
        let oldmode = i2cread(PCA9685_ADD, MODE1);
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2cwrite(PCA9685_ADD, MODE1, newmode); // go to sleep
        i2cwrite(PCA9685_ADD, PRESCALE, prescale); // set the prescaler
        i2cwrite(PCA9685_ADD, MODE1, oldmode);
        control.waitMicros(5000);
        i2cwrite(PCA9685_ADD, MODE1, oldmode | 0xa1);
    }

    function setPwm(channel: number, on: number, off: number): void {
        if (channel < 0 || channel > 15)
            return;
        if (!initialized) {
            initPCA9685();
        }
        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on >> 8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off >> 8) & 0xff;
        pins.i2cWriteBuffer(PCA9685_ADD, buf);
    }

    function setStepper(index: number, dir: boolean): void {
        if (index == enSteppers.B1) {
            if (dir) {
                setPwm(11, STP_CHA_L, STP_CHA_H);
                setPwm(9, STP_CHB_L, STP_CHB_H);
                setPwm(10, STP_CHC_L, STP_CHC_H);
                setPwm(8, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(8, STP_CHA_L, STP_CHA_H);
                setPwm(10, STP_CHB_L, STP_CHB_H);
                setPwm(9, STP_CHC_L, STP_CHC_H);
                setPwm(11, STP_CHD_L, STP_CHD_H);
            }
        } else {
            if (dir) {
                setPwm(12, STP_CHA_L, STP_CHA_H);
                setPwm(14, STP_CHB_L, STP_CHB_H);
                setPwm(13, STP_CHC_L, STP_CHC_H);
                setPwm(15, STP_CHD_L, STP_CHD_H);
            } else {
                setPwm(15, STP_CHA_L, STP_CHA_H);
                setPwm(13, STP_CHB_L, STP_CHB_H);
                setPwm(14, STP_CHC_L, STP_CHC_H);
                setPwm(12, STP_CHD_L, STP_CHD_H);
            }
        }
    }

    function stopMotor(index: number) {
        setPwm(index, 0, 0);
        setPwm(index + 1, 0, 0);
    }
    /**
     * *****************************************************************
     * @param index
     */   
    //% blockId=SuperBit_RGB_Program block="RGB_Program"
    //% weight=99
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function RGB_Program(): neopixel.Strip {
         
        if (!yahStrip) {
            yahStrip = neopixel.create(DigitalPin.P12, 4, NeoPixelMode.RGB);
        }
        return yahStrip;  
    } 
    
    //% blockId=SuperBit_Music block="Music|%index"
    //% weight=98
    //% blockGap=10
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function Music(index: enMusic): void {
        switch (index) {
            case enMusic.dadadum: music.beginMelody(music.builtInMelody(Melodies.Dadadadum), MelodyOptions.Once); break;
            case enMusic.birthday: music.beginMelody(music.builtInMelody(Melodies.Birthday), MelodyOptions.Once); break;
            case enMusic.entertainer: music.beginMelody(music.builtInMelody(Melodies.Entertainer), MelodyOptions.Once); break;
            case enMusic.prelude: music.beginMelody(music.builtInMelody(Melodies.Prelude), MelodyOptions.Once); break;
            case enMusic.ode: music.beginMelody(music.builtInMelody(Melodies.Ode), MelodyOptions.Once); break;
            case enMusic.nyan: music.beginMelody(music.builtInMelody(Melodies.Nyan), MelodyOptions.Once); break;
            case enMusic.ringtone: music.beginMelody(music.builtInMelody(Melodies.Ringtone), MelodyOptions.Once); break;
            case enMusic.funk: music.beginMelody(music.builtInMelody(Melodies.Funk), MelodyOptions.Once); break;
            case enMusic.blues: music.beginMelody(music.builtInMelody(Melodies.Blues), MelodyOptions.Once); break;
            case enMusic.wedding: music.beginMelody(music.builtInMelody(Melodies.Wedding), MelodyOptions.Once); break;
            case enMusic.funereal: music.beginMelody(music.builtInMelody(Melodies.Funeral), MelodyOptions.Once); break;
            case enMusic.punchline: music.beginMelody(music.builtInMelody(Melodies.Punchline), MelodyOptions.Once); break;
            case enMusic.baddy: music.beginMelody(music.builtInMelody(Melodies.Baddy), MelodyOptions.Once); break;
            case enMusic.chase: music.beginMelody(music.builtInMelody(Melodies.Chase), MelodyOptions.Once); break;
            case enMusic.ba_ding: music.beginMelody(music.builtInMelody(Melodies.BaDing), MelodyOptions.Once); break;
            case enMusic.wawawawaa: music.beginMelody(music.builtInMelody(Melodies.Wawawawaa), MelodyOptions.Once); break;
            case enMusic.jump_up: music.beginMelody(music.builtInMelody(Melodies.JumpUp), MelodyOptions.Once); break;
            case enMusic.jump_down: music.beginMelody(music.builtInMelody(Melodies.JumpDown), MelodyOptions.Once); break;
            case enMusic.power_up: music.beginMelody(music.builtInMelody(Melodies.PowerUp), MelodyOptions.Once); break;
            case enMusic.power_down: music.beginMelody(music.builtInMelody(Melodies.PowerDown), MelodyOptions.Once); break;
        }
    }
    
    //% blockId=SuperBit_Servo block="Servo(180°)|num %num|value %value"
    //% weight=97
    //% blockGap=10
    //% num.min=1 num.max=4 value.min=0 value.max=180
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=20
    export function Servo(num: enServo, value: number): void {

        // 50hz: 20,000 us
        let us = (value * 1800 / 180 + 600); // 0.6 ~ 2.4
        let pwm = us * 4096 / 20000;
        setPwm(num, 0, pwm);

    }

    //% blockId=SuperBit_Servo2 block="Servo(270°)|num %num|value %value"
    //% weight=96
    //% blockGap=10
    //% num.min=1 num.max=4 value.min=0 value.max=270
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=20
    export function Servo2(num: enServo, value: number): void {

        // 50hz: 20,000 us
        let newvalue = Math.map(value, 0, 270, 0, 180);
        let us = (newvalue * 1800 / 180 + 600); // 0.6 ~ 2.4
        let pwm = us * 4096 / 20000;
        setPwm(num, 0, pwm);

    }

    //% blockId=SuperBit_Servo3 block="Servo(360°)|num %num|pos %pos|value %value"
    //% weight=96
    //% blockGap=10
    //% num.min=1 num.max=4 value.min=0 value.max=90
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=20
    export function Servo3(num: enServo, pos: enPos, value: number): void {

        // 50hz: 20,000 us
        
        if (pos == enPos.stop) {
            let us = (86 * 1800 / 180 + 600); // 0.6 ~ 2.4
            let pwm = us * 4096 / 20000;
            setPwm(num, 0, pwm);
        }
        else if(pos == enPos.forward){ //0-90 -> 90 - 0
            let us = ((90-value) * 1800 / 180 + 600); // 0.6 ~ 2.4
            let pwm = us * 4096 / 20000;
            setPwm(num, 0, pwm);
        }
        else if(pos == enPos.reverse){ //0-90 -> 90 -180
            let us = ((90+value) * 1800 / 180 + 600); // 0.6 ~ 2.4
            let pwm = us * 4096 / 20000;
            setPwm(num, 0, pwm);
        }

       

    }
    //% blockId=SuperBit_MotorRun block="Motor|%index|speed(-255~255) %speed"
    //% weight=93
    //% speed.min=-255 speed.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=4
    export function MotorRun(index: enMotors, speed: number): void {
        if (!initialized) {
            initPCA9685()
        }
        speed = speed * 16; // map 255 to 4096
        if (speed >= 4096) {
            speed = 4095
        }
        if (speed <= -4096) {
            speed = -4095
        }

        let a = index
        let b = index + 1
        
        if (a > 10)
        {
            if (speed >= 0) {
                setPwm(a, 0, speed)
                setPwm(b, 0, 0)
            } else {
                setPwm(a, 0, 0)
                setPwm(b, 0, -speed)
            }
        }
        else { 
            if (speed >= 0) {
                setPwm(b, 0, speed)
                setPwm(a, 0, 0)
            } else {
                setPwm(b, 0, 0)
                setPwm(a, 0, -speed)
            }
        }
        
    }
    


    //% blockId=SuperBit_MotorRunDual block="Motor|%motor1|speed %speed1|%motor2|speed %speed2"
    //% weight=92
    //% blockGap=50
    //% speed1.min=-255 speed1.max=255
    //% speed2.min=-255 speed2.max=255
    //% name.fieldEditor="gridpicker" name.fieldOptions.columns=2
    export function MotorRunDual(motor1: enMotors, speed1: number, motor2: enMotors, speed2: number): void {
        MotorRun(motor1, speed1);
        MotorRun(motor2, speed2);
    }

    //% blockId=SuperBit_StepperDegree block="Stepper Motor(28BYJ-48) |%index|degree %degree"
    //% weight=90
    export function StepperDegree(index: enSteppers, degree: number): void {
        if (!initialized) {
            initPCA9685()
        }
        setStepper(index, degree > 0);
        degree = Math.abs(degree);
        basic.pause(10240 * degree / 360);
        MotorStopAll()
    }

    //% blockId=SuperBit_MotorStopAll block="Motor Stop All"
    //% weight=91
    //% blockGap=50
    export function MotorStopAll(): void {
        if (!initialized) {
            initPCA9685()
        }
        
        stopMotor(enMotors.M1);
        stopMotor(enMotors.M2);
        stopMotor(enMotors.M3);
        stopMotor(enMotors.M4);
        
    }

    //% blockId=SuperBit_StepperTurn block="Stepper Motor(28BYJ-48) |%index|turn %turn|circle"
    //% weight=89
    export function StepperTurn(index: enSteppers, turn: enTurns): void {
        let degree = turn;
        StepperDegree(index, degree);
    }

    //% blockId=SuperBit_StepperDual block="Dual Stepper Motor(Degree) |M1 %degree1| M2 %degree2"
    //% weight=88
    export function StepperDual(degree1: number, degree2: number): void {
        if (!initialized) {
            initPCA9685()
        }
        setStepper(1, degree1 > 0);
        setStepper(2, degree2 > 0);
        degree1 = Math.abs(degree1);
        degree2 = Math.abs(degree2);
        basic.pause(10240 * Math.min(degree1, degree2) / 360);
        if (degree1 > degree2) {
            stopMotor(enMotors.M3);
            stopMotor(enMotors.M4);
            basic.pause(10240 * (degree1 - degree2) / 360);
        } else {
            stopMotor(enMotors.M1);
            stopMotor(enMotors.M2);
            basic.pause(10240 * (degree2 - degree1) / 360);
        }

        MotorStopAll()
    }

    //% blockId=SuperBit_PWMOFF block="PWM OFF|%index"
    //% weight=87
    export function PWMOFF(index: number): void {
        setPwm(index, 0, 0);
    }

}

// ─── JBC state variables ────────────────────────────────────────────────────
let _jbc_imuEnabled: boolean = true
let _jbc_isTurning: boolean = false
let _jbc_speedY: number = 0
let _jbc_correction: number = 0
let _jbc_currentHeading: number = 0
let _jbc_targetHeading: number = 0
let _jbc_integral: number = 0
let _jbc_lastError: number = 0
let _jbc_gyroOffset: number = 0
let _jbc_lastTime: number = input.runningTime()
let _jbc_headingAccErr: number = 0
let _jbc_targetServo: number = 75
let _jbc_currentServo: number = 75
const MPU_ADDR: number = 104
let _jbc_Kp_straight: number = 15.0
let _jbc_Ki_straight: number = 0.01
let _jbc_Kd_straight: number = 3.0
let _jbc_Kp_turn: number = 8.0
let _jbc_Ki_turn: number = 0.0
let _jbc_Kd_turn: number = 0.5
let _jbc_msperdeg: number = 6

// ─── JBC namespace ───────────────────────────────────────────────────────────
//% color="#2196F3" icon=""
//% groups="['Setup','Movement','Gripper']"
namespace JBC {

    // ── Background: servo soft-ramp (10 ms) ──────────────────────────────────
    function _startServoRamp(): void {
        loops.everyInterval(10, function () {
            if (_jbc_currentServo < _jbc_targetServo) {
                _jbc_currentServo += 1
                SuperBit.Servo2(SuperBit.enServo.S5, _jbc_currentServo)
            } else if (_jbc_currentServo > _jbc_targetServo) {
                _jbc_currentServo -= 1
                SuperBit.Servo2(SuperBit.enServo.S5, _jbc_currentServo)
            }
        })
    }

    // ── Background: gyro PID (10 ms) ─────────────────────────────────────────
    function _startPID(): void {
        loops.everyInterval(10, function () {
            if (!_jbc_imuEnabled) {
                _jbc_lastTime = input.runningTime()
                _jbc_correction = 0
                return
            }
            pins.i2cWriteNumber(MPU_ADDR, 71, NumberFormat.UInt8BE, true)
            let raw = pins.i2cReadNumber(MPU_ADDR, NumberFormat.Int16BE, false)

            let now = input.runningTime()
            let dt = (now - _jbc_lastTime) / 1000
            _jbc_lastTime = now

            let dps = (raw - _jbc_gyroOffset) / 131
            let threshold = _jbc_isTurning ? 0.3 : 1.0
            if (Math.abs(dps) > threshold) {
                _jbc_currentHeading += dps * dt
            }

            if (_jbc_isTurning || _jbc_speedY != 0) {
                let error = _jbc_targetHeading - _jbc_currentHeading
                _jbc_integral += error * dt

                let Kp: number
                let Kd: number
                let iterm: number
                if (_jbc_isTurning) {
                    _jbc_integral = Math.constrain(_jbc_integral, -50, 50)
                    Kp = _jbc_Kp_turn; Kd = _jbc_Kd_turn; iterm = _jbc_integral * _jbc_Ki_turn
                } else {
                    _jbc_integral = Math.constrain(_jbc_integral, -50, 50)
                    Kp = _jbc_Kp_straight; Kd = _jbc_Kd_straight; iterm = _jbc_integral * _jbc_Ki_straight
                }

                let derivative = (dt > 0) ? (error - _jbc_lastError) / dt : 0
                _jbc_correction = error * Kp + iterm + derivative * Kd

                if (_jbc_isTurning) {
                    let turnErr = Math.abs(_jbc_targetHeading - _jbc_currentHeading)
                    if (turnErr > 15) {
                        _jbc_correction = Math.constrain(_jbc_correction, -130, 130)
                    } else {
                        _jbc_correction = Math.constrain(_jbc_correction, -70, 70)
                    }
                }

                _jbc_lastError = error
            } else {
                _jbc_correction = 0
                _jbc_integral = 0
                _jbc_lastError = 0
                _jbc_targetHeading = _jbc_currentHeading
            }
        })
    }

    // ── Background: motor output (forever) ───────────────────────────────────
    function _startMotorOutput(): void {
        basic.forever(function () {
            let left: number
            let right: number
            if (_jbc_isTurning) {
                left = _jbc_correction
                right = -_jbc_correction
            } else {
                left = _jbc_speedY + _jbc_correction
                right = _jbc_speedY - _jbc_correction
            }

            let outLeft = -left
            let outRight = -right

            if (_jbc_isTurning) {
                if (outLeft > 0 && outLeft < 55) outLeft = 55
                if (outLeft < 0 && outLeft > -55) outLeft = -55
                if (outRight > 0 && outRight < 55) outRight = 55
                if (outRight < 0 && outRight > -55) outRight = -55
            }

            outLeft = Math.constrain(outLeft, -255, 255)
            outRight = Math.constrain(outRight, -255, 255)

            SuperBit.MotorRun(SuperBit.enMotors.M3, outLeft)
            SuperBit.MotorRun(SuperBit.enMotors.M1, outRight)
        })
    }

    // ── Background: telemetry (100 ms) ───────────────────────────────────────
    function _startTelemetry(): void {
        loops.everyInterval(100, function () {
            radio.sendValue("cur", Math.round(_jbc_currentHeading))
            radio.sendValue("tgt", Math.round(_jbc_targetHeading))
        })
    }

    // ── Single radio handler: cmd + live PID tuning from Joystick ────────────
    function _startRadioReceiver(): void {
        radio.onReceivedValue(function (name: string, value: number) {
            if (name == "cmd") {
                if (value == 1) { JBC.turnDegrees(90) }
                else if (value == 2) { JBC.moveStraight(150, 3000) }
                else if (value == 3) { JBC.robotStop() }
            } else if (name == "kp_s") { _jbc_Kp_straight = value }
            else if (name == "ki_s") { _jbc_Ki_straight = value }
            else if (name == "kd_s") { _jbc_Kd_straight = value }
            else if (name == "kp_t") { _jbc_Kp_turn = value }
            else if (name == "ki_t") { _jbc_Ki_turn = value }
            else if (name == "kd_t") { _jbc_Kd_turn = value }
        })
    }

    // ── Exported blocks ───────────────────────────────────────────────────────

    /**
     * เตรียมหุ่นยนต์ JBC: จูน IMU แล้วเริ่มทำงาน
     */
    //% block="เตรียมหุ่นยนต์ JBC"
    //% group="Setup" weight=100
    export function initRobot(): void {
        radio.setGroup(67)
        SuperBit.Servo2(SuperBit.enServo.S5, 75)

        // Wake MPU-6050
        pins.i2cWriteNumber(MPU_ADDR, 27392, NumberFormat.UInt16BE, false)

        basic.showIcon(IconNames.Asleep)
        music.playTone(131, music.beat(BeatFraction.Quarter))

        // Calibrate gyro offset (200 samples × 5 ms)
        let sum = 0
        for (let i = 0; i < 200; i++) {
            pins.i2cWriteNumber(MPU_ADDR, 71, NumberFormat.UInt8BE, true)
            sum += pins.i2cReadNumber(MPU_ADDR, NumberFormat.Int16BE, false)
            basic.pause(5)
        }
        _jbc_gyroOffset = sum / 200
        _jbc_lastTime = input.runningTime()

        basic.showIcon(IconNames.Happy)
        music.playTone(523, music.beat(BeatFraction.Eighth))

        _startServoRamp()
        _startPID()
        _startMotorOutput()
        _startTelemetry()
        _startRadioReceiver()
    }

    /**
     * เปิด/ปิด การใช้ IMU (ค่าเริ่มต้น: เปิด)
     * @param on true = ใช้ IMU, false = ปิด IMU
     */
    //% block="เปิดใช้ IMU %on"
    //% on.shadow="toggleOnOff" on.defl=true
    //% group="Setup" weight=95
    export function setImu(on: boolean): void {
        _jbc_imuEnabled = on
    }

    /**
     * เดินตรง ด้วยความเร็วที่กำหนด เป็นเวลากี่มิลลิวินาที
     * @param speed ความเร็ว 0–255, eg: 150
     * @param duration_ms เวลา (มิลลิวินาที), eg: 2000
     */
    //% block="เดินตรง|ความเร็ว %speed ms %duration_ms"
    //% speed.min=0 speed.max=255 speed.defl=150
    //% duration_ms.min=100 duration_ms.defl=2000
    //% group="Movement" weight=90
    export function moveStraight(speed: number, duration_ms: number): void {
        if (_jbc_imuEnabled) {
            _jbc_isTurning = false
            _jbc_targetHeading = _jbc_currentHeading
            _jbc_integral = 0
            _jbc_lastError = 0
            _jbc_speedY = -speed
            basic.pause(duration_ms)
            robotStop()
        } else {
            SuperBit.MotorRun(SuperBit.enMotors.M3, -speed)
            SuperBit.MotorRun(SuperBit.enMotors.M1, -speed)
            basic.pause(duration_ms)
            robotStop()
        }
    }

    /**
     * หมุน กี่องศา (บวก = ขวา, ลบ = ซ้าย)
     * @param degrees องศาที่ต้องการหมุน, eg: 90
     */
    //% block="หมุน %degrees องศา"
    //% degrees.min=-360 degrees.max=360 degrees.defl=90
    //% group="Movement" weight=80
    export function turnDegrees(degrees: number): void {
        if (_jbc_imuEnabled) {
            robotStop()
            basic.pause(200)

            let compensated = degrees + _jbc_headingAccErr
            _jbc_targetHeading = _jbc_currentHeading - compensated
            _jbc_integral = 0
            _jbc_lastError = 0
            _jbc_isTurning = true

            let t0 = input.runningTime()
            while (Math.abs(_jbc_targetHeading - _jbc_currentHeading) > 15) {
                if (input.runningTime() - t0 > 5000) break
                basic.pause(10)
            }

            _jbc_integral = 0
            _jbc_lastError = 0

            t0 = input.runningTime()
            while (Math.abs(_jbc_targetHeading - _jbc_currentHeading) > 0.5) {
                if (input.runningTime() - t0 > 3000) break
                basic.pause(10)
            }

            _jbc_headingAccErr = _jbc_targetHeading - _jbc_currentHeading
            robotStop()
            basic.pause(200)
        } else {
            let dur = Math.abs(degrees) * _jbc_msperdeg
            if (degrees > 0) {
                SuperBit.MotorRun(SuperBit.enMotors.M3, -150)
                SuperBit.MotorRun(SuperBit.enMotors.M1, 150)
            } else {
                SuperBit.MotorRun(SuperBit.enMotors.M3, 150)
                SuperBit.MotorRun(SuperBit.enMotors.M1, -150)
            }
            basic.pause(dur)
            robotStop()
        }
    }

    /**
     * หยุดหุ่นยนต์
     */
    //% block="หยุด"
    //% group="Movement" weight=70
    export function robotStop(): void {
        _jbc_speedY = 0
        _jbc_isTurning = false
        _jbc_correction = 0
        SuperBit.MotorRun(SuperBit.enMotors.M3, 0)
        SuperBit.MotorRun(SuperBit.enMotors.M1, 0)
    }

    /**
     * หุบคีม (จับของ)
     */
    //% block="หุบคีม"
    //% group="Gripper" weight=60
    export function closeGripper(): void {
        _jbc_targetServo = 40
    }

    /**
     * แบคีม (ปล่อยของ)
     */
    //% block="แบคีม"
    //% group="Gripper" weight=50
    export function openGripper(): void {
        _jbc_targetServo = 75
    }

    // ── PID Tuning blocks ────────────────────────────────────────────────────

    /**
     * ตั้งค่า PID สำหรับเดินตรง
     * @param kp eg: 15.0
     * @param ki eg: 0.01
     * @param kd eg: 3.0
     */
    //% block="ตั้ง PID เดินตรง|Kp %kp Ki %ki Kd %kd"
    //% kp.defl=15.0 ki.defl=0.01 kd.defl=3.0
    //% group="Tuning" weight=45
    export function setStraightPID(kp: number, ki: number, kd: number): void {
        _jbc_Kp_straight = kp
        _jbc_Ki_straight = ki
        _jbc_Kd_straight = kd
    }

    /**
     * ตั้งค่า PD สำหรับหมุน
     * @param kp eg: 8.0
     * @param kd eg: 0.5
     */
    //% block="ตั้ง PID หมุน|Kp %kp Ki %ki Kd %kd"
    //% kp.defl=8.0 ki.defl=0.0 kd.defl=0.5
    //% group="Tuning" weight=44
    export function setTurnPID(kp: number, ki: number, kd: number): void {
        _jbc_Kp_turn = kp
        _jbc_Ki_turn = ki
        _jbc_Kd_turn = kd
    }

    /**
     * ตั้งเวลาหมุนต่อองศา (ใช้เมื่อปิด IMU)
     * @param ms_per_deg เวลา ms ต่อ 1 องศา eg: 6
     */
    //% block="ตั้งเวลาหมุน %ms_per_deg ms/องศา"
    //% ms_per_deg.defl=6
    //% group="Tuning" weight=43
    export function setTurnRate(ms_per_deg: number): void {
        _jbc_msperdeg = ms_per_deg
    }

    /**
     * อ่านค่า heading ปัจจุบัน (องศา)
     */
    //% block="heading ปัจจุบัน"
    //% group="Tuning" weight=42
    export function currentHeading(): number {
        return _jbc_currentHeading
    }

    /**
     * รีเซ็ต heading เป็น 0
     */
    //% block="รีเซ็ต heading"
    //% group="Tuning" weight=41
    export function resetHeading(): void {
        _jbc_currentHeading = 0
        _jbc_targetHeading = 0
        _jbc_headingAccErr = 0
        _jbc_integral = 0
        _jbc_lastError = 0
    }

}

// ─── JBC Joystick namespace ──────────────────────────────────────────────────
//% color="#E91E63" icon=""
//% groups="['Control','Tune']"
namespace JBCJoystick {

    /**
     * เตรียม Joystick — ตั้ง radio group 67 และเปิด plot อัตโนมัติ
     * (ค่า cur/tgt จากหุ่นจะแสดงใน MakeCode Data Viewer ทันที)
     */
    //% block="เตรียม Joystick"
    //% group="Control" weight=100
    export function init(): void {
        radio.setGroup(67)
        radio.onReceivedValue(function (name: string, value: number) {
            serial.writeValue(name, value)
        })
    }

    /**
     * สั่งหมุนขวา 90 องศา
     */
    //% block="สั่งหมุนขวา 90°"
    //% group="Control" weight=90
    export function cmdTurnRight90(): void {
        radio.sendValue("cmd", 1)
        basic.showString("T")
    }

    /**
     * สั่งเดินตรง 3 วินาที
     */
    //% block="สั่งเดินตรง"
    //% group="Control" weight=80
    export function cmdMoveStraight(): void {
        radio.sendValue("cmd", 2)
        basic.showString("G")
    }

    /**
     * สั่งหยุด
     */
    //% block="สั่งหยุด"
    //% group="Control" weight=70
    export function cmdStop(): void {
        radio.sendValue("cmd", 3)
        basic.showIcon(IconNames.No)
    }

    /**
     * ส่งคำสั่งหมายเลขเอง
     * @param cmd eg: 1
     */
    //% block="ส่งคำสั่ง %cmd"
    //% cmd.defl=1
    //% group="Control" weight=60
    export function sendCmd(cmd: number): void {
        radio.sendValue("cmd", cmd)
    }

    // ── Live PID tuning — ส่งค่าไปให้หุ่นแบบ real-time ─────────────────────
    // หุ่นจะอัพเดท PID ทันทีโดยไม่ต้องรีสตาร์ท
    // plot ใน Data Viewer จะเห็น cur (heading จริง) vs tgt (เป้าหมาย)

    /**
     * ส่ง Kp เดินตรง ไปให้หุ่น (default 15.0 — ลดถ้าสั่น)
     */
    //% block="จูน Kp เดินตรง %kp"
    //% kp.defl=15.0
    //% group="Tune" weight=59
    export function tuneKpStraight(kp: number): void {
        radio.sendValue("kp_s", kp)
    }

    /**
     * ส่ง Ki เดินตรง ไปให้หุ่น (default 0.01 — เพิ่มถ้า drift)
     */
    //% block="จูน Ki เดินตรง %ki"
    //% ki.defl=0.01
    //% group="Tune" weight=58
    export function tuneKiStraight(ki: number): void {
        radio.sendValue("ki_s", ki)
    }

    /**
     * ส่ง Kd เดินตรง ไปให้หุ่น (default 3.0 — เพิ่มถ้าตอบสนองช้า)
     */
    //% block="จูน Kd เดินตรง %kd"
    //% kd.defl=3.0
    //% group="Tune" weight=57
    export function tuneKdStraight(kd: number): void {
        radio.sendValue("kd_s", kd)
    }

    /**
     * ส่ง Kp หมุน ไปให้หุ่น (default 8.0 — ลดถ้า overshoot)
     */
    //% block="จูน Kp หมุน %kp"
    //% kp.defl=8.0
    //% group="Tune" weight=56
    export function tuneKpTurn(kp: number): void {
        radio.sendValue("kp_t", kp)
    }

    /**
     * ส่ง Ki หมุน ไปให้หุ่น (default 0.0)
     */
    //% block="จูน Ki หมุน %ki"
    //% ki.defl=0.0
    //% group="Tune" weight=55
    export function tuneKiTurn(ki: number): void {
        radio.sendValue("ki_t", ki)
    }

    /**
     * ส่ง Kd หมุน ไปให้หุ่น (default 0.5 — เพิ่มถ้า overshoot)
     */
    //% block="จูน Kd หมุน %kd"
    //% kd.defl=0.5
    //% group="Tune" weight=54
    export function tuneKdTurn(kd: number): void {
        radio.sendValue("kd_t", kd)
    }
}
