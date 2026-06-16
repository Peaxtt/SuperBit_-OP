radio.set_group(67)

def on_received_value(name, value):
    serial.write_value(name, value)
radio.on_received_value(on_received_value)

# กด A = สั่งหุ่นเลี้ยวขวา 90

def on_button_pressed_a():
    radio.send_value("cmd", 1)
    basic.show_string("T")
input.on_button_pressed(Button.A, on_button_pressed_a)

# กด B = สั่งหุ่นเดินตรง 3 วิ

def on_button_pressed_b():
    radio.send_value("cmd", 2)
    basic.show_string("G")
input.on_button_pressed(Button.B, on_button_pressed_b)

# กด A+B = หยุด

def on_button_pressed_ab():
    radio.send_value("cmd", 3)
    basic.show_string("X")
input.on_button_pressed(Button.AB, on_button_pressed_ab)
