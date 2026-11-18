# Aufbau der .jkcfg-Datei (JK-BMS-App „Export Params.“, PB-Serie, FW 19.27)

Ermittelt am 19.11.2026 durch Vergleich von Exporten vor/nach Änderungen in der App (JK-PB2A16S20P, HW 19A). **Angaben ohne Gewähr** – „Vermutung“ = noch nicht durch gezielte Änderung bestätigt.

Die Datei (600 Byte) enthält zwei Datenblöcke im JK02-Format, je 300 Byte, beginnend mit `55 AA EB 90`, letztes Byte = Prüfsumme (Summe der Bytes davor, mod 256).

## Block 1 (Byte 0–299): Einstellungen (Typ 0x01)

Alle Werte little-endian, 4 Byte; Spannungen in mV, Ströme in mA, Temperaturen in 0,1 °C.

| Offset | Wert | Offset | Wert |
|---|---|---|---|
| 6 | Smart Sleep Volt. | 78 | Max Balance Cur. |
| 10 / 14 | Cell UVP / UVPR | 82 / 86 | Charge OTP / OTPR |
| 18 / 22 | Cell OVP / OVPR | 90 / 94 | Discharge OTP / OTPR |
| 26 | Balance Trig. Volt. | 98 / 102 | Charge UTP / UTPR |
| 30 / 34 | SOC-100 % / SOC-0 % Volt. | 106 / 110 | MOS OTP / OTPR |
| 38 / 42 | Vol. Cell RCV / RFV | 114 | Cell Count |
| 46 | Power Off Vol. | 118 / 122 / 126 | Laden / Entladen / Balancer (Schalter) |
| 50 / 54 / 58 | Max Charge Cur. / OCP Delay / OCPR | 130 | Battery Capacity (mAh) |
| 62 / 66 / 70 | Max Discharge Cur. / OCP Delay / OCPR | 134 | SCP Delay |
| 74 | SCPR Time | 138 | Start Balance Volt. |
| 270 | Device Addr. | 283 | Bitfeld, u. a. Charging Float Mode |
| 286 | Time Smart Sleep (h) | | |

## Block 2 (Byte 300–599): Geräteinfo (Typ 0x03) – Offsets relativ zu Byte 300

| Offset | Wert | Status |
|---|---|---|
| 6 / 22 / 30 | Modell / HW / SW (Text) | sicher |
| 38 / 42 | Laufzeit (s) / Einschaltzähler | sicher |
| 46 | Seriennummer (Text) | sicher |
| 184 / 185 | UART1- / CAN-Protokoll | laut Add-on |
| 234 / 235 / 236 | LCD-Buzzer- / DRY1- / DRY2-Auslöser (Code) | sicher (9 / 8 / 0) |
| 238 / 242 | LCD-Buzzer Trigger / Release Val (u32) | sicher (100 / 95) |
| 246 / 250 | DRY1 Trigger / Release Val (u32) | sicher (60 / 50) |
| 254 / 258 | DRY2 Trigger / Release Val (u32) | sicher |
| 262 | Data Stored Period (u16, s) | Vermutung (3600) |
| **266** | **RCV Time (0,1 h)** | **sicher** (5 → 30 bei 0,5 → 3,0 h) |
| 267 | RFV Time (0,1 h) | laut Add-on (50 = 5,0 h) |
| 268 | Re-Bulk SOC (%) | Vermutung (1) |
| 269 | Emerg. Time (min) | Vermutung (30) |
| 237, 270–272 | unbekannt (1, 15, 3, 164) | offen |
| 289–291 | ändern sich bei jedem Export (Uhr/Zähler) | keine Einstellung |

Nicht gefunden: UART2/UART3-Protokoll.

## In Home Assistant

Das Add-on [jkbms-rs485-addon](https://github.com/Xander2980/jkbms-rs485-addon) liest Block 2 nur im **Active-Polling-Modus** (`bms_broadcasting: false`) und legt dann u. a. `number.<p>_bms_request_charge_voltage_time` (RCV Time), `…_request_float_voltage_time` (RFV Time), LCD-Buzzer- und DRY-Werte an. Die Karte zeigt diese Werte im Bereich „BMS-Einstellungen“ automatisch, sobald es sie gibt. Im Broadcast-Modus stehen sie in der Hinweiszeile „Nur in der JK-App“.
