heading_accumulation_error = 0
is_turning = False
MPU_ADDR = 104
target_servo_angle = 75
current_servo_angle = 75
last_time = input.running_time()
Kp = 15.0
Ki = 0.01
Kd = 3.0
target_heading = 0
current_heading = 0
integral = 0
last_error = 0
speed_y = 0
sum2 = 0
samples = 0
gyro_z_offset = 0
correction = 0
gyro_z_raw = 0
current_time = 0
dt = 0
gyro_z_dps = 0
error = 0
derivative = 0
left_motor = 0
right_motor = 0
final_M3_Left = 0
final_M1_Right = 0
def initAndCalibrateIMU():
    global sum2, samples, gyro_z_offset
    pins.i2c_write_number(MPU_ADDR, 27392, NumberFormat.UINT16_BE, False)
    basic.show_icon(IconNames.ASLEEP)
    music.play_tone(131, music.beat(BeatFraction.QUARTER))
    sum2 = 0
    samples = 200
    for index in range(samples):
        pins.i2c_write_number(MPU_ADDR, 71, NumberFormat.UINT8_BE, True)
        sum2 += pins.i2c_read_number(MPU_ADDR, NumberFormat.INT16_BE, False)
        basic.pause(5)
    gyro_z_offset = sum2 / samples
    basic.show_icon(IconNames.HAPPY)
    music.play_tone(523, music.beat(BeatFraction.EIGHTH))
def robotStop():
    global speed_y, is_turning, correction
    speed_y = 0
    is_turning = False
    correction = 0
def moveStraight(speed: number, duration_ms: number):
    global is_turning, target_heading, integral, last_error, speed_y
    is_turning = False
    target_heading = current_heading
    integral = 0
    last_error = 0
    speed_y = 0 - speed
    basic.pause(duration_ms)
    robotStop()
def turnDegrees(degrees: number):
    global target_heading, integral, last_error, is_turning, heading_accumulation_error
    robotStop()
    basic.pause(200)
    compensated_degrees = degrees + heading_accumulation_error
    target_heading = current_heading + (0 - compensated_degrees)
    integral = 0
    last_error = 0
    is_turning = True
    while abs(target_heading - current_heading) > 15:
        basic.pause(10)
    integral = 0
    last_error = 0
    while abs(target_heading - current_heading) > 0.5:
        basic.pause(10)
    heading_accumulation_error = target_heading - current_heading
    robotStop()
    basic.pause(200)
def closeGripper():
    global target_servo_angle
    target_servo_angle = 40
def openGripper():
    global target_servo_angle
    target_servo_angle = 75
radio.set_group(67)
initAndCalibrateIMU()
SuperBit.servo2(SuperBit.enServo.S5, current_servo_angle)

def on_every_interval():
    global current_servo_angle
    if current_servo_angle < target_servo_angle:
        current_servo_angle += 1
        SuperBit.servo2(SuperBit.enServo.S5, current_servo_angle)
    elif current_servo_angle > target_servo_angle:
        current_servo_angle -= 1
        SuperBit.servo2(SuperBit.enServo.S5, current_servo_angle)
loops.every_interval(10, on_every_interval)

def on_every_interval2():
    global gyro_z_raw, current_time, dt, last_time, gyro_z_dps, current_heading, error, integral, derivative, correction, last_error, target_heading
    pins.i2c_write_number(MPU_ADDR, 71, NumberFormat.UINT8_BE, True)
    gyro_z_raw = pins.i2c_read_number(MPU_ADDR, NumberFormat.INT16_BE, False)
    current_time = input.running_time()
    dt = (current_time - last_time) / 1000
    last_time = current_time
    gyro_z_dps = (gyro_z_raw - gyro_z_offset) / 131
    gyro_threshold = 0.3 if is_turning else 1.0
    if abs(gyro_z_dps) > gyro_threshold:
        current_heading += gyro_z_dps * dt
    if is_turning or speed_y != 0:
        error = target_heading - current_heading
        integral += error * dt
        if is_turning:
            integral = 0
        else:
            integral = Math.constrain(integral, -50, 50)
        derivative = (error - last_error) / dt
        current_Kp = 8.0 if is_turning else Kp
        current_Kd = 0.5 if is_turning else Kd
        correction = error * current_Kp + integral * Ki + derivative * current_Kd
        if is_turning:
            turn_error = abs(target_heading - current_heading)
            if turn_error > 15:
                correction = Math.constrain(correction, -130, 130)
            else:
                correction = Math.constrain(correction, -70, 70)
        last_error = error
    else:
        correction = 0
        integral = 0
        last_error = 0
        target_heading = current_heading
loops.every_interval(10, on_every_interval2)

def on_every_interval3():
    radio.send_value("cur", Math.round(current_heading))
    radio.send_value("tgt", Math.round(target_heading))
loops.every_interval(100, on_every_interval3)

def on_forever():
    global left_motor, right_motor, final_M3_Left, final_M1_Right
    if is_turning:
        left_motor = correction
        right_motor = 0 - correction
    else:
        left_motor = speed_y + correction
        right_motor = speed_y - correction
    final_M3_Left = 0 - left_motor
    final_M1_Right = 0 - right_motor
    if is_turning:
        if final_M3_Left > 0 and final_M3_Left < 55:
            final_M3_Left = 55
        if final_M3_Left < 0 and final_M3_Left > -55:
            final_M3_Left = -55
        if final_M1_Right > 0 and final_M1_Right < 55:
            final_M1_Right = 55
        if final_M1_Right < 0 and final_M1_Right > -55:
            final_M1_Right = -55
    final_M3_Left = Math.constrain(final_M3_Left, -255, 255)
    final_M1_Right = Math.constrain(final_M1_Right, -255, 255)
    SuperBit.motor_run(SuperBit.enMotors.M3, final_M3_Left)
    SuperBit.motor_run(SuperBit.enMotors.M1, final_M1_Right)
basic.forever(on_forever)

def on_received_value(name, value):
    if name == "cmd":
        if value == 1:
            turnDegrees(90)
        if value == 2:
            moveStraight(150, 3000)
        if value == 3:
            robotStop()
radio.on_received_value(on_received_value)

def on_button_pressed_a():
    moveStraight(150, 50000)
input.on_button_pressed(Button.A, on_button_pressed_a)

def on_button_pressed_b():
    turnDegrees(90)
    turnDegrees(90)
    turnDegrees(90)
    turnDegrees(90)
input.on_button_pressed(Button.B, on_button_pressed_b)
