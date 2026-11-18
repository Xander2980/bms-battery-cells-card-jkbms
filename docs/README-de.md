[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz/docs/faq/custom_repositories/)
[![HACS validation](https://img.shields.io/github/actions/workflow/status/Xander2980/bms-battery-cells-card-jkbms/validate.yml?label=HACS%20Validation)](https://github.com/Xander2980/bms-battery-cells-card-jkbms/actions?query=workflow%3Avalidate)
[![GitHub release](https://img.shields.io/github/release/Xander2980/bms-battery-cells-card-jkbms?include_prereleases=&sort=semver&color=blue)](https://github.com/Xander2980/bms-battery-cells-card-jkbms/releases/)
![Downloads](https://img.shields.io/github/downloads/Xander2980/bms-battery-cells-card-jkbms/total?label=Downloads&color=blue)
![last commit](https://img.shields.io/github/last-commit/Xander2980/bms-battery-cells-card-jkbms)
[![README English](https://img.shields.io/badge/README-Eng-orange)](https://github.com/Xander2980/bms-battery-cells-card-jkbms/blob/main/README.md)
[![stars](https://img.shields.io/github/stars/Xander2980/bms-battery-cells-card-jkbms)](https://github.com/Xander2980/bms-battery-cells-card-jkbms/stargazers)

# BMS Battery Cells Card – JK-BMS-Fork

Fork der [BMS Battery Cells Card](https://github.com/jayjojayson/bms-battery-cells-card) von jayjojayson (Stand v_2.0), erweitert für das **JK-BMS** mit dem Add-on [jkbms-rs485-addon](https://github.com/jean-luc1203/jkbms-rs485-addon).

**Kartentyp:** `custom:bms-battery-cells-card-jkbms` – eigener Name und eigene Datei (`bms-battery-cells-card-jkbms.js`), die Original-Karte kann parallel installiert bleiben.

## Zusätzlich gegenüber dem Original

| Funktion | Beschreibung |
|---|---|
| **Automatik per Präfix** | `jk_prefix: bms_master` (bzw. `bms_1`, `bms_2` …) setzt Zellen (Anzahl wird erkannt), Zellwiderstände und alle Sensoren automatisch. Selbst eingetragene Werte haben Vorrang. |
| **Alarm-Banner** | Grün „Keine Alarme“ bzw. rot pulsierend mit Alarmtext (`alarm_entity`, `alarm_list_entity`). In der Standardansicht erscheint bei Alarm ein rotes Symbol im Kopf. |
| **Ladephase** | Bulk / Absorption / Float mit Dauer (`charge_status_entity`, `charge_status_time_entity`). |
| **Temperaturfühler 1–4** | `temp_entity`, `temp_2_entity`, `temp_3_entity`, `temp_4_entity` als eigene Zeile. |
| **Zellwiderstände** | Anzeige in mΩ, höchster Widerstand orange markiert. |
| **Durchsatz & Laufzeit** | `throughput_entity` (Ah gesamt), `runtime_entity`. |
| **Sichere Status-Anzeige** | Mit Präfix zeigen Laden/Entladen/Balance die `binary_sensor`-Zustände – ein Klick schaltet das BMS **nicht** ab. Wer schalten will, trägt `stat_charge_entity` usw. selbst ein. |

Neue Optionen: `jk_prefix`, `show_jk_info` (Standard `true`), `alarm_entity`, `alarm_list_entity`, `charge_status_entity`, `charge_status_time_entity`, `temp_2_entity`, `temp_3_entity`, `temp_4_entity`, `throughput_entity`, `runtime_entity`.

### Beispiel

```yaml
type: custom:bms-battery-cells-card-jkbms
title: Master BMS
jk_prefix: bms_master
show_detailed_view: true
show_status: true
balance_led: true
```

### Installation (HACS, benutzerdefiniertes Repository)

Direkt in Home Assistant öffnen:

[![In HACS öffnen](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Xander2980&repository=bms-battery-cells-card-jkbms&category=plugin)

Oder von Hand:

1. HACS → ⋮ → Benutzerdefinierte Repositories → `https://github.com/Xander2980/bms-battery-cells-card-jkbms`, Typ **Dashboard** → Hinzufügen.
2. „BMS Battery Cells Card (JK-BMS)“ herunterladen, Browser neu laden.
3. Karte `custom:bms-battery-cells-card-jkbms` verwenden.

> Hinweis: Das Repository gehört in **HACS**, nicht unter Einstellungen → Apps → Repositories – dort erscheint sonst „is not a valid app repository“.

Erwartete Entitäten (Präfix `p`): `sensor.p_bms_cell_N_volt`, `sensor.p_bms_cell_N_ohm`, `sensor.p_bms_soc_pourcentage`, `sensor.p_bms_sonde_1..4_temp`, `sensor.p_bms_charge_status_text`, `binary_sensor.p_p_alarm_active`, `sensor.p_p_alarm_list` usw.

---

# BMS Battery Cells Card

Visualisierung der Einzelzellenspannungen deines Batteriespeichersystems (BMS)

Die 🔋 **BMS Battery Cells Card** ist eine benutzerdefinierte Lovelace-Karte zur Visualisierung der einzelnen Zellspannungen deines Batteriespeichers (BMS). Sie bietet eine übersichtliche Darstellung des Zustands aller Zellen, inklusive Min/Max-Werten und Balancing-Status.

Die Karte ist vollständig über die Benutzeroberfläche des Karteneditors konfigurierbar.
Du benötigst die entsprechenden Entitäten deines BMS (z.B. Victron, JK-BMS, Daly), die die Zellspannungen in Home Assistant bereitstellen.
Es funktionieren natürlich auch normale Batterien (AGM und Co mit 12, 24v oder 48v) soweit ihr dafür Entitäten in HA erhaltet.

Wenn euch die custom Card gefällt, würde ich mich sehr über eine Sternebewertung ⭐ freuen. Danke 🤗

## Features

### 📊 **Visualisierung & Layouts**

- **Einzelzellspannungen:** Balkendiagramme mit dynamischen Farbschwellen (Min/Max/Avg)
- **Verschiedene Layout-Modi:**
  - 📏 **Standardansicht:** Klassische Balkenansicht
  - 📋 **Tabellenansicht:** Kompaktes Raster nur mit Zahlenwerten (ohne Balken)
  - 📃 **Listenansicht:** Horizontales Layout für eine listenartige Darstellung
  - 🎛️ **Detailansicht:** Ein vollständiges BMS-Dashboard
- **Kompaktmodus:** Option, die Balken auszublenden und nur Header-Statistiken anzuzeigen
- **Animationen:** Lade- (Power in) und Entladeanimationen (Power out) auf den Zellbalken

### 📈 **Detaillierte Ansicht (optional)**

- **Integrierte Diagramme:** Live-Verlaufsgrafiken für **Gesamtspannung** und **Zelldelta** (via Chart.js)
- **Erweiterte BMS-Metriken:** Anzeige von **SoH**, **Ladezyklen**, **Kapazität** (Ah) und **MOS-Temperatur**
- **Restkapazität:** Automatische Berechnung basierend auf der Batteriekapazität (Ah) und dem SoC
- **Zellliste:** Detaillierte Tabelle aller Einzelzellspannungen inklusive individuellem Balancing-Status
- **Hybrid-Ansicht:** Option, die Standard-Zellbalken zusätzlich _innerhalb_ der Detailansicht anzuzeigen

### ⚡ **BMS Steuerung & Interaktion**

- **Interaktive Statusschalter:** Steuerung von **Laden**, **Entladen** und **Balancing** direkt aus der Karte (unterstützt Switches, Input Booleans und Input Selects)
- **Benutzerdefinierte Zustandslogik:** Definition eigener Werte für "Ein" und "Aus" Status (z. B. `True`/`False`, `On`/`Off`, `Balancing`)
- **Balance-Schalter:** Für BMS wie Seplos, TDT, Daily oder JBD
- **Balance-Sensor:** Definiere einen Balance-Sensor für jede Zelle (wie JK-BMS)
- **Klick-Aktionen:** Ein Klick auf Sensoren, Diagramme oder Zellen öffnet den standard Home Assistant "More Info" Dialog

### 📉 **Statistiken & Überwachung**

- **Echtzeit-Statistiken:** Gesamtspannung, Strom, Leistung (Watt) und Temperatur
- **Smarte Delta-Berechnung:** Berechnet automatisch den Uterschied zwischen Min- und Max-Zellen (oder nutzt einen externen Sensor)
- **Min/Max Indikatoren:** Visuelle Hervorhebung der Zellen mit der höchsten und niedrigsten Spannung
- **Durchschnittsspannung:** Option zur Anzeige der berechneten durchschnittlichen Zellspannung

### ⚙️ **Konfiguration & Anpassung**

- **UI Editor:** Vollständig konfigurierbar über den Home Assistant UI-Editor (kein YAML erforderlich)
- **Grenzwerte:** Einstellbare Minimal- und Maximalspannung für die Farbskalierung
- **Optische Anpassungen:** Optionen für dickere Rahmen, Ausblenden von Header-Werten und vieles mehr

standard-view:

<img width="48%" height="auto" alt="image" src="https://github.com/Xander2980/bms-battery-cells-card-jkbms/blob/main/docs/bms-battery-cells-card.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/Xander2980/bms-battery-cells-card-jkbms/blob/main/docs/bms-battery-cells-card2.png" />  
<img width="96%" height="auto" alt="image" src="https://github.com/Xander2980/bms-battery-cells-card-jkbms/blob/main/docs/bms-battery-cells-card_big.png" />
<img width="48%" height="auto" alt="image" src="https://github.com/Xander2980/bms-battery-cells-card-jkbms/blob/main/docs/bms-battery-cells-card-compact-2.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/Xander2980/bms-battery-cells-card-jkbms/blob/main/docs/bms-battery-cells-card-compact.png" />  
<img width="48%" height="auto" alt="image" src="https://github.com/Xander2980/bms-battery-cells-card-jkbms/blob/main/docs/bms-battery-cells-card_one_cell.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/Xander2980/bms-battery-cells-card-jkbms/blob/main/docs/bms-battery-cells-card-ani.gif" />

---

detailed view:

<img width="96%" height="auto" alt="image" src="https://github.com/Xander2980/bms-battery-cells-card-jkbms/blob/main/docs/bms-battery-cells-card-detailed-view.png" />

---

## Installation

### HACS (Empfohlen)

- Das github über den Link in Home Assistant einfügen.

  [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Xander2980&repository=bms-battery-cells-card-jkbms&category=plugin)

- Die "BMS Battery Cells Card (JK-BMS)" sollte nun in HACS verfügbar sein. Klicke auf "INSTALLIEREN" ("INSTALL").
- Die Ressource wird automatisch zu deiner Lovelace-Konfiguration hinzugefügt.

<details>
  <summary> <b>Manuelle Installation über Hacs</b></summary>

### Manuelle Installation über Hacs

Öffne HACS in Home Assistant.

- Klicke auf die drei Punkte in der oberen rechten Ecke.
- Wähle "Benutzerdefinierte Repositories" ("Custom repositories") aus.
- Füge `https://github.com/Xander2980/bms-battery-cells-card-jkbms` hinzu und wähle "Dashboard" als Typ.
- Klicke auf "HINZUFÜGEN" ("ADD").
- Die "BMS Battery Cells Card (JK-BMS)" sollte nun in HACS verfügbar sein. Klicke auf "INSTALLIEREN" ("INSTALL").
- Die Ressource wird automatisch zu deiner Lovelace-Konfiguration hinzugefügt.
</details>

<details>
  <summary> <b>Manuelle Installation in HA</b></summary>  
 
### Manuelle Installation in HA
1.  **Dateien herunterladen:**
    * Lade die `dist/bms-battery-cells-card-jkbms.js` aus diesem Repository herunter.

2.  **Dateien in Home Assistant hochladen:**
    - Erstelle einen neuen Ordner namens `bms-battery-cells-card-jkbms` im `www/community`-Verzeichnis deiner Home Assistant-Konfiguration. (Das `www`-Verzeichnis befindet sich im selben Ordner wie deine `configuration.yaml`).
    - Kopiere **alle heruntergeladenen Dateien** in diesen neuen Ordner. Deine Ordnerstruktur sollte wie folgt aussehen:
      ```
      /config/www/community/bms-battery-cells-card-jkbms/bms-battery-cells-card-jkbms.js
      ```

3.  **Ressource zu Home Assistant hinzufügen:**
_ Gehe in Home Assistant zu **Einstellungen > Dashboards**.
_ Klicke auf das Menü mit den drei Punkten oben rechts und wähle **Ressourcen**.
_ Klicke auf **+ Ressource hinzufügen**.
_ Gebe als URL `/local/community/bms-battery-cells-card-jkbms/bms-battery-cells-card-jkbms.js` ein.
_ Wähle als Ressourcentyp **JavaScript-Modul**.
_ Klicke auf **Erstellen**.
</details>

---

## Konfiguration

Nach der Installation kannst du die Karte zu deinem Dashboard hinzufügen:

1.  **Bearbeitungsmodus aktivieren:**
    - Öffne das Dashboard, zu dem die Karte hinzufügt werden soll, und klicke auf **Bearbeiten**.

2.  **Karte hinzufügen:**
    - Klicke auf **+ Karte hinzufügen** und suche nach der **"BMS Battery Cells Card"**.

3.  **Optionen konfigurieren:**
    - Ein Konfigurationsfenster wird angezeigt, in dem alle Einstellungen bequem angepasst werden können.
    - **BMS Entity:** Die Hauptentitäten oder Liste der Sensoren.
    - **Voltage Range:** Definiere Min und Max Spannung für die grafische Darstellung.
    - **Details:** Blende Zusatzwerte wie Battery Power, Temp, Drif oder Durschnittsspannung an.

---

## YAML-Modus (Alternative)

Obwohl die UI-Konfiguration empfohlen wird, kann die Karte auch manuell über den YAML-Editor konfiguriert werden:

### Optionen

| name                      | typ       | erforderlich | Beschreibung                                                    | Standard            |
| ------------------------- | --------- | ------------ | --------------------------------------------------------------- | ------------------- |
| `type`                    | `string`  | Ja           | Kartentyp. Muss `custom:bms-battery-cells-card-jkbms` sein.           |                     |
| `title`                   | `string`  | Nein         | Titel, der oben in der Karte angezeigt wird. Ohne Titel wird ein Standardtitel in der Home-Assistant-Sprache verwendet. | z. B. `"Batterie Zellen"` |
| `cells`                   | `list`    | Ja           | Liste der Zellen (jeweils mit Entität und optionalem Namen).    | 4 Beispiel-Zellen   |
| `cells[].entity`          | `string`  | Ja           | Sensor-Entität der Zellspannung.                                |                     |
| `cells[].name`            | `string`  | Nein         | Anzeigename der Zelle.                                          | Zell-Index          |
| `show_legend`             | `boolean` | Nein         | Zeigt die Spannungs-Skala (Y-Achse) auf der linken Seite an.    | `true`              |
| `container_padding`       | `number`  | Nein         | Innenabstand des Karten-Containers in Pixeln.                   | `16`                |
| `card_height`             | `number`  | Nein         | Feste Höhe der Karte in Pixeln.                                 | `380`               |
| `cell_gap`                | `number`  | Nein         | Abstand zwischen einzelnen Zellen in Pixeln.                    | `4`                 |
| `show_values`             | `boolean` | Nein         | Zeigt die exakten Zellspannungen als Text an.                   | `true`              |
| `show_values_on_top`      | `boolean` | Nein         | Zeigt Statistikwerte oberhalb der Icons an.                     | `false`             |
| `enable_animations`       | `boolean` | Nein         | Aktiviert Lade- und Entlade-Animationen.                        | `true`              |
| `min_voltage`             | `number`  | Nein         | Minimale Zellspannung für die Skalierung.                       | `2.60`              |
| `max_voltage`             | `number`  | Nein         | Maximale Zellspannung für die Skalierung.                       | `3.65`              |
| `show_min_max`            | `boolean` | Nein         | Markiert die Zellen mit minimaler und maximaler Spannung.       | `true`              |
| `show_average`            | `boolean` | Nein         | Zeigt die durchschnittliche Zellspannung in den Statistiken an. | `false`             |
| `cell_background_color`   | `string`  | Nein         | Zell Hintergrundfarbe: `gradient` oder CSS-Farbwert.            | `gradient`          |
| `cell_background_opacity` | `number`  | Nein         | Zellhintergrund-Opacity (0.0-1.0).                              | `0.25`              |
| `cell_bar_color`          | `string`  | Nein         | Balkenfarbe: `range`, `delta` oder HEX-Farbwert (custom).       | `range`             |
| `cell_bar_opacity`        | `number`  | Nein         | Balken-Opacity (0.0-1.0).                                       | `0.6`               |
| `cell_bar_top_color`      | `string`  | Nein         | Balken-Oberfarbe für `delta` (Hex).                             | `#173117`           |
| `cell_bar_bottom_color`   | `string`  | Nein         | Balken-Unterfarbe für `delta` (Hex).                            | `#3c2222`           |
| `soc_entity`              | `string`  | Nein         | Sensor-Entität für den Ladezustand (SoC).                       |                     |
| `watt_entity`             | `string`  | Nein         | Leistungs-Sensor (positiv = Laden, negativ = Entladen).         |                     |
| `cell_diff_sensor`        | `string`  | Nein         | Sensor für die Zellspannungs-Abweichung (`mV` oder `V`, Erkennung über die Einheit). |                     |
| `temp_entity`             | `string`  | Nein         | Sensor-Entität für die Batterietemperatur (`°C`, `°F` oder `K`, wie von Home Assistant gemeldet). |                     |
| `temp_mos_entity`         | `string`  | Nein         | MOSFET-Temperatursensor (Detailansicht, Einheit wie von Home Assistant gemeldet). |                     |
| `cells[].resistance_entity` | `string` | Nein       | Widerstands-Sensor je Zelle, wird in der Zellliste angezeigt (Detailansicht). |                     |
| `show_title_in_detail`    | `boolean` | Nein         | Zeigt den Kartentitel `title` in der Detailansicht an.          | `true`              |
| `show_status`             | `boolean` | Nein         | Detailansicht: Gesamtstatus (Laden / Entladen / Balancing / Leerlauf), abgeleitet aus Leistung/Strom und Balancing-Status. | `false` |
| `balance_led`             | `boolean` | Nein         | Detailansicht: Zell-Balancing als LED statt „bal. on / bal. off“ anzeigen. | `false`      |
| `stat_heater_entity`      | `string`  | Nein         | Detailansicht: Heizungs-Schalter / input_boolean / select, neben Laden, Entladen und Balance. |  |
| `stat_heater_on` / `stat_heater_off` | `string` | Nein | Eigene EIN/AUS-Werte für die Heizungs-Entität (z. B. bei Selects). |                     |

> **Einheiten:** Temperaturen werden in der Einheit der Entität angezeigt (`°C`/`°F`/`K`). Zellspannungen und das Zelldelta werden anhand der `unit_of_measurement` des Sensors (`V`/`mV`) normalisiert; Sensoren ohne Einheit werden weiterhin automatisch erkannt.

### Beispielkonfiguration

Einfaches Beispiel:

```yaml
type: custom:bms-battery-cells-card-jkbms
title: Batterie Zellen
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
  - entity: sensor.cell_3
    name: "3"
  - entity: sensor.cell_4
    name: "4"
```

Erweitertes Beispiel:

```yaml
type: custom:bms-battery-cells-card-jkbms
cells:
  - name: "1"
    entity: sensor.vrm_maximum_cell_voltage_batt_1
  - name: "2"
    entity: sensor.vrm_minimum_cell_voltage_batt_1
  - name: "3"
    entity: sensor.vrm_maximum_cell_voltage_batt_2
  - name: "4"
    entity: sensor.vrm_minimum_cell_voltage_batt_2
soc_entity: sensor.victron_system_battery_soc
watt_entity: sensor.vrm_battery_power_batt_1024
cell_background_color: "gradient"
cell_background_opacity: 0.28
cell_bar_color: "delta"
cell_bar_opacity: 0.75
cell_bar_top_color: "#13a826"
cell_bar_bottom_color: "#941414"
cell_diff_sensor: sensor.vrm_minimum_cell_voltage_batt_1
temp_entity: sensor.vrm_battery_temperature_batt_1
show_values_on_top: false
enable_animations: true
title: Batterie Zellen
thicker_borders: true
min_voltage: 2.6
max_voltage: 3.65
show_average: false
```

---

### CSS Elements

| Selector            | Description                               |
| :------------------ | :---------------------------------------- |
| `.header`           | Kopfbereich der Karte.                    |
| `.card-header`      | Header mit Titel und Statistiken.         |
| `.title`            | Karten-Titel.                             |
| `.stats`            | Container für Statistikwerte.             |
| `.stat-item`        | Einzelner Statistikblock.                 |
| `.stat-label`       | Beschriftung der Statistik.               |
| `.stat-value-row`   | Zeile mit Icon und Wert.                  |
| `.vertical-layout`  | Vertikale Anordnung von Icon/Wert.        |
| `.main-container`   | Hauptcontainer der Zellen.                |
| `.cells-container`  | Container für alle Zell-Elemente.         |
| `.legend-col`       | Spannungs-Skala (Y-Achse).                |
| `.cell-wrapper`     | Wrapper einer einzelnen Zelle.            |
| `.cell-item`        | Einzelne Batteriezelle.                   |
| `.min-cell`         | Markierung der Zelle mit Minimalspannung. |
| `.max-cell`         | Markierung der Zelle mit Maximalspannung. |
| `.custom-tooltip`   | Tooltip bei Klick / Hover.                |
| `.cell-track-bg`    | Hintergrund mit Farbverlauf.              |
| `.cell-bar`         | Spannungs-Balken.                         |
| `.is-charging`      | Lade-Animation aktiv.                     |
| `.is-discharging`   | Entlade-Animation aktiv.                  |
| `.charging-overlay` | Animiertes Overlay.                       |
| `.cell-info-layer`  | Overlay für Labels.                       |
| `.cell-name-wrap`   | Container für Zellnamen.                  |
| `.cell-name-badge`  | Badge mit Zellnamen.                      |
| `.cell-val-wrap`    | Container für Spannungswert.              |
| `.cell-val-badge`   | Spannungs-Anzeige.                        |
| `.cell-voltage`     | Kennzeichnung Spannungswert.              |
| `ha-card`           | Home Assistant Kartencontainer.           |
| `ha-icon`           | Icons in Statistikbereich.                |

Header & Titel anpassen

```yaml
type: custom:bms-battery-cells-card-jkbms
title: Batterie Zellen
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
card_mod:
  style: |
    .title {
      font-size: 1.6rem;
      font-weight: 600;
      color: #00e676;
    }
    .header.card-header {
      border-bottom: 1px solid rgba(0,224,118,0.3);
    }
```

Min-/Max-Zellen hervorheben

```yaml
type: custom:bms-battery-cells-card-jkbms
title: Batterie Zellen
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
card_mod:
  style: |
    .cell-wrapper.min-cell {
      border: 2px solid #2196f3;
      box-shadow: 0 0 12px rgba(33,150,243,0.8) inset;
    }

    .cell-wrapper.max-cell {
      border: 2px solid #f44336;
      box-shadow: 0 0 12px rgba(244,67,54,0.8) inset;
    }
```

Zellnamen dezenter darstellen

```yaml
type: custom:bms-battery-cells-card-jkbms
title: Batterie Zellen
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
card_mod:
  style: |
    .cell-name-badge {
      background: rgba(255,255,255,0.08);
      color: #e0e0e0;
      font-weight: 500;
      letter-spacing: 0.4px;
    }
```

Tooltip Design anpassen (Touch, Hover)

```yaml
type: custom:bms-battery-cells-card-jkbms
title: Batterie Zellen
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
card_mod:
  style: |
    .cell-name-badge {
      background: rgba(255,255,255,0.08);
      color: #e0e0e0;
      font-weight: 500;
      letter-spacing: 0.4px;
    }
```
