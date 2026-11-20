import de from './lang-de.js';
import en from './lang-en.js';
import fr from './lang-fr.js';
import gr from './lang-gr.js';
import './chart.umd.min.js';

// Helper um LitElement sicher zu laden
const LitElement = customElements.get("ha-lit-element") || Object.getPrototypeOf(customElements.get("home-assistant-main"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

// JK-BMS-Fork: eigener Elementname, damit die Original-Karte parallel installiert bleiben kann
const CARD_TAG = "bms-battery-cells-card-jkbms";
const EDITOR_TAG = "bms-battery-cells-card-jkbms-editor";
const CARD_VERSION = "v_2.1-jk.7";

// Entitäten-Schema des JK-BMS-RS485-Add-ons (Fork Xander2980/jkbms-rs485-addon ab 4.2, Original jean-luc1203),
// Präfix z. B. "bms_master". "{p}" = Präfix. Selbst konfigurierte Werte haben immer Vorrang.
// Ein Array = Kandidaten in dieser Reihenfolge (erster vorhandener gewinnt).
const JK_MAP = {
  soc_entity: "sensor.{p}_bms_soc_pourcentage",
  // Fork 4.2: Leistung mit Vorzeichen (+ Laden / − Entladen); sonst die alte Leistung ohne Vorzeichen
  watt_entity: ["sensor.{p}_bms_battery_power", "sensor.{p}_bms_puissance_totale"],
  total_voltage_entity: "sensor.{p}_bms_tension_totale_volt",
  total_current_entity: "sensor.{p}_bms_courant_total",
  // Zell-Delta direkt vom Add-on (sonst lädt die Karte den Verlauf aller Zellen und rechnet selbst)
  cell_diff_sensor: "sensor.{p}_bms_cell_voltage_delta",
  temp_entity: "sensor.{p}_bms_sonde_1_temp",
  temp_2_entity: "sensor.{p}_bms_sonde_2_temp",
  temp_3_entity: "sensor.{p}_bms_sonde_3_temp",
  temp_4_entity: "sensor.{p}_bms_sonde_4_temp",
  temp_5_entity: "sensor.{p}_bms_temp_sensor_5",
  temp_mos_entity: "sensor.{p}_bms_mos_temp",
  soh_entity: "sensor.{p}_bms_soh_pourcentage",
  capacity_entity: "sensor.{p}_bms_capacite_batterie_ah",
  cycle_capacity_entity: "sensor.{p}_bms_capacite_restante_ah",
  cycle_count_entity: "sensor.{p}_bms_nombre_cycle",
  throughput_entity: "sensor.{p}_bms_cycle_capacite_ah",
  runtime_entity: "sensor.{p}_bms_total_runtime_formatted",
  charge_status_entity: "sensor.{p}_bms_charge_status_text",
  charge_status_time_entity: "sensor.{p}_bms_charge_status_time_formatted",
  // Rohwerte in Sekunden: daraus formatiert die Karte selbst lesbar ("2 Min. 44 s")
  charge_status_seconds_entity: "sensor.{p}_bms_charge_status_time",
  runtime_seconds_entity: "sensor.{p}_bms_total_runtime",
  alarm_entity: "binary_sensor.{p}_{p}_alarm_active",
  alarm_list_entity: "sensor.{p}_{p}_alarm_list",
  // Nur Anzeige (binary_sensor ist nicht schaltbar) – ein versehentlicher Klick schaltet das BMS nicht ab
  stat_charge_entity: "binary_sensor.{p}_bms_switch_charge",
  stat_discharge_entity: "binary_sensor.{p}_bms_switch_decharge",
  stat_balance_entity: "binary_sensor.{p}_bms_balance_action",
  stat_heater_entity: "binary_sensor.{p}_bms_heating",
  // Fork 4.2: zusätzliche Werte
  balancer_status_entity: "sensor.{p}_bms_balancer_status_text",
  balance_current_entity: "sensor.{p}_bms_balance_courant",
  charger_entity: "binary_sensor.{p}_bms_charger_plugged",
  precharge_entity: "binary_sensor.{p}_bms_precharging",
  heating_current_entity: "sensor.{p}_bms_heating_current",
  battery_type_entity: "sensor.{p}_bms_battery_type_text",
  emergency_entity: "sensor.{p}_bms_emergency_countdown",
  prot_discharge_ocp_entity: "sensor.{p}_bms_discharge_ocp_release_timer",
  prot_discharge_scp_entity: "sensor.{p}_bms_discharge_scp_release_timer",
  prot_charge_ocp_entity: "sensor.{p}_bms_charge_ocp_release_timer",
  prot_charge_scp_entity: "sensor.{p}_bms_charge_scp_release_timer",
  prot_uv_entity: "sensor.{p}_bms_undervoltage_release_timer",
  prot_ov_entity: "sensor.{p}_bms_overvoltage_release_timer",
};
// Schutz-Freigabe-Timer: läuft einer (> 0 s), ist eine Schutzabschaltung aktiv
const JK_PROT = [
  ['emergency_entity', 'card.prot_emergency'],
  ['prot_discharge_ocp_entity', 'card.prot_discharge_ocp'],
  ['prot_discharge_scp_entity', 'card.prot_discharge_scp'],
  ['prot_charge_ocp_entity', 'card.prot_charge_ocp'],
  ['prot_charge_scp_entity', 'card.prot_charge_scp'],
  ['prot_uv_entity', 'card.prot_uv'],
  ['prot_ov_entity', 'card.prot_ov'],
];
// BMS-Einstellungen (number-Entitäten des Add-ons), Beschriftung wie in der JK-App.
// [Gruppe, App-Name, Entitäts-Endung, Endung Wiedereinschalten/zweiter Wert, Nachkommastellen]
const JK_SETTINGS = [
  ['volt', 'Vol. Cell RCV', 'cell_request_charge_voltage', null, 3],
  ['volt', 'Vol. Cell RFV', 'cell_request_float_voltage', null, 3],
  ['volt', 'SOC-100% Volt.', 'cell_soc100_voltage', null, 3],
  ['volt', 'SOC-0% Volt.', 'cell_soc0_voltage', null, 3],
  ['volt', 'Cell OVP / OVPR', 'cell_voltage_overvoltage_protection', 'cell_voltage_overvoltage_recovery', 3],
  ['volt', 'Cell UVP / UVPR', 'cell_voltage_undervoltage_protection', 'cell_voltage_undervoltage_recovery', 3],
  ['volt', 'Power Off Vol.', 'power_off_voltage', null, 3],
  ['volt', 'Smart Sleep Volt.', 'smart_sleep_voltage', null, 3],
  ['bal', 'Start Balance Volt.', 'balance_starting_voltage', null, 3],
  ['bal', 'Balance Trig. Volt.', 'balance_trigger_voltage', null, 3],
  ['bal', 'Max Balance Cur.', 'max_balance_current', null, 1],
  // nur im Active-Polling-Modus des Add-ons vorhanden (Geräteinfo-Block) – sonst ausgeblendet
  ['bal', 'RCV Time', 'request_charge_voltage_time', null, 1, 'h'],
  ['bal', 'RFV Time', 'request_float_voltage_time', null, 1, 'h'],
  ['cur', 'Max Charge Cur.', 'max_charge_current', null, 0],
  ['cur', 'Charge OCP Delay / OCPR', 'charge_overcurrent_protection_delay', 'charge_overcurrent_protection_recovery_time', 0],
  ['cur', 'Max Discharge Cur.', 'max_discharge_current', null, 0],
  ['cur', 'Discharge OCP Delay / OCPR', 'discharge_overcurrent_protection_delay', 'discharge_overcurrent_protection_recovery_time', 0],
  ['cur', 'SCP Delay / SCPR', 'short_circuit_protection_delay', 'short_circuit_protection_recovery_time', 0],
  ['temp', 'Charge OTP / OTPR', 'charge_overtemperature_protection', 'charge_overtemperature_protection_recovery', 0],
  ['temp', 'Discharge OTP / OTPR', 'discharge_overtemperature_protection', 'discharge_overtemperature_protection_recovery', 0],
  ['temp', 'Charge UTP / UTPR', 'charge_undertemperature_protection', 'charge_undertemperature_protection_recovery', 0],
  ['temp', 'Discharge UTP / UTPR', 'sensor:discharge_undertemperature_protection', 'sensor:discharge_undertemperature_protection_recovery', 0],
  ['temp', 'MOS OTP / OTPR', 'power_tube_overtemperature_protection', 'power_tube_overtemperature_protection_recovery', 0],
  ['temp', 'TMP Start / Stop Heating', 'sensor:heating_start_temperature', 'sensor:heating_stop_temperature', 0],
  ['gen', 'Battery Capacity', 'total_battery_capacity_ah', null, 0],
  ['gen', 'Cell Count', 'cell_count', null, 0],
  ['gen', 'Device Addr.', 'device_address', null, 0],
  ['gen', 'Time Smart Sleep', 'sensor:smart_sleep_delay', null, 0],
  ['gen', 'Dischrg. Pre. Chrg. T', 'sensor:precharge_time', null, 0],
  ['gen', 'Battery Type', 'sensor:battery_type_text', null, null],
  ['func', 'Charging Float Mode', 'switch:charging_floating_mode', null, 'bool'],
  ['func', 'Smart Sleep On', 'switch:smart_sleep_switch', null, 'bool'],
  ['func', 'Timed Stored Data', 'switch:timed_stored_data_switch', null, 'bool'],
  ['func', 'Display Always On', 'switch:display_always_on_switch', null, 'bool'],
  ['func', 'Disable Par-Limiter', 'switch:disable_pcl_module_switch', null, 'bool'],
  ['func', 'Heating', 'binary_sensor:heating_switch', null, 'bool'],
  ['func', 'Disable Temp. Sensor', 'binary_sensor:disable_temperature_sensors', null, 'bool'],
  ['func', 'Discharge OCP 2', 'binary_sensor:discharge_ocp2', null, 'bool'],
  ['func', 'Discharge OCP 3', 'binary_sensor:discharge_ocp3', null, 'bool'],
  ['func', 'DRY ARM Intermittent', 'binary_sensor:dry_alarm_intermittent', null, 'bool'],
  ['func', 'Special Charger', 'binary_sensor:special_charger', null, 'bool'],
  ['gen', 'LCD Buzzer Trigger', 'lcd_buzzer_trigger', null, 0],
  ['gen', 'LCD Buzzer Trigger / Release Val', 'lcd_buzzer_trigger_value', 'lcd_buzzer_release_value', 0],
  ['gen', 'DRY 1 Trigger', 'select:dry1_trigger_code', null, null],
  ['gen', 'DRY 1 Trigger / Release Val', 'dry1_trigger_value', 'dry1_release_value', 0],
  ['gen', 'DRY 2 Trigger', 'select:dry2_trigger_code', null, null],
  ['gen', 'DRY 2 Trigger / Release Val', 'dry2_trigger_value', 'dry2_release_value', 0],
];
const JK_SETTING_ID = '{d}.{p}_bms_{k}';
// In der JK-App einstellbar, vom Add-on aber nicht nach Home Assistant übertragen
// [Name, Label eines JK_SETTINGS-Eintrags, der den Wert ersetzt, falls das Add-on ihn liefert]
const JK_APP_ONLY = [['RCV / RFV Time', 'RCV Time'], ['Re-Bulk SOC', null], ['Calibrating Volt./Curr.', null], ['Emerg. Time', null], ['Data Stored Period', null], ['UART1–3 / CAN Protocol', null], ['LCD Buzzer', 'LCD Buzzer Trigger'], ['DRY 1 / DRY 2', 'DRY 1 Trigger'], ['Con. Wire Res.', null], ['GPS Locked CHG/DCH', null]];

const JK_TEMPS = ['temp_entity', 'temp_2_entity', 'temp_3_entity', 'temp_4_entity', 'temp_5_entity'];
const JK_CELL = "sensor.{p}_bms_cell_{i}_volt";
const JK_CELL_RES = "sensor.{p}_bms_cell_{i}_ohm";
const JK_MAX_CELLS = 32;

const ICON_CLOSE = "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

// Selector Konfiguration
// Hinweis: Alle Eingabefelder laufen über <ha-selector>. <ha-textfield> / <mwc-button> sind im
// Karten-Editor nicht zuverlässig geladen und wurden dann unsichtbar (nur leerer Platz) dargestellt.
const sensorSelector = { entity: { domain: "sensor" } };
const binarySelector = { entity: { domain: ["binary_sensor", "sensor", "input_boolean", "switch"] } };
const switchSelector = { entity: { domain: ["switch", "input_boolean", "input_select", "binary_sensor", "select"] } };
const textSelector = { text: {} };
const voltageSelector = { number: { min: 0, max: 5, step: 0.01, mode: "box", unit_of_measurement: "V" } };
const opacitySelector = { number: { min: 0, max: 1, step: 0.05, mode: "slider" } };
const colorSelector = (options) => ({ select: { options, custom_value: true, mode: "dropdown" } });

// Domains, bei denen eigene EIN/AUS-Werte sinnvoll sind (Auswahllisten statt on/off)
const CUSTOM_STATE_DOMAINS = ["select", "input_select"];

// Lokalisierung mit Fallback auf Englisch pro Schlüssel (verhindert rohe Keys wie "card.delta")
// Griechisch: HA meldet "el", PR #14 nutzte "gr" -> beide Codes
const LANGS = { de, en, fr, el: gr, gr };
const localize = (hass, key) => {
  const code = (hass?.locale?.language || 'en').split('-')[0];
  const lookup = (dict) => key.split('.').reduce((o, i) => (o ? o[i] : undefined), dict);
  return lookup(LANGS[code]) ?? lookup(LANGS.en) ?? key;
};

class BmsBatteryCellsCardEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  static get styles() {
    return css`
      .card-config { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
      .section { display: flex; flex-direction: column; gap: 8px; }
      .section-header {
        font-weight: 600; display: block; color: var(--primary-text-color);
        border-bottom: 1px solid var(--divider-color); padding-bottom: 4px; margin-bottom: 4px;
      }
      .hint { font-size: 12px; color: var(--secondary-text-color); }
      .sub-header { font-weight: 600; display: block; margin: 4px 0 0; color: var(--primary-text-color); }

      ha-selector { display: block; width: 100%; }

      .switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 1px 0; } /* Zeilenabstand ~30px wie in v1.x */
      .switch-row.highlight { background: rgba(33,150,243,0.1); padding: 4px 8px; border-radius: 6px; font-weight: bold; }

      .field-row { display: flex; align-items: center; gap: 4px; }
      .field-row ha-selector { flex: 1; min-width: 0; }
      .clear-btn { color: var(--secondary-text-color); flex-shrink: 0; }

      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

      .state-values {
        margin-left: 8px; padding-left: 8px;
        border-left: 2px solid rgba(33,150,243,0.3);
      }

      .detailed-options {
        background: rgba(33, 150, 243, 0.05);
        border: 1px solid rgba(33, 150, 243, 0.2);
        border-radius: 8px;
        padding: 10px;
        display: flex; flex-direction: column; gap: 8px;
      }

      .list-row {
        background: var(--secondary-background-color, rgba(0,0,0,0.05));
        padding: 10px; padding-right: 48px; /* Platz für den Löschen-Button */
        border-radius: 8px;
        border: 1px solid var(--divider-color, rgba(0,0,0,0.1));
        display: flex; flex-direction: column; gap: 8px;
        position: relative;
      }
      .cell-row { display: flex; align-items: center; gap: 10px; width: 100%; }
      .cell-name { width: 90px; flex-shrink: 0; }
      .cell-spacer { width: 90px; flex-shrink: 0; }
      .cell-entity { flex: 1; min-width: 0; }

      .delete-btn {
        position: absolute; top: 50%; right: 2px; transform: translateY(-50%);
        color: var(--error-color); --mdc-icon-button-size: 36px;
      }

      .add-button {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; padding: 10px; margin-top: 4px;
        background: transparent; color: var(--primary-color);
        border: 1px solid var(--primary-color); border-radius: 8px;
        font: inherit; font-weight: 500; cursor: pointer;
      }
      .add-button:hover { background: rgba(var(--rgb-primary-color, 33,150,243), 0.08); }

      /* Farbauswahl (native Farbpalette, im Stil eines HA-Eingabefelds) */
      .color-field {
        display: flex; flex-direction: column; justify-content: center; gap: 2px;
        min-height: 56px; box-sizing: border-box; padding: 6px 12px; cursor: pointer;
        background: var(--mdc-text-field-fill-color, var(--secondary-background-color, rgba(0,0,0,0.05)));
        border-bottom: 1px solid var(--mdc-text-field-idle-line-color, var(--secondary-text-color));
        border-radius: 4px 4px 0 0;
      }
      .color-label { font-size: 12px; color: var(--secondary-text-color); }
      .color-row { display: flex; align-items: center; gap: 10px; color: var(--primary-text-color); }
      .color-hex { font-family: monospace; font-size: 14px; }
      input[type="color"] {
        -webkit-appearance: none; appearance: none;
        width: 32px; height: 26px; padding: 0; border: none; background: none; cursor: pointer; flex-shrink: 0;
      }
      input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
      input[type="color"]::-webkit-color-swatch { border: 1px solid var(--divider-color); border-radius: 6px; }
      input[type="color"]::-moz-color-swatch { border: 1px solid var(--divider-color); border-radius: 6px; }
      .swatch-btn { width: 36px; height: 36px; }
    `;
  }

  setConfig(config) {
    this._config = config;
  }

  _localize(key) {
    return localize(this.hass, key);
  }

  _fireConfigChanged(newConfig) {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    }));
  }

  // Setzt einen Wert; leere Werte entfernen den Schlüssel, damit die Standardwerte der Karte greifen
  _setValue(key, value) {
    if (!this._config) return;
    const newConfig = { ...this._config };
    const isEmpty = value === undefined || value === null || (value === '' && key !== 'title');
    if (isEmpty) delete newConfig[key];
    else newConfig[key] = value;
    this._fireConfigChanged(newConfig);
  }

  _addCell() {
    const newCells = [...(this._config.cells || [])];
    newCells.push({ name: `${newCells.length + 1}`, entity: '' });
    this._fireConfigChanged({ ...this._config, cells: newCells });
  }

  _removeCell(index) {
    const newCells = [...(this._config.cells || [])];
    newCells.splice(index, 1);
    this._fireConfigChanged({ ...this._config, cells: newCells });
  }

  _editCell(index, key, value) {
    const newCells = [...(this._config.cells || [])];
    const cell = { ...newCells[index] };
    if (value === undefined || value === null || value === '') delete cell[key];
    else cell[key] = value;
    newCells[index] = cell;
    this._fireConfigChanged({ ...this._config, cells: newCells });
  }

  // --- Render-Helfer (einheitliche Abstände über .section gap) ---
  _renderSelector(labelKey, configKey, selector, fallback = undefined) {
    const value = this._config[configKey] ?? fallback;
    return html`
      <ha-selector
        .label=${this._localize(labelKey)}
        .hass=${this.hass}
        .selector=${selector}
        .value=${value}
        .required=${false}
        @value-changed=${(e) => this._setValue(configKey, e.detail.value)}
      ></ha-selector>
    `;
  }

  _renderEntitySelector(labelKey, configKey, selector) {
    return html`
      <div class="field-row">
        ${this._renderSelector(labelKey, configKey, selector)}
        ${this._config[configKey] ? html`
          <ha-icon-button class="clear-btn" .path=${ICON_CLOSE} @click=${() => this._setValue(configKey, undefined)}></ha-icon-button>
        ` : ''}
      </div>
    `;
  }

  // Status-Entität (Laden/Entladen/Balance/Heizung). Eigene EIN/AUS-Werte nur bei Auswahllisten
  // (select / input_select) oder wenn bereits Werte konfiguriert sind.
  _renderStateEntity(labelKey, entityKey, onKey, offKey) {
    const entityId = this._config[entityKey];
    const domain = entityId ? String(entityId).split('.')[0] : '';
    const showValues = CUSTOM_STATE_DOMAINS.includes(domain) || this._config[onKey] || this._config[offKey];
    return html`
      ${this._renderEntitySelector(labelKey, entityKey, switchSelector)}
      ${showValues ? html`
        <div class="state-values grid-2">
          ${this._renderSelector('editor.val_on', onKey, textSelector)}
          ${this._renderSelector('editor.val_off', offKey, textSelector)}
        </div>
      ` : ''}
    `;
  }

  // Beliebigen CSS-Farbwert (Hex, Name, rgb()) in #rrggbb umwandeln; null wenn keine Farbe
  _toHexColor(value) {
    if (!value || typeof value !== 'string') return null;
    const v = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v.slice(1).split('').map(ch => ch + ch).join('').toLowerCase();
    try {
      const ctx = (this._colorCtx = this._colorCtx || document.createElement('canvas').getContext('2d'));
      ctx.fillStyle = '#000000'; ctx.fillStyle = v;
      const res = ctx.fillStyle;
      if (res === '#000000' && !/^(black|#000|#000000|rgb\(0, ?0, ?0\))$/i.test(v)) return null;
      return /^#[0-9a-f]{6}$/i.test(res) ? res : null;
    } catch (e) { return null; }
  }

  // Farbfeld mit Farbpalette (z. B. Farben für den Delta-Modus)
  _renderColorField(labelKey, configKey, fallback) {
    const value = this._config[configKey] ?? fallback;
    const hex = this._toHexColor(value) || fallback;
    return html`
      <label class="color-field">
        <span class="color-label">${this._localize(labelKey)}</span>
        <span class="color-row">
          <input type="color" .value=${hex} @change=${(e) => this._setValue(configKey, e.target.value)}>
          <span class="color-hex">${value}</span>
        </span>
      </label>
    `;
  }

  // Auswahl (z. B. gradient / range / delta) plus Farbpalette für eine eigene, feste Farbe
  _renderColorSelect(labelKey, configKey, options, fallback, defaultSwatch) {
    const value = this._config[configKey] ?? fallback;
    const hex = this._toHexColor(options.includes(value) ? '' : value) || defaultSwatch;
    return html`
      <div class="field-row">
        ${this._renderSelector(labelKey, configKey, colorSelector(options), fallback)}
        <input type="color" class="swatch-btn" title=${this._localize('editor.pick_color')} .value=${hex}
          @change=${(e) => this._setValue(configKey, e.target.value)}>
      </div>
    `;
  }

  _renderSwitch(labelKey, configKey, defaultValue = false, highlight = false) {
    const checked = defaultValue ? this._config[configKey] !== false : !!this._config[configKey];
    return html`
      <div class="switch-row ${highlight ? 'highlight' : ''}">
        <span>${this._localize(labelKey)}</span>
        <ha-switch .checked=${checked} @change=${(e) => this._setValue(configKey, e.target.checked)}></ha-switch>
      </div>
    `;
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const c = this._config;
    const cells = c.cells || [];
    const detailed = !!c.show_detailed_view;
    // Die Balken-Optionen gelten auch für die Standardansicht unterhalb der Detailansicht
    const showBarOptions = !detailed || !!c.show_standard_in_detail;

    return html`
      <div class="card-config">

        ${this._renderSelector('editor.title', 'title', textSelector)}

        <div class="section">
          <span class="section-header">${this._localize('editor.jk_section')}</span>
          ${this._renderSelector('editor.jk_prefix', 'jk_prefix', textSelector)}
          <span class="hint">${this._localize('editor.jk_prefix_hint')}</span>
          ${this._renderSwitch('editor.show_jk_info', 'show_jk_info', true)}
          ${this._renderSwitch('editor.show_jk_settings', 'show_jk_settings', true)}
          ${this._renderSwitch('editor.jk_settings_open', 'jk_settings_open', false)}
          ${this._renderEntitySelector('editor.alarm_entity', 'alarm_entity', binarySelector)}
          ${this._renderEntitySelector('editor.alarm_list_entity', 'alarm_list_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.charge_status_entity', 'charge_status_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.charge_status_time_entity', 'charge_status_time_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.temp_2', 'temp_2_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.temp_3', 'temp_3_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.temp_4', 'temp_4_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.temp_5', 'temp_5_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.balancer_status', 'balancer_status_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.balance_current', 'balance_current_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.charger', 'charger_entity', binarySelector)}
          ${this._renderEntitySelector('editor.precharge', 'precharge_entity', binarySelector)}
          ${this._renderEntitySelector('editor.heating_current', 'heating_current_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.battery_type', 'battery_type_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.throughput', 'throughput_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.runtime', 'runtime_entity', sensorSelector)}
        </div>

        <div class="section">
          <span class="section-header">${this._localize('editor.display_options')}</span>
          ${this._renderSwitch('editor.show_detailed_view', 'show_detailed_view', false, true)}

          ${detailed ? html`
            ${this._renderSwitch('editor.show_charts', 'show_charts', true)}
            ${this._renderSwitch('editor.show_cell_list', 'show_cell_list', true)}
            ${this._renderSwitch('editor.show_standard_in_detail', 'show_standard_in_detail')}
            ${this._renderSwitch('editor.show_title_in_detail', 'show_title_in_detail', true)}
            ${this._renderSwitch('editor.show_status', 'show_status')}
            ${this._renderSwitch('editor.balance_led', 'balance_led')}
            ${this._renderSwitch('editor.confirm_toggle', 'confirm_toggle', true)}
          ` : ''}

          ${showBarOptions ? html`
            ${detailed ? html`<span class="sub-header">${this._localize('editor.standard_view_options')}</span>` : ''}
            <div class="grid-2">
              ${this._renderSelector('editor.min_voltage', 'min_voltage', voltageSelector, 2.60)}
              ${this._renderSelector('editor.max_voltage', 'max_voltage', voltageSelector, 3.65)}
            </div>
            ${!detailed ? this._renderSwitch('editor.show_header_values', 'show_values_on_top') : ''}
            ${this._renderSwitch('editor.show_as_table', 'show_as_table')}
            ${this._renderSwitch('editor.hide_bars', 'hide_bars')}
            ${this._renderSwitch('editor.horizontal_layout', 'horizontal_layout')}
            ${this._renderSwitch('editor.show_legend', 'show_legend', true)}
            ${this._renderSwitch('editor.thick_borders', 'thicker_borders')}
            ${this._renderSwitch('editor.enable_animations', 'enable_animations', true)}
            ${this._renderSwitch('editor.show_cell_voltages', 'show_values', true)}
            ${this._renderSwitch('editor.show_min_max', 'show_min_max', true)}
            ${!detailed ? this._renderSwitch('editor.show_average', 'show_average') : ''}
            ${!detailed ? this._renderSwitch('editor.calc_drift', 'show_voltage_diff') : ''}

            <span class="sub-header">${this._localize('editor.colors')}</span>
            <div class="grid-2">
              ${this._renderColorSelect('editor.cell_background_color', 'cell_background_color', ['gradient'], 'gradient', '#1c1c1e')}
              ${this._renderSelector('editor.cell_background_opacity', 'cell_background_opacity', opacitySelector, 0.25)}
              ${this._renderColorSelect('editor.cell_bar_color', 'cell_bar_color', ['range', 'delta'], 'range', '#43a047')}
              ${this._renderSelector('editor.cell_bar_opacity', 'cell_bar_opacity', opacitySelector, 0.6)}
              ${c.cell_bar_color === 'delta' ? html`
                ${this._renderColorField('editor.cell_bar_top_color', 'cell_bar_top_color', '#173117')}
                ${this._renderColorField('editor.cell_bar_bottom_color', 'cell_bar_bottom_color', '#3c2222')}
              ` : ''}
            </div>
          ` : ''}
        </div>

        <div class="section">
          <span class="section-header">${this._localize('editor.main_sensors')}</span>
          ${this._renderEntitySelector('editor.soc', 'soc_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.power', 'watt_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.voltage', 'total_voltage_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.current', 'total_current_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.drift', 'cell_diff_sensor', sensorSelector)}
          ${this._renderEntitySelector('editor.temp', 'temp_entity', sensorSelector)}

          ${detailed ? html`
            <div class="detailed-options">
              <span class="sub-header" style="margin-top:0;">${this._localize('editor.detailed_sensors')}</span>
              ${this._renderStateEntity('editor.stat_charge', 'stat_charge_entity', 'stat_charge_on', 'stat_charge_off')}
              ${this._renderStateEntity('editor.stat_discharge', 'stat_discharge_entity', 'stat_discharge_on', 'stat_discharge_off')}
              ${this._renderStateEntity('editor.stat_balance', 'stat_balance_entity', 'stat_balance_on', 'stat_balance_off')}
              ${this._renderStateEntity('editor.stat_heater', 'stat_heater_entity', 'stat_heater_on', 'stat_heater_off')}
              ${this._renderEntitySelector('editor.soh', 'soh_entity', sensorSelector)}
              ${this._renderEntitySelector('editor.capacity', 'capacity_entity', sensorSelector)}
              ${this._renderEntitySelector('editor.cycle_capacity', 'cycle_capacity_entity', sensorSelector)}
              ${this._renderEntitySelector('editor.cycles', 'cycle_count_entity', sensorSelector)}
              ${this._renderEntitySelector('editor.temp_mos', 'temp_mos_entity', sensorSelector)}
            </div>
          ` : ''}
        </div>

        <div class="section">
          <span class="section-header">${this._localize('editor.cells')}</span>
          ${cells.map((cell, index) => html`
            <div class="list-row">
              <div class="cell-row">
                <ha-selector class="cell-name" .label=${this._localize('editor.cell_name')} .hass=${this.hass} .selector=${textSelector} .value=${cell.name ?? ''} .required=${false} @value-changed=${(e) => this._editCell(index, 'name', e.detail.value)}></ha-selector>
                <ha-selector class="cell-entity" .label=${this._localize('editor.cell_entity')} .hass=${this.hass} .selector=${sensorSelector} .value=${cell.entity} .required=${false} @value-changed=${(e) => this._editCell(index, 'entity', e.detail.value)}></ha-selector>
              </div>
              <div class="cell-row">
                <div class="cell-spacer"></div>
                <ha-selector class="cell-entity" .label=${this._localize('editor.cell_balance_entity')} .hass=${this.hass} .selector=${binarySelector} .value=${cell.balance_entity} .required=${false} @value-changed=${(e) => this._editCell(index, 'balance_entity', e.detail.value)}></ha-selector>
              </div>
              ${detailed ? html`
                <div class="cell-row">
                  <div class="cell-spacer"></div>
                  <ha-selector class="cell-entity" .label=${this._localize('editor.cell_resistance_entity')} .hass=${this.hass} .selector=${sensorSelector} .value=${cell.resistance_entity} .required=${false} @value-changed=${(e) => this._editCell(index, 'resistance_entity', e.detail.value)}></ha-selector>
                </div>
              ` : ''}
              <ha-icon-button class="delete-btn" .path=${ICON_CLOSE} @click=${() => this._removeCell(index)}></ha-icon-button>
            </div>
          `)}
          <button class="add-button" @click=${this._addCell}>
            <ha-icon icon="mdi:plus"></ha-icon> ${this._localize('editor.add_cell')}
          </button>
        </div>

      </div>
    `;
  }
}

if (!customElements.get(EDITOR_TAG)) {
  customElements.define(EDITOR_TAG, BmsBatteryCellsCardEditor);
}

console.log(
  `%c🔋 BMS Battery Cells Card (JK-BMS) ${CARD_VERSION} loaded`,
  "background: #2ecc71; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: bold;"
);

// Helper for making sure that HA-Components are loaded
const loadCardHelpers = async () => {
  if (window.loadCardHelpers) return window.loadCardHelpers();
  if (customElements.get("hui-view")) {
    const element = document.createElement("hui-view");
    if (element.getCardHelpers) return element.getCardHelpers();
  }
  return undefined;
};

class BmsBatteryCellsCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._initialized = false;
        this.chartVoltage = null;
        this.chartDelta = null;
        this._renderToken = 0;
        this._lastStates = null;
        this._docClickHandler = null;
        this._resizeObserver = null;
    }

    connectedCallback() {
        // Tooltip-Handler wieder anmelden, falls die Karte erneut eingehängt wird
        if (this._docClickHandler) document.addEventListener('click', this._docClickHandler);
    }

    disconnectedCallback() {
        // Globale Listener entfernen (verhindert Speicherlecks beim Verlassen des Dashboards)
        if (this._docClickHandler) document.removeEventListener('click', this._docClickHandler);
    }

    getCardSize() {
        if (this._config?.show_detailed_view) return 10;
        return Math.max(2, Math.round((this._config?.card_height || 380) / 50));
    }

    static async getConfigElement() {
        await loadCardHelpers();
        return document.createElement(EDITOR_TAG);
    }

    static getStubConfig() {
        return {
            jk_prefix: 'bms_master',
            show_detailed_view: true,
            show_status: true,
            balance_led: true
        };
    }

    // JK-Präfix: fehlende Einträge aus dem Add-on-Schema ergänzen. Braucht hass (Zellenzahl, Existenzprüfung).
    _resolveJk() {
        const raw = this._rawConfig || {};
        const p = String(raw.jk_prefix || '').trim().toLowerCase();
        this._jkResolved = true;
        this._jkPrefix = p;
        this._jkUnsignedPower = false;
        this._jkSignature = '';
        this._jkSettings = [];
        // Immer von der unaufgelösten Konfiguration ausgehen, damit ein erneuter Lauf nichts Altes behält
        if (this._baseConfig) this._config = { ...this._baseConfig };
        if (!p || !this._hass) return;
        const states = this._hass.states;
        this._jkStateCount = Object.keys(states).length;
        const fill = (tpl) => tpl.split('{p}').join(p);
        Object.entries(JK_MAP).forEach(([key, tpl]) => {
            if (raw[key]) return;                // selbst eingetragen -> Vorrang
            const candidates = (Array.isArray(tpl) ? tpl : [tpl]).map(fill);
            const id = candidates.find(x => states[x]);
            if (id) this._config[key] = id;
            // Alte Add-on-Versionen liefern die Leistung ohne Vorzeichen -> Richtung aus dem Strom ableiten
            if (key === 'watt_entity' && id && candidates.length > 1 && id !== candidates[0]) this._jkUnsignedPower = true;
        });
        if (!Array.isArray(raw.cells) || raw.cells.length === 0) {
            const cells = [];
            for (let i = 1; i <= JK_MAX_CELLS; i++) {
                const id = fill(JK_CELL).replace('{i}', i);
                if (!states[id]) break;
                const res = fill(JK_CELL_RES).replace('{i}', i);
                cells.push({ entity: id, name: `${i}`, ...(states[res] ? { resistance_entity: res } : {}) });
            }
            this._config.cells = cells;
        }
        // BMS-Einstellungen: nur die Einträge, deren Entität es gibt
        const sid = (k) => { if (!k) return null; const [d, n] = k.includes(':') ? k.split(':') : ['number', k]; return fill(JK_SETTING_ID).replace('{d}', d).replace('{k}', n); };
        this._jkSettings = JK_SETTINGS.map(([group, label, k1, k2, dec, unit], i) => ({
            group, label, dec, unit, idx: i,
            a: states[sid(k1)] ? sid(k1) : null,
            b: k2 && states[sid(k2)] ? sid(k2) : null,
        })).filter(s => s.a);
        this._entityCache = null;
        // Fingerabdruck der Auflösung: ändert er sich später, wird neu gerendert
        this._jkSignature = JSON.stringify([
            Object.keys(JK_MAP).map(k => this._config[k] || ''),
            this._config.cells,
            this._jkSettings.map(s => [s.a, s.b]),
        ]);
    }

    // Leistung mit Vorzeichen (+ Laden / − Entladen), auch wenn das Add-on sie ohne Vorzeichen liefert
    _readPower() {
        const w = this._parseNumber(this._config.watt_entity);
        if (w === null || !this._jkUnsignedPower) return w;
        const i = this._parseNumber(this._config.total_current_entity);
        return (i !== null && i < 0) ? -Math.abs(w) : w;
    }

    _jkSettingsEnabled() {
        return this._config.show_jk_settings !== false && Array.isArray(this._jkSettings) && this._jkSettings.length > 0;
    }

    _renderJkSettingsHtml() {
        const groups = [['volt', 'card.set_volt'], ['bal', 'card.set_bal'], ['cur', 'card.set_cur'], ['temp', 'card.set_temp'], ['gen', 'card.set_gen'], ['func', 'card.set_func']];
        const body = groups.map(([g, key]) => {
            const rows = this._jkSettings.filter(s => s.group === g);
            if (!rows.length) return '';
            return `<div class="jk-set-group"><div class="jk-set-head">${this._localize(key)}</div>${rows.map(s => `
                <div class="jk-set-row clickable" data-entity="${s.a}"><span class="jk-set-lbl">${this._esc(s.label)}</span><span class="jk-set-val" id="jk-set-${s.idx}">--</span></div>`).join('')}</div>`;
        }).join('');
        return `<details class="box jk-settings" ${this._config.jk_settings_open ? 'open' : ''}>
            <summary><ha-icon icon="mdi:tune-vertical"></ha-icon><span>${this._localize('card.bms_settings')}</span><span class="jk-set-hint">${this._localize('card.bms_settings_hint')}</span></summary>
            <div class="jk-set-grid">${body}</div>
            <div class="jk-set-apponly">${this._localize('card.set_app_only')}: ${JK_APP_ONLY.filter(([, lbl]) => !lbl || !this._jkSettings.some(s => s.label === lbl)).map(([n]) => n).join(', ')}</div>
        </details>`;
    }

    _updateJkSettings() {
        const fmt = (id, dec) => {
            if (dec === null) { const s = this._getState(id); return s && !['unknown', 'unavailable'].includes(s) ? String(s) : '--'; }
            const v = this._parseNumber(id);
            return v === null ? '--' : v.toFixed(dec);
        };
        this._jkSettings.forEach(s => {
            const el = this.shadowRoot.getElementById(`jk-set-${s.idx}`);
            if (!el) return;
            if (s.dec === 'bool') {
                const st = String(this._getState(s.a) || '').toLowerCase();
                const on = st === 'on';
                const out = ['on', 'off'].includes(st) ? this._localize(on ? 'card.on' : 'card.off') : '--';
                if (el.innerText !== out) el.innerText = out;
                el.style.color = on ? '#43a047' : '';
                return;
            }
            const unit = this._getUnit(s.a) || s.unit || '';
            const txt = s.b ? `${fmt(s.a, s.dec)} / ${fmt(s.b, s.dec)}` : fmt(s.a, s.dec);
            const out = `${txt}${unit ? ' ' + unit : ''}`;
            if (el.innerText !== out) el.innerText = out;
        });
    }

    _jkInfoEnabled() {
        const c = this._config;
        return c.show_jk_info !== false && !!(c.alarm_entity || c.alarm_list_entity || c.charge_status_entity || c.temp_2_entity || c.temp_3_entity || c.temp_4_entity || c.temp_5_entity || c.charger_entity || c.balancer_status_entity);
    }

    set hass(hass) {
        const oldHass = this._hass;
        this._hass = hass;
        if (!this._jkResolved) { this._resolveJk(); this._initialized = false; }
        else if (this._jkPrefix && this._jkStateCount !== Object.keys(hass.states).length) {
            // Es sind Entitäten dazugekommen oder weggefallen (Add-on gestartet, Discovery später):
            // Präfix neu auflösen und nur neu aufbauen, wenn sich für diese Karte etwas geändert hat.
            const before = this._jkSignature;
            this._resolveJk();
            if (this._jkSignature !== before) this._initialized = false;
        }
        if (!this._initialized || (oldHass && oldHass.locale?.language !== hass.locale?.language)) {
            // Erstes Rendern oder Sprachwechsel (Beschriftungen/Titel stehen im HTML) -> neu aufbauen
            this._initRender();
        } else if (oldHass && !this._relevantStateChanged(oldHass, hass)) {
            // Home Assistant ruft den Setter bei JEDER Zustandsänderung im System auf.
            // Nur neu zeichnen, wenn sich eine Entität dieser Karte geändert hat.
            return;
        }
        this._updateValues();
    }

    // Alle Entitäten, die diese Karte verwendet
    _relevantEntities() {
        if (this._entityCache) return this._entityCache;
        const c = this._config || {};
        const ids = new Set();
        Object.keys(c).forEach(k => { if ((k.endsWith('_entity') || k === 'cell_diff_sensor') && c[k]) ids.add(c[k]); });
        (c.cells || []).forEach(cell => {
            ['entity', 'balance_entity', 'resistance_entity'].forEach(k => { if (cell && cell[k]) ids.add(cell[k]); });
        });
        (this._jkSettings || []).forEach(s => { if (s.a) ids.add(s.a); if (s.b) ids.add(s.b); });
        this._entityCache = [...ids];
        return this._entityCache;
    }

    _relevantStateChanged(oldHass, newHass) {
        if (oldHass.locale?.language !== newHass.locale?.language) return true;
        return this._relevantEntities().some(id => oldHass.states[id] !== newHass.states[id]);
    }

    setConfig(config) {
        if (!config) throw new Error("Invalid configuration");
        this._config = {
            show_legend: true,
            container_padding: 16,
            card_height: 380,
            cell_gap: 4,
            show_values_on_top: false,
            hide_bars: false,
            horizontal_layout: false,
            show_as_table: false,
            enable_animations: true,
            min_voltage: 2.60,
            max_voltage: 3.65,
            show_values: true,
            show_min_max: true,
            show_average: false,
            show_voltage_diff: false,
            thicker_borders: false,
            show_detailed_view: false,
            show_cell_list: true,
            show_charts: true,
            show_standard_in_detail: false,
            cell_background_color: 'gradient',  // 'gradient' or color string
            cell_background_opacity: 0.25,      // 0.0 - 1.0
            cell_bar_color: 'range',            // 'range': uses dynamic color to visualize cell voltage
                                                // 'delta': uses dynamic color between cell_bar_top_color 
                                                //          and cell_bar_bottom_color based on deltaV
                                                // color name or hex color string for a static color
            cell_bar_opacity: 0.6,              // 0.0 - 1.0
            cell_bar_top_color: '#173117',    // hex color string, used if cell_bar_color is 'delta'
            cell_bar_bottom_color: '#3c2222', // hex color string, used if cell_bar_color is 'delta'
            ...config
        };
        if (!Array.isArray(this._config.cells)) this._config.cells = [];
        this._baseConfig = { ...this._config };
        this._rawConfig = config;
        this._jkResolved = false;
        // Title explicitly set by the user (the default title is not shown in the detailed view)
        this._userTitle = config.title || '';
        this._entityCache = null;
        this._initialized = false;
        if (this._hass) {
            this._resolveJk();
            this._initRender();
            this._updateValues(); // sonst stehen nach einer Konfigurationsänderung bis zum nächsten Update nur "--" da
        }
    }

    _localize(key) {
        return localize(this._hass, key);
    }

    _parseNumber(entityId) {
        if (!this._hass || !entityId) return null;
        const stateObj = this._hass.states[entityId];
        if (!stateObj) return null;
        let valStr = String(stateObj.state).trim();
        if (valStr === 'unavailable' || valStr === 'unknown') return null;
        valStr = valStr.replace(',', '.');
        const val = parseFloat(valStr);
        return isNaN(val) ? null : val;
    }

    _getState(entityId) {
        if (!this._hass || !entityId) return null;
        return this._hass.states[entityId] ? this._hass.states[entityId].state : null;
    }

    // --- UNIT HELPERS (Issue #5, #12) ---
    // Unit as reported by Home Assistant (unit_of_measurement), '' if unknown
    _getUnit(entityId) {
        if (!this._hass || !entityId) return '';
        const stateObj = this._hass.states[entityId];
        const unit = stateObj && stateObj.attributes ? stateObj.attributes.unit_of_measurement : '';
        return unit ? String(unit).trim() : '';
    }

    // Temperature: keep the unit of the entity (°C / °F / K), fallback °C
    _getTempUnit(entityId) {
        return this._getUnit(entityId) || '°C';
    }

    // Convert a temperature value to °C (needed for the color thresholds)
    _tempToCelsius(value, unit) {
        const u = String(unit || '').toUpperCase();
        if (u.includes('F')) return (value - 32) * 5 / 9;
        if (u === 'K') return value - 273.15;
        return value;
    }

    // Voltage -> Volt. Uses unit_of_measurement, falls back to the old heuristic (> 80 = mV)
    _toVolts(entityId, value) {
        if (value === null || value === undefined || isNaN(value)) return null;
        const unit = this._getUnit(entityId).toLowerCase();
        if (unit === 'mv') return value / 1000;
        if (unit === 'v') return value;
        return (value > 80) ? value / 1000 : value;
    }

    // Voltage difference -> millivolt. Uses unit_of_measurement, falls back to the old heuristic (< 1 = Volt)
    _toMilliVolts(entityId, value) {
        if (value === null || value === undefined || isNaN(value)) return null;
        const unit = this._getUnit(entityId).toLowerCase();
        if (unit === 'mv') return value;
        if (unit === 'v') return value * 1000;
        return (value < 1) ? value * 1000 : value;
    }

    _fireMoreInfo(entityId) {
        if (!entityId) return;
        const event = new CustomEvent("hass-more-info", {
            detail: { entityId },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    _handleSwitchAction(entityId, customOn, customOff) {
        if (!this._hass || !entityId) return;
        const stateObj = this._hass.states[entityId];
        if (!stateObj) return;
        
        const domain = entityId.split('.')[0];

        // Rückfrage vor dem Schalten: ein versehentlicher Tipp soll z. B. den Lade-/Entlade-MOSFET
        // nicht umschalten. Abschaltbar mit confirm_toggle: false.
        if (['switch', 'input_boolean', 'light', 'input_select', 'select'].includes(domain) && this._config.confirm_toggle !== false) {
            const name = (stateObj.attributes && stateObj.attributes.friendly_name) || entityId;
            if (!window.confirm(this._localize('card.confirm_toggle').replace('{name}', name))) return;
        }

        // Handle switches, input_booleans, lights
        if (domain === 'switch' || domain === 'input_boolean' || domain === 'light') {
            this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
            return;
        }

        // Handle input_select AND select
        if (domain === 'input_select' || domain === 'select') {
            const current = String(stateObj.state).trim();
            const targetOn = customOn && String(customOn).trim() !== '' ? String(customOn).trim() : 'on';
            const targetOff = customOff && String(customOff).trim() !== '' ? String(customOff).trim() : 'off';
            
            // Logic: If current is targetOn, switch to targetOff, else switch to targetOn
            const isCurrentOn = current.toLowerCase() === targetOn.toLowerCase();
            const nextOption = isCurrentOn ? targetOff : targetOn;
            
            // Correct service call based on domain
            const serviceDomain = domain === 'select' ? 'select' : 'input_select';
            
            this._hass.callService(serviceDomain, "select_option", { entity_id: entityId, option: nextOption });
        }
    }

    // Diagramme hängen an den Canvas-Elementen -> vor jedem Neu-Rendern (Konfigurationsänderung,
    // Wechsel Detail-/Standardansicht) sauber abbauen
    _teardownCharts() {
        this._renderToken++;
        if (this.chartVoltage) { this.chartVoltage.destroy(); this.chartVoltage = null; }
        if (this.chartDelta) { this.chartDelta.destroy(); this.chartDelta = null; }
        if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
    }

    _initRender() {
        if (!this._config || !this._hass) return;
        this._teardownCharts();
        if (this._config.show_detailed_view) {
            this._renderDetailedView();
        } else {
            this._renderStandardView();
        }
        this._initialized = true;
    }

    async _fetchHistory(entityId, hours = 6, convert = null) {
        if (!entityId) return [];
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
        try {
            const history = await this._hass.callApi(
                "GET", 
                `history/period/${startTime.toISOString()}?filter_entity_id=${entityId}&end_time=${endTime.toISOString()}&minimal_response`
            );
            if (history && history[0]) {
                return history[0]
                    .map(entry => {
                        const raw = parseFloat(String(entry.state).replace(',', '.'));
                        const y = (convert && !isNaN(raw)) ? convert(raw) : raw;
                        return { x: new Date(entry.last_changed).getTime(), y };
                    })
                    .filter(pt => pt.y !== null && !isNaN(pt.y));
            }
            return [];
        } catch (e) { return []; }
    }

    // Delta-Verlauf ohne externen Sensor: aus den Verläufen aller Zellspannungen berechnen (Max - Min in mV)
    async _fetchCellDeltaHistory(hours = 6) {
        const cells = (this._config.cells || []).filter(c => c && c.entity);
        if (cells.length < 2) return [];
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
        try {
            const ids = cells.map(c => c.entity);
            const history = await this._hass.callApi(
                "GET",
                `history/period/${startTime.toISOString()}?filter_entity_id=${ids.join(',')}&end_time=${endTime.toISOString()}&minimal_response&no_attributes`
            );
            if (!Array.isArray(history)) return [];
            // Alle Änderungen chronologisch sortieren und jeweils den letzten Wert pro Zelle fortschreiben
            const events = [];
            history.forEach((series) => {
                if (!Array.isArray(series) || !series.length) return;
                const entityId = series[0].entity_id;
                series.forEach(entry => {
                    const raw = parseFloat(String(entry.state).replace(',', '.'));
                    events.push({ t: new Date(entry.last_changed).getTime(), id: entityId, v: isNaN(raw) ? null : this._toVolts(entityId, raw) });
                });
            });
            events.sort((a, b) => a.t - b.t);
            const current = new Map();
            const points = [];
            events.forEach(ev => {
                if (ev.v === null) current.delete(ev.id); else current.set(ev.id, ev.v);
                if (current.size < ids.length) return; // erst wenn alle Zellen einen Wert haben
                const vals = [...current.values()];
                const y = (Math.max(...vals) - Math.min(...vals)) * 1000;
                const last = points[points.length - 1];
                if (last && last.x === ev.t) last.y = y; else points.push({ x: ev.t, y });
            });
            return points;
        } catch (e) { return []; }
    }

    _initCharts() {
        const token = this._renderToken;
        setTimeout(async () => {
            const cv = this.shadowRoot.getElementById('canvas-voltage');
            const cd = this.shadowRoot.getElementById('canvas-delta');
            // Abbrechen, wenn inzwischen neu gerendert wurde (sonst landet das Diagramm auf einem alten Canvas)
            const stale = (canvas) => token !== this._renderToken || !canvas || !canvas.isConnected;

            if (cv && this._config.total_voltage_entity && !this.chartVoltage) {
                const dataV = await this._fetchHistory(this._config.total_voltage_entity, 6);
                if (!stale(cv)) this.chartVoltage = this._createChart(cv, dataV, '#ffa726', 'V');
            }
            if (cd && !this.chartDelta) {
                let dataD = null;
                if (this._config.cell_diff_sensor) {
                    // Issue #5: history values must be normalized to mV, exactly like the live values
                    const deltaEntity = this._config.cell_diff_sensor;
                    dataD = await this._fetchHistory(deltaEntity, 6, (v) => this._toMilliVolts(deltaEntity, v));
                } else if ((this._config.cells || []).length >= 2) {
                    // Kein externer Sensor: Delta aus den Zellspannungen berechnen
                    dataD = await this._fetchCellDeltaHistory(6);
                }
                if (dataD && !stale(cd)) this.chartDelta = this._createChart(cd, dataD, '#1e88e5', 'mV', 0);
            }
            this._observeChartSize();
        }, 200);
    }

    // Diagramme an die Boxbreite anpassen (z. B. Editor-Vorschau, Spaltenwechsel, Seitenleiste)
    _observeChartSize() {
        if (this._resizeObserver) this._resizeObserver.disconnect();
        if (typeof ResizeObserver === 'undefined') return;
        const containers = this.shadowRoot.querySelectorAll('.chart-container-full');
        if (!containers.length) return;
        this._resizeObserver = new ResizeObserver(() => {
            [this.chartVoltage, this.chartDelta].forEach(ch => { if (ch && ch.canvas && ch.canvas.isConnected) ch.resize(); });
        });
        containers.forEach(el => this._resizeObserver.observe(el));
    }

    _createChart(ctx, data, color, unit = '', fixedDecimals = null) {
        const ChartLib = window.Chart || Chart;
        if (!ChartLib) return null;
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, color + '66'); 
        gradient.addColorStop(1, color + '00'); 

        return new ChartLib(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    data: data,
                    borderColor: color,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: { padding: 0 },
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { 
                        enabled: true, 
                        mode: 'index', 
                        intersect: false,
                        displayColors: false,
                        callbacks: {
                            title: () => [], 
                            label: (context) => {
                                let val = context.parsed.y;
                                const decimals = (fixedDecimals !== null) ? fixedDecimals : ((val < 10 && val > -10) ? 3 : 2);
                                return val.toFixed(decimals) + (unit ? ' ' + unit : '');
                            }
                        }
                    } 
                },
                // bounds 'data': X-Achse exakt vom ersten bis zum letzten Messpunkt. Mit dem Standard 'ticks'
                // rundet Chart.js auf "schöne" Werte und rechts/links bleibt ein leerer Streifen.
                scales: { x: { type: 'linear', display: false, bounds: 'data', offset: false }, y: { display: false } },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    }

    _updateChartData(chart, timestamp, value) {
        if (!chart) return;
        const data = chart.data.datasets[0].data;
        const last = data[data.length - 1];
        // Gleiche Werte nur alle 5 Minuten erneut speichern (verhindert tausende identische Punkte)
        if (last && last.y === value && (timestamp - last.x) < 5 * 60 * 1000) return;
        data.push({ x: timestamp, y: value });
        const cutoff = timestamp - (6 * 60 * 60 * 1000);
        while(data.length > 0 && data[0].x < cutoff) { data.shift(); }
        chart.update('none');
    }

    // STANDARD VIEW
    // =========================================================================
    _renderStandardView() {
        const { title, cells = [], card_height, cell_gap, show_values, min_voltage, max_voltage, thicker_borders, hide_bars, horizontal_layout, show_as_table, cell_bar_opacity, cell_background_opacity, container_padding } = this._config;
        const colors = this._getColors();
        const cellCount = cells.length;
        let valDisplay = show_values ? 'inline-block' : 'none';
        let nameFontSize = '10px';
        let namePadding = '2px 6px';
        let borderWidth = thicker_borders ? '2px' : '1px';
        if (cellCount > 10) {
            valDisplay = 'none';
            nameFontSize = '9px';
            namePadding = '1px 3px';
        }

        const isStandard = (Math.abs(min_voltage - 2.60) < 0.01 && Math.abs(max_voltage - 3.65) < 0.01);
        let mapPoints = isStandard ? [2.60, 2.80, 3.00, 3.20, 3.40, 3.45, 3.55, 3.65] : [];
        if (!isStandard) {
            const range = max_voltage - min_voltage; const step = range / 7;
            for (let i = 0; i <= 7; i++) mapPoints.push(Math.round((min_voltage + (step * i)) * 1000) / 1000);
        }
        let scaleLabels = horizontal_layout ? [...mapPoints].map(v=>v.toFixed(2)+'V') : [...mapPoints].reverse().map(v => v.toFixed(2) + 'V');

        const style = `
            <style>
                :host { display: block; --cell-gap: ${cell_gap}px; --badge-bg-color: rgba(0, 0, 0, 0.5); --val-display: ${valDisplay}; --name-fs: ${nameFontSize}; --name-pad: ${namePadding}; --bar-border-width: ${borderWidth}; --main-display: ${show_as_table || hide_bars ? 'none' : 'flex'}; --main-direction: ${horizontal_layout ? 'column' : 'row'}; --bar-transition: ${horizontal_layout ? 'width' : 'height'} 0.4s ease-out; --legend-direction: ${horizontal_layout ? 'row' : 'column'}; --legend-align: ${horizontal_layout ? 'space-between' : 'space-between'}; --legend-border: ${horizontal_layout ? 'none' : '1px solid rgba(255,255,255,0.1)'}; --legend-border-top: ${horizontal_layout ? '1px solid rgba(255,255,255,0.1)' : 'none'}; }
                ha-card { display: flex; flex-direction: column; z-index: 0; height: ${(hide_bars || horizontal_layout || show_as_table) ? 'auto' : card_height + 'px'}; padding: ${Number.isFinite(Number(container_padding)) ? Number(container_padding) : 16}px; box-sizing: border-box; position: relative; color: ${colors.text}; overflow: hidden; }
                .header.card-header { display: grid; grid-template-areas: "title stats" "subinfo stats"; grid-template-columns: auto minmax(0, 1fr); column-gap: 12px; align-items: center; margin-bottom: 12px; flex-shrink: 0; padding-bottom: 8px; border-bottom: ${(hide_bars && !show_as_table) ? 'none' : '1px solid rgba(255,255,255,0.05)'}; }
                .title { grid-area: title; font-size: 1.3rem; font-weight: 500; letter-spacing: 0.5px; margin-top: -4px; }			
				.sub-info-row { grid-area: subinfo; display: flex; gap: 12px; align-items: center; font-size: 1.125rem; color: var(--secondary-text-color); margin-top: 2px; }
				.sub-info-item, .stat-item { cursor: pointer; transition: opacity 0.2s; }
				.sub-info-item:hover, .stat-item:hover { opacity: 0.7; }
				.sub-info-item { display: flex; align-items: center; gap: 4px; }
				.sub-info-item ha-icon { --mdc-icon-size: 20px; color: var(--secondary-text-color); }
                .stats { grid-area: stats; display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; justify-content: flex-end; min-width: 0; }
                .stat-item { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; }
                .stat-value-row { display: flex; align-items: center; gap: 6px; font-size: 1.1rem; font-weight: 600; line-height: 1.2; white-space: nowrap; }
                .stat-label { white-space: nowrap; }
                .sub-info-row { flex-wrap: wrap; row-gap: 2px; }
                .stat-value-row.vertical-layout { flex-direction: column-reverse; gap: 2px; align-items: center; }
                .stat-label { font-size: 0.75rem; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
                .main-container.cells-container { flex: 1; display: var(--main-display); flex-direction: var(--main-direction); gap: var(--cell-gap); align-items: ${horizontal_layout ? 'stretch' : 'flex-end'}; position: relative; overflow: hidden; }
                ${horizontal_layout ? '.main-container.cells-container { overflow-y: auto !important; }' : ''}
                .table-container { display: ${show_as_table ? 'grid' : 'none'}; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 8px; width: 100%; overflow-y: auto; }
                .table-item { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid transparent; transition: all 0.2s; }
                .table-item.min-cell { border-color: #2196f3; background: rgba(33, 150, 243, 0.15); }
                .table-item.max-cell { border-color: #f44336; background: rgba(244, 67, 54, 0.15); }
                .table-name { font-size: 0.75rem; opacity: 0.7; margin-bottom: 2px; } .table-val { font-size: 0.95rem; font-weight: bold; white-space: nowrap; }
                .cell-wrapper.cell-item { flex: 1; ${horizontal_layout ? 'height: 50px; min-height: 50px;' : 'height: 100%;'} width: 100%; position: relative; border-radius: 6px; overflow: visible; background: rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; ${horizontal_layout ? 'display: flex; align-items: center; justify-content: flex-start;' : ''} }
                .cell-wrapper.cell-item.min-cell { box-shadow: 0 0 8px rgba(33, 150, 243, 0.6) inset; border: 1px solid rgba(33, 150, 243, 0.5); }
                .cell-wrapper.cell-item.max-cell { box-shadow: 0 0 8px rgba(244, 67, 54, 0.6) inset; border: 1px solid rgba(244, 67, 54, 0.5); }
                .custom-tooltip { position: absolute; top: 20%; left: 50%; transform: translateX(-50%); background: rgba(30, 30, 30, 0.95); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; pointer-events: none; opacity: 0; transition: opacity 0.2s ease-in-out; z-index: 20; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 8px rgba(0,0,0,0.5); }
                .cell-wrapper:hover .custom-tooltip, .cell-wrapper.show-tooltip .custom-tooltip { opacity: 1; }
                .cell-track-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${this._getCellBackground()}; opacity: ${cell_background_opacity}; z-index: 0; border-radius: 6px; overflow: hidden; }
                .cell-bar { position: absolute; ${horizontal_layout ? 'top: 0; bottom: 0; left: 0;' : 'bottom: 0; left: 0; right: 0;'} background: pink; ${horizontal_layout ? 'border-right: var(--bar-border-width) solid rgba(255, 255, 255, 0.6);' : 'border-top: var(--bar-border-width) solid rgba(255, 255, 255, 0.6);'} z-index: 1; transition: var(--bar-transition); ${horizontal_layout ? 'border-radius: 0 4px 4px 0;' : 'border-radius: 4px 4px 0 0;'} opacity: ${cell_bar_opacity}; box-shadow: 0 -2px 8px rgba(0,0,0,0.3); overflow: hidden; }
                .cell-bar.is-charging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear; }
                .cell-bar.is-discharging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear reverse; }
                @keyframes shimmer-move-up { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } } @keyframes shimmer-move-right { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .charging-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to ${horizontal_layout ? 'right' : 'top'}, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 100%); z-index: 2; transform: ${horizontal_layout ? 'translateX(-100%)' : 'translateY(100%)'}; opacity: 0; pointer-events: none; }
                .cell-info-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; ${horizontal_layout ? 'display: flex; align-items: center; justify-content: space-between; padding: 0 8px;' : ''} }
                ${!horizontal_layout ? `.cell-name-wrap { position: absolute; bottom: 8px; width: 100%; text-align: center; } .cell-val-wrap { position: absolute; bottom: 34px; width: 100%; text-align: center; }` : `.cell-name-wrap { position: relative; } .cell-val-wrap { position: relative; margin-right: 12px; }`}
                .cell-name-badge { background: rgba(0,0,0,0.6); color: white; padding: var(--name-pad); font-size: var(--name-fs); border-radius: 4px; font-weight: bold; backdrop-filter: blur(2px); white-space: nowrap; }
                .cell-val-badge.cell-voltage { background: var(--badge-bg-color); color: #fff; padding: 4px 10px; font-size: 13px; border-radius: 12px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); display: var(--val-display); white-space: nowrap; }
                .legend-col { display: flex; flex-direction: var(--legend-direction); justify-content: var(--legend-align); ${horizontal_layout ? 'width: 100%; height: 20px; border-top: var(--legend-border-top); padding-top: 2px;' : 'height: 100%; padding-right: 8px; margin-right: 4px; border-right: var(--legend-border); min-width: 40px;'} font-size: 11px; color: var(--secondary-text-color); text-align: right; font-weight: 500; }
                ha-icon { --mdc-icon-size: 20px; }
                ha-card { container-type: inline-size; }
                /* Schmale Karte (z. B. 3 Spalten): Titel oben, Spannung/Strom/Temp darunter, Werte als gleich breite Kacheln in einer Reihe */
                @container (max-width: 620px) {
                    .header.card-header { grid-template-areas: "title" "subinfo" "stats"; grid-template-columns: minmax(0, 1fr); row-gap: 8px; }
                    .title { margin-top: 0; }
                    .sub-info-row { justify-content: flex-start; margin-top: 0; font-size: 1rem; }
                    .stats { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; justify-content: stretch; }
                    .stat-item { align-items: center; text-align: center; background: rgba(var(--rgb-primary-text-color, 127,127,127), 0.05); border-radius: 10px; padding: 6px 4px; min-width: 0; }
                    .stat-label { margin-bottom: 2px; font-size: 0.68rem; }
                    .stat-value-row, .stat-value-row.vertical-layout { flex-direction: row; gap: 3px; font-size: 1rem; align-items: center; }
                    .stat-value-row ha-icon { --mdc-icon-size: 16px; }
                }
            </style>
        `;
        let containerHtml = '';
        if (show_as_table) { containerHtml = `<div class="table-container">${cells.map((cell, index) => `<div class="table-item" id="table-item-${index}"><span class="table-name">${this._esc(cell.name || (index+1))}</span><span class="table-val" id="table-val-${index}">-</span></div>`).join('')}</div>`; } 
        else if (!horizontal_layout) { containerHtml = `<div class="main-container cells-container">${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}</div>`; } 
        else { containerHtml = `<div class="main-container cells-container">${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}</div>`; }
        const html = `<ha-card><div class="header card-header"><div class="title">${this._esc(title ?? this._localize('card.default_title'))}</div><div class="sub-info-row" id="sub-info-container"></div><div class="stats" id="stats-container"></div></div>${containerHtml}</ha-card>`;
        this.shadowRoot.innerHTML = style + html;
        this._setupTooltips();
    }

    _renderCellHtml(cell, index) {
        return `<div class="cell-wrapper cell-item" id="cell-wrap-${index}"><div class="custom-tooltip" id="tooltip-${index}">-</div><div class="cell-track-bg"></div><div class="cell-bar" id="bar-${index}" style="height: 0%; width: 0%;"><div class="charging-overlay"></div></div><div class="cell-info-layer">${this._config.horizontal_layout ? `<div class="cell-name-wrap"><span class="cell-name-badge">${this._esc(cell.name || (index + 1))}</span></div><div class="cell-val-wrap"><span class="cell-val-badge cell-voltage" id="val-${index}">-</span></div>` : `<div class="cell-val-wrap"><span class="cell-val-badge cell-voltage" id="val-${index}">-</span></div><div class="cell-name-wrap"><span class="cell-name-badge">${this._esc(cell.name || (index + 1))}</span></div>`}</div></div>`;
    }

    _setupTooltips() {
        const wrappers = this.shadowRoot.querySelectorAll('.cell-wrapper');
        wrappers.forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                wrappers.forEach(w => { if (w !== el) w.classList.remove('show-tooltip'); });
                el.classList.toggle('show-tooltip');
            });
        });
        // Nur EIN globaler Listener pro Karte (vorher kam bei jedem Rendern ein weiterer dazu)
        if (!this._docClickHandler) {
            this._docClickHandler = () => {
                this.shadowRoot.querySelectorAll('.cell-wrapper.show-tooltip').forEach(w => w.classList.remove('show-tooltip'));
            };
            document.addEventListener('click', this._docClickHandler);
        }
    }

    _esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    _updateStandardValues() {
        const { cells = [], watt_entity, soc_entity, cell_diff_sensor, temp_entity, total_voltage_entity, total_current_entity, show_values, show_values_on_top, show_min_max, min_voltage, max_voltage, horizontal_layout, show_voltage_diff, show_average, hide_bars, show_as_table, cell_bar_color, cell_bar_top_color, cell_bar_bottom_color } = this._config;
        
        const rowClass = show_values_on_top ? 'stat-value-row vertical-layout' : 'stat-value-row';

        const wattVal = this._readPower();
        const isCharging = (this._config.enable_animations !== false) && (wattVal !== null && wattVal > 0);
        const isDischarging = (this._config.enable_animations !== false) && (wattVal !== null && wattVal < 0);
        
        let minV = 999, maxV = -999, minIdx = -1, maxIdx = -1, cellValues = [];
        cells.forEach((cell, index) => {
            const val = this._parseNumber(cell.entity);
            if (val !== null) {
                const v = this._toVolts(cell.entity, val);
                cellValues[index] = v;
                if (v < minV) {
                    minV = v;
                    minIdx = index;
                }
                if (v > maxV) {
                    maxV = v;
                    maxIdx = index;
                }
            }
        });

        // --- SUB INFO & STATS ---
        const subInfoContainer = this.shadowRoot.getElementById('sub-info-container');
        if (subInfoContainer) {
            const vTotal = this._parseNumber(total_voltage_entity);
            const iTotal = this._parseNumber(total_current_entity);
            const temp = this._parseNumber(temp_entity);
            let idx = 0;
            const updateElement = (container, id, index, renderFn) => {
                let el = container.querySelector(`#${id}`);
                if (!el) { el = document.createElement('div'); el.id = id; if (index < container.children.length) container.insertBefore(el, container.children[index]); else container.appendChild(el); }
                if (container.children[index] !== el) { if (index < container.children.length) container.insertBefore(el, container.children[index]); else container.appendChild(el); }
                renderFn(el); return 1;
            };
            const removeElement = (container, id) => { const el = container.querySelector(`#${id}`); if (el) el.remove(); return 0; };

            if (this._config.show_jk_info !== false && (this._config.alarm_entity || this._config.alarm_list_entity)) {
                const { alarm, text } = this._jkAlarmState();
                if (alarm) {
                    idx += updateElement(subInfoContainer, 'sub-alarm', idx, (el) => {
                        el.className = 'sub-info-item';
                        el.style.color = '#e53935';
                        el.title = text || this._localize('card.alarm');
                        const content = `<ha-icon icon="mdi:alert" style="color:#e53935"></ha-icon><span>${this._localize('card.alarm')}</span>`;
                        if (el.innerHTML !== content) el.innerHTML = content;
                        el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(this._config.alarm_list_entity || this._config.alarm_entity); };
                    });
                } else idx += removeElement(subInfoContainer, 'sub-alarm');
            }

            if (total_voltage_entity && vTotal !== null) {
                idx += updateElement(subInfoContainer, 'sub-volt', idx, (el) => {
                    el.className = 'sub-info-item';
                    const content = `<ha-icon icon="mdi:sine-wave"></ha-icon><span>${vTotal.toFixed(2)}V</span>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(total_voltage_entity); };
                });
            } else idx += removeElement(subInfoContainer, 'sub-volt');
            
            if (total_current_entity && iTotal !== null) {
                idx += updateElement(subInfoContainer, 'sub-curr', idx, (el) => {
                    el.className = 'sub-info-item';
                    const content = `<ha-icon icon="mdi:current-dc"></ha-icon><span>${iTotal.toFixed(1)}A</span>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(total_current_entity); };
                });
            } else idx += removeElement(subInfoContainer, 'sub-curr');
            
            if (temp_entity && temp !== null) {
                idx += updateElement(subInfoContainer, 'sub-temp', idx, (el) => {
                    el.className = 'sub-info-item';
                    const valNum = parseFloat(temp);
                    const valFormatted = isNaN(valNum) ? '0.00' : valNum.toFixed(2);
                    // Issue #12: use the unit of the entity (°C / °F / K); thresholds are always evaluated in °C
                    const tUnit = this._getTempUnit(temp_entity);
                    const tCelsius = this._tempToCelsius(valNum, tUnit);
                    const tColor = (tCelsius < 12) ? '#42a5f5' : ((tCelsius > 28) ? '#ef5350' : 'var(--secondary-text-color)');
                    el.style.color = tColor;
                    const content = `<ha-icon icon="mdi:thermometer" style="${'color:'+tColor }"></ha-icon><span>${valFormatted}${tUnit}</span>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(temp_entity); };
                });
            } else idx += removeElement(subInfoContainer, 'sub-temp');
        }

        const statsContainer = this.shadowRoot.getElementById('stats-container');
        if (statsContainer) {
            const socValRaw = this._parseNumber(soc_entity);
            // Issue #5: normalize delta to mV via unit_of_measurement (fallback: value < 1 = Volt)
            const diffVal = this._toMilliVolts(cell_diff_sensor, this._parseNumber(cell_diff_sensor));
            
            let idx = 0;
            const updateElement = (container, id, index, renderFn) => {
                let el = container.querySelector(`#${id}`);
                if (!el) { el = document.createElement('div'); el.id = id; if (index < container.children.length) container.insertBefore(el, container.children[index]); else container.appendChild(el); }
                if (container.children[index] !== el) { if (index < container.children.length) container.insertBefore(el, container.children[index]); else container.appendChild(el); }
                renderFn(el); return 1;
            };
            const removeElement = (container, id) => { const el = container.querySelector(`#${id}`); if (el) el.remove(); return 0; };

            if (watt_entity && wattVal !== null && Math.abs(wattVal) > 0.1) {
                idx += updateElement(statsContainer, 'stat-power', idx, (el) => {
                    el.className = 'stat-item';
                    const wColor = (wattVal > 0) ? '#00e676' : '#2979ff';
                    const icon = (wattVal > 0) ? 'mdi:battery-charging' : 'mdi:lightning-bolt';
                    const content = `<span class="stat-label">${this._localize('card.power')}</span><div class="${rowClass}" style="color: ${wColor}"><ha-icon icon="${icon}"></ha-icon><span>${Math.abs(wattVal) >= 100 ? Math.round(wattVal) : wattVal.toFixed(1)} <span style="font-size:0.8em">W</span></span></div>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(watt_entity); };
                });
            } else idx += removeElement(statsContainer, 'stat-power');

            if (soc_entity) {
                idx += updateElement(statsContainer, 'stat-soc', idx, (el) => {
                    el.className = 'stat-item';
                    const valStr = socValRaw !== null ? `${Math.round(socValRaw)}%` : '--';
                    const color = (socValRaw !== null && socValRaw < 20) ? '#ef5350' : ((socValRaw !== null && socValRaw < 50) ? '#ffa726' : '#66bb6a');
                    const socInt = Math.round(socValRaw);
                    const socStep = Math.round(socInt / 10) * 10;
                    const iconName = socValRaw === null ? 'mdi:battery-unknown' : (socInt >= 95 ? 'mdi:battery' : (socStep <= 0 ? 'mdi:battery-outline' : `mdi:battery-${socStep}`));
                    const content = `<span class="stat-label">${this._localize('card.soc')}</span><div class="${rowClass}" style="color: ${color}"><ha-icon icon="${iconName}"></ha-icon><span>${valStr}</span></div>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(soc_entity); };
                });
            } else idx += removeElement(statsContainer, 'stat-soc');
            
            let deltaContent = null;
            let deltaEntity = null;
            let deltaColor = '';
            
            if (cell_diff_sensor && diffVal !== null) {
                deltaEntity = cell_diff_sensor;
                deltaColor = (diffVal > 20) ? '#ef5350' : '#66bb6a';
                deltaContent = `<span class="stat-label">${this._localize('card.delta')}</span><div class="${rowClass}" style="color: ${deltaColor}"><ha-icon icon="mdi:delta"></ha-icon><span>${Math.round(diffVal)} <span style="font-size:0.8em">mV</span></span></div>`;
            } else if (show_voltage_diff && maxIdx !== -1 && minIdx !== -1) {
                deltaEntity = null; 
                const calcDiff = (maxV - minV) * 1000;
                deltaColor = (calcDiff > 20) ? '#ef5350' : '#66bb6a';
                deltaContent = `<span class="stat-label">${this._localize('card.delta')}</span><div class="${rowClass}" style="color: ${deltaColor}"><ha-icon icon="mdi:delta"></ha-icon><span>${Math.round(calcDiff)} <span style="font-size:0.8em">mV</span></span></div>`;
            }

            if (deltaContent) {
                idx += updateElement(statsContainer, 'stat-delta', idx, (el) => {
                    el.className = 'stat-item';
                    if(el.innerHTML !== deltaContent) el.innerHTML = deltaContent;
                    if(deltaEntity) {
                        el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(deltaEntity); };
                        el.style.cursor = 'pointer';
                    } else {
                        el.onclick = null; el.style.cursor = 'default';
                    }
                });
            } else idx += removeElement(statsContainer, 'stat-delta');
            
            if (show_average) {
                idx += updateElement(statsContainer, 'stat-avg', idx, (el) => {
                    el.className = 'stat-item';
                    let sum = 0; let count = 0; cellValues.forEach(v => { if(v !== undefined) { sum += v; count++; } });
                    const avg = count > 0 ? (sum / count).toFixed(3) : '-';
                    const content = `<span class="stat-label">${this._localize('card.avg_cell')}</span><div class="${rowClass}" style="color: var(--secondary-text-color)"><ha-icon icon="mdi:chart-bell-curve"></ha-icon><span>${avg} <span style="font-size:0.8em">V</span></span></div>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = null; el.style.cursor = 'default';
                });
            } else idx += removeElement(statsContainer, 'stat-avg');
        }

        // --- CELLS UPDATE (Table or Bars) ---
        if (hide_bars && !show_as_table) return;

        if (show_as_table) {
            cells.forEach((cell, index) => {
                const item = this.shadowRoot.getElementById(`table-item-${index}`);
                const valLabel = this.shadowRoot.getElementById(`table-val-${index}`);
                
                if (item && valLabel) {
                    const displayValNum = cellValues[index] || 0;
                    const displayVal = displayValNum > 0 ? `${displayValNum.toFixed(3)} V` : '-';
                    if(valLabel.innerText !== displayVal) valLabel.innerText = displayVal;

                    item.classList.remove('min-cell', 'max-cell');
                    if (show_min_max && displayValNum > 0) {
                        if (index === minIdx) item.classList.add('min-cell');
                        if (index === maxIdx) item.classList.add('max-cell');
                    }
                }
            });
            return;
        }

        // --- BAR CHART UPDATE ---        
        const isStandard = (Math.abs(min_voltage - 2.60) < 0.01 && Math.abs(max_voltage - 3.65) < 0.01);
        let mapPoints = isStandard ? [2.60, 2.80, 3.00, 3.20, 3.40, 3.45, 3.55, 3.65] : [];
        if (!isStandard) {
             const range = max_voltage - min_voltage; const step = range / 7;
             for (let i = 0; i <= 7; i++) mapPoints.push(min_voltage + (step * i));
        }
        const segmentSize = 100 / 7;

        cells.forEach((cell, index) => {
            const bar = this.shadowRoot.getElementById(`bar-${index}`);
            const valLabel = this.shadowRoot.getElementById(`val-${index}`);
            const wrapper = this.shadowRoot.getElementById(`cell-wrap-${index}`);
            const tooltip = this.shadowRoot.getElementById(`tooltip-${index}`);
            
            if (bar && valLabel && wrapper) {
                const displayValNum = cellValues[index] || 0;
                const displayVal = displayValNum > 0 ? `${displayValNum.toFixed(3)} V` : '-';
                
                wrapper.classList.remove('min-cell', 'max-cell');
                if (show_min_max && displayValNum > 0) {
                    if (index === minIdx) wrapper.classList.add('min-cell');
                    if (index === maxIdx) wrapper.classList.add('max-cell');
                }
                
                let pct = 0;
                if (displayValNum > 0) {
                    if (displayValNum <= mapPoints[0]) pct = 0; else if (displayValNum >= mapPoints[7]) pct = 100;
                    else {
                        for (let i = 0; i < 7; i++) {
                            if (displayValNum >= mapPoints[i] && displayValNum < mapPoints[i+1]) {
                                 const rel = (displayValNum - mapPoints[i]) / (mapPoints[i+1] - mapPoints[i]);
                                 pct = (i * segmentSize) + (rel * segmentSize);
                                 break;
                            }
                        }
                    }
                }
                
                // --- COLOR LOGIC ---
                let color = '#363694'; // DEBUG Default
                if (cell_bar_color === 'delta') { // Dynamic Color based on delta
                    color = this._lerpColor(cell_bar_bottom_color, cell_bar_top_color, displayValNum, minV, maxV);
                    //console.log('Delta Color:', { displayValNum, minV, maxV, color });
                }
                else if (cell_bar_color === 'range') { // Dynamic Color based on mapPoints
                    color = '#d32f2f'; // Default Red (Below point 1)
                    if (displayValNum >= mapPoints[6]) color = '#ff7043'; // Orange-Red (High)
                    else if (displayValNum >= mapPoints[5]) color = '#1565c0'; // Dark Blue
                    else if (displayValNum >= mapPoints[4]) color = '#42a5f5'; // Blue
                    else if (displayValNum >= mapPoints[3]) color = '#43a047'; // Green (Center)
                    else if (displayValNum >= mapPoints[2]) color = '#ffd600'; // Yellow
                    else if (displayValNum >= mapPoints[1]) color = '#ffa726'; // Orange 
                }
                else { // Static Color 
                    color = cell_bar_color;
                }
                bar.style.background = color;
                
                // --- BAR SIZE LOGIC ---
                if (horizontal_layout) {
                    bar.style.width = `${pct}%`;
                    bar.style.height = '100%';
                } else {
                    bar.style.width = '100%';
                    bar.style.height = `${pct}%`;
                }

                // --- BAR ANIMATION LOGIC ---
                // (vorher: cell.charge_state - wird nirgends gesetzt, dadurch lief die Animation nie)
                bar.classList.toggle('is-charging', isCharging);
                bar.classList.toggle('is-discharging', isDischarging);
                
                // --- VALUE LOGIC ---
                valLabel.innerText = displayVal;
                if (tooltip) tooltip.innerText = displayVal;
            }
        });
    }

    // DETAILED VIEW (Dashboard)
    // =========================================================================
    _renderDetailedView() {


        const { cells = [], show_cell_list, show_charts, show_standard_in_detail, card_height, cell_gap, show_values, min_voltage, max_voltage, thicker_borders, hide_bars, horizontal_layout, show_as_table, cell_bar_opacity, cell_background_opacity } = this._config;
        const colors = this._getColors();
        
        // --- LOGIK FÜR STANDARD ANSICHT KOPIEREN (falls aktiviert) ---
        let standardCss = '';
        let standardHtml = '';
        
        if (show_standard_in_detail) {
             const cellCount = cells.length;
             let valDisplay = show_values ? 'inline-block' : 'none';
             let nameFontSize = '10px'; let namePadding = '2px 6px'; let borderWidth = thicker_borders ? '2px' : '1px';
             if (cellCount > 10) { valDisplay = 'none'; nameFontSize = '9px'; namePadding = '1px 3px'; }

             const isStandard = (Math.abs(min_voltage - 2.60) < 0.01 && Math.abs(max_voltage - 3.65) < 0.01);
             let mapPoints = isStandard ? [2.60, 2.80, 3.00, 3.20, 3.40, 3.45, 3.55, 3.65] : [];
             if (!isStandard) {
                 const range = max_voltage - min_voltage; const step = range / 7;
                 for (let i = 0; i <= 7; i++) mapPoints.push(Math.round((min_voltage + (step * i)) * 1000) / 1000);
             }
             let scaleLabels = horizontal_layout ? [...mapPoints].map(v=>v.toFixed(2)+'V') : [...mapPoints].reverse().map(v=>v.toFixed(2)+'V');
             
             standardCss = `
                .standard-view-wrapper {
                    display: block; margin-top: 0px; 
                    --cell-gap: ${cell_gap}px; --badge-bg-color: rgba(0, 0, 0, 0.5); --val-display: ${valDisplay}; --name-fs: ${nameFontSize}; --name-pad: ${namePadding}; --bar-border-width: ${borderWidth}; --main-display: ${show_as_table || hide_bars ? 'none' : 'flex'}; --main-direction: ${horizontal_layout ? 'column' : 'row'}; --bar-transition: ${horizontal_layout ? 'width' : 'height'} 0.4s ease-out; --legend-direction: ${horizontal_layout ? 'row' : 'column'}; --legend-align: ${horizontal_layout ? 'space-between' : 'space-between'}; --legend-border: ${horizontal_layout ? 'none' : '1px solid rgba(255,255,255,0.1)'}; --legend-border-top: ${horizontal_layout ? '1px solid rgba(255,255,255,0.1)' : 'none'};
                    height: ${(hide_bars || horizontal_layout || show_as_table) ? 'auto' : '260px'};
                    position: relative;
                }
                /* Hier Kopie des CSS der Standard View */
                .main-container.cells-container { flex: 1; display: var(--main-display); flex-direction: var(--main-direction); gap: var(--cell-gap); align-items: ${horizontal_layout ? 'stretch' : 'flex-end'}; position: relative; overflow: hidden; height: 100%; }
                ${horizontal_layout ? '.main-container.cells-container { overflow-y: auto !important; }' : ''}
                .table-container { display: ${show_as_table ? 'grid' : 'none'}; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 8px; width: 100%; overflow-y: auto; }
                .table-item { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid transparent; transition: all 0.2s; }
                .table-item.min-cell { border-color: #2196f3; background: rgba(33, 150, 243, 0.15); }
                .table-item.max-cell { border-color: #f44336; background: rgba(244, 67, 54, 0.15); }
                .table-name { font-size: 0.75rem; opacity: 0.7; margin-bottom: 2px; } .table-val { font-size: 0.95rem; font-weight: bold; white-space: nowrap; }
                .cell-wrapper.cell-item { flex: 1; ${horizontal_layout ? 'height: 50px; min-height: 50px;' : 'height: 100%;'} width: 100%; position: relative; border-radius: 6px; overflow: visible; background: rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; ${horizontal_layout ? 'display: flex; align-items: center; justify-content: flex-start;' : ''} }
                .cell-wrapper.cell-item.min-cell { box-shadow: 0 0 8px rgba(33, 150, 243, 0.6) inset; border: 1px solid rgba(33, 150, 243, 0.5); }
                .cell-wrapper.cell-item.max-cell { box-shadow: 0 0 8px rgba(244, 67, 54, 0.6) inset; border: 1px solid rgba(244, 67, 54, 0.5); }
                .custom-tooltip { position: absolute; top: 20%; left: 50%; transform: translateX(-50%); background: rgba(30, 30, 30, 0.95); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; pointer-events: none; opacity: 0; transition: opacity 0.2s ease-in-out; z-index: 20; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 8px rgba(0,0,0,0.5); }
                .cell-wrapper:hover .custom-tooltip, .cell-wrapper.show-tooltip .custom-tooltip { opacity: 1; }
                .cell-track-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${this._getCellBackground()}; opacity: ${cell_background_opacity}; z-index: 0; border-radius: 6px; overflow: hidden; }
                .cell-bar { position: absolute; ${horizontal_layout ? 'top: 0; bottom: 0; left: 0;' : 'bottom: 0; left: 0; right: 0;'} background: pink; ${horizontal_layout ? 'border-right: var(--bar-border-width) solid rgba(255, 255, 255, 0.6);' : 'border-top: var(--bar-border-width) solid rgba(255, 255, 255, 0.6);'} z-index: 1; transition: var(--bar-transition); ${horizontal_layout ? 'border-radius: 0 4px 4px 0;' : 'border-radius: 4px 4px 0 0;'} opacity: ${cell_bar_opacity}; box-shadow: 0 -2px 8px rgba(0,0,0,0.3); overflow: hidden; }
                .cell-bar.is-charging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear; }
                .cell-bar.is-discharging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear reverse; }
                @keyframes shimmer-move-up { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } } @keyframes shimmer-move-right { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .charging-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to ${horizontal_layout ? 'right' : 'top'}, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 100%); z-index: 2; transform: ${horizontal_layout ? 'translateX(-100%)' : 'translateY(100%)'}; opacity: 0; pointer-events: none; }
                .cell-info-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; ${horizontal_layout ? 'display: flex; align-items: center; justify-content: space-between; padding: 0 8px;' : ''} }
                ${!horizontal_layout ? `.cell-name-wrap { position: absolute; bottom: 8px; width: 100%; text-align: center; } .cell-val-wrap { position: absolute; bottom: 34px; width: 100%; text-align: center; }` : `.cell-name-wrap { position: relative; } .cell-val-wrap { position: relative; margin-right: 12px; }`}
                .cell-name-badge { background: rgba(0,0,0,0.6); color: white; padding: var(--name-pad); font-size: var(--name-fs); border-radius: 4px; font-weight: bold; backdrop-filter: blur(2px); white-space: nowrap; }
                .cell-val-badge.cell-voltage { background: var(--badge-bg-color); color: #fff; padding: 4px 10px; font-size: 13px; border-radius: 12px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); display: var(--val-display); white-space: nowrap; }
                .legend-col { display: flex; flex-direction: var(--legend-direction); justify-content: var(--legend-align); ${horizontal_layout ? 'width: 100%; height: 20px; border-top: var(--legend-border-top); padding-top: 2px;' : 'height: 100%; padding-right: 8px; margin-right: 4px; border-right: var(--legend-border); min-width: 40px;'} font-size: 11px; color: var(--secondary-text-color); text-align: right; font-weight: 500; }
             `;
             
            if (show_as_table) {
                standardHtml = `<div class="standard-view-wrapper"><div class="table-container">${cells.map((cell, index) => `<div class="table-item" id="table-item-${index}"><span class="table-name">${this._esc(cell.name || (index + 1))}</span><span class="table-val" id="table-val-${index}">-</span></div>`).join('')}</div></div>`;
            } 
            else if (!horizontal_layout) {
                standardHtml = `<div class="standard-view-wrapper"><div class="main-container cells-container">${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}</div></div>`;
            } 
            else {
                standardHtml = `<div class="standard-view-wrapper"><div class="main-container cells-container">${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}</div></div>`;
            }
        }

        const style = `
            <style>
                :host { display: block; --card-padding: 12px; }
                ha-card {
                    padding: var(--card-padding); box-sizing: border-box; 
                    color: ${colors.text}; font-family: var(--paper-font-body1_-_font-family);
                    display: grid; gap: 12px;
                }
                .row { display: grid; gap: 12px; }
                .col-2 { grid-template-columns: 1fr 1fr; }
                .col-3 { grid-template-columns: 1fr 1fr 1fr; }
                
                .box { background: rgba(var(--rgb-primary-text-color), 0.04); border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; position: relative; overflow: hidden; min-width: 0; }
                .clickable { cursor: pointer; transition: background 0.2s; }
                .clickable:active { background: rgba(var(--rgb-primary-text-color), 0.08); }
                
                .box-title { font-size: 0.85rem; color: var(--secondary-text-color); font-weight: 500; display: flex; justify-content: space-between; margin-bottom: 2px; pointer-events: none; }
                .box-val-row { font-size: 1.8rem; font-weight: 400; line-height: 1; display: flex; align-items: baseline; gap: 4px; pointer-events: none; margin-bottom: 4px; }
                .unit { font-size: 1rem; color: var(--secondary-text-color); font-weight: 400; }
                
                .chart-box { height: 110px; justify-content: space-between; }
                .chart-meta { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; font-size: 0.8rem; color: var(--secondary-text-color); margin-top: auto; }
                .max-val-red { color: #e53935; font-weight: bold; }
                .min-val-blue { color: #1e88e5; font-weight: bold; }
                
                /* Diagramm randlos über die volle Boxbreite: negative Ränder gleichen das Box-Padding (14px) aus.
                   Das Canvas liegt absolut im Container, damit Chart.js immer die Containergröße übernimmt. */
                .chart-container-full {
                    flex: 1 1 auto;
                    position: relative;
                    align-self: stretch;
                    width: auto;
                    min-width: 0;
                    min-height: 0;
                    margin: 0 -14px;
                    overflow: hidden;
                }
                .chart-container-full canvas {
                    position: absolute; top: 0; left: 0;
                    width: 100% !important; height: 100% !important;
                    display: block;
                }
                
                .status-row { display: flex; gap: 12px; width: 100%; }
                .status-pill { flex: 1; background: rgba(var(--rgb-primary-text-color), 0.04); border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.9rem; font-weight: 500; user-select: none; transition: background 0.2s; }
                .status-pill.interactive { cursor: pointer; }
                .status-pill.interactive:active { background: rgba(var(--rgb-primary-text-color), 0.1); }
                .status-val { font-weight: 700; }
                .status-on { color: #43a047; }
                .status-off { color: #1e88e5; }
                
                .big-stat { align-items: center; justify-content: center; padding: 16px 8px; }
                .big-stat .box-val { font-size: 1.4rem; font-weight: 700; }
                .val-green { color: #43a047; }
                .val-blue { color: #03a9f4; }
                
                .soc-box { align-items: center; justify-content: center; padding: 14px; }
                .soc-title { font-size: 1rem; font-weight: 700; margin-right: 8px; }
                .box-val-soc { font-size: 1.4rem; font-weight: 400; }
                
                .detail-list { font-size: 0.85rem; display: flex; flex-direction: column; gap: 0; color: var(--primary-text-color); }
                .detail-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .detail-item:last-child { border-bottom: none; }
                .detail-label { color: var(--secondary-text-color); }
                .detail-val-txt { font-weight: 500; color: #4caf50; }
                .detail-val-txt.temp { color: #42a5f5; }
                
                .cell-list-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 8px; }
                .cell-list-col { display: flex; flex-direction: column; gap: 0; }
                .cell-text-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 5px 6px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .cell-text-row:last-child { border-bottom: none; }
                .cell-num { color: var(--secondary-text-color); margin-right: 6px; width: 24px; }
                .cell-v { font-weight: bold; font-family: monospace; }
                .cell-bal { color: var(--secondary-text-color); font-size: 0.75rem; margin-left: 4px; }
                .cell-res { color: var(--secondary-text-color); font-size: 0.75rem; margin-left: auto; margin-right: 8px; align-self: center; }
                .bal-led { display: inline-block; width: 10px; height: 10px; border-radius: 50%; vertical-align: middle; background: var(--disabled-text-color, #9e9e9e); opacity: 0.5; }
                .bal-led.on { background: #4caf50; opacity: 1; box-shadow: 0 0 6px #4caf50; }
                .detail-title { font-size: 1.3rem; font-weight: 500; letter-spacing: 0.5px; padding: 0 4px; }
                .status-summary { justify-content: center; align-items: center; flex-direction: row; gap: 8px; padding: 10px; font-size: 0.9rem; font-weight: 500; }
                .status-summary .status-val { font-weight: 700; }
                .status-row.has-heater { flex-wrap: wrap; }
                .status-row.has-heater .status-pill { flex: 1 1 40%; }
                
                /* JK-BMS: Alarm, Ladephase, Temperaturen */
                .jk-alarm { border-radius: 8px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; font-weight: 600; cursor: pointer; }
                .jk-alarm.ok { background: rgba(67,160,71,0.12); color: #43a047; font-weight: 500; padding: 6px 14px; }
                .jk-alarm.bad { background: rgba(229,57,53,0.18); color: #e53935; border: 1px solid rgba(229,57,53,0.5); animation: jk-pulse 2s infinite; }
                .jk-alarm .jk-alarm-txt { flex: 1; white-space: normal; }
                @keyframes jk-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(229,57,53,0.4); } 50% { box-shadow: 0 0 0 6px rgba(229,57,53,0); } }
                .jk-row { display: flex; gap: 12px; flex-wrap: wrap; }
                .jk-pill { flex: 1 1 0; min-width: 70px; background: rgba(var(--rgb-primary-text-color), 0.04); border-radius: 8px; padding: 8px 10px; display: flex; flex-direction: column; align-items: center; gap: 2px; cursor: pointer; }
                .jk-pill .jk-lbl { font-size: 0.75rem; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.4px; }
                .jk-pill .jk-val { font-size: 1.05rem; font-weight: 600; }
                .jk-temps { display: grid; gap: 12px; }
                .jk-settings { padding: 0; }
                .jk-settings summary { cursor: pointer; padding: 12px 14px; display: flex; align-items: center; gap: 8px; font-weight: 600; list-style: none; }
                .jk-settings summary::-webkit-details-marker { display: none; }
                .jk-settings summary::after { content: '▸'; margin-left: auto; transition: transform .2s; color: var(--secondary-text-color); }
                .jk-settings[open] summary::after { transform: rotate(90deg); }
                .jk-set-hint { font-weight: 400; font-size: 0.75rem; color: var(--secondary-text-color); }
                .jk-set-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; padding: 0 14px 12px; }
                .jk-set-group { display: flex; flex-direction: column; gap: 2px; }
                .jk-set-head { font-size: 0.72rem; text-transform: uppercase; letter-spacing: .5px; color: var(--secondary-text-color); margin: 6px 0 2px; }
                .jk-set-row { display: flex; justify-content: space-between; gap: 8px; font-size: 0.85rem; padding: 2px 0; border-bottom: 1px dashed rgba(127,127,127,.2); }
                .jk-set-val { font-weight: 600; white-space: nowrap; }
                .jk-set-apponly { padding: 0 14px 12px; font-size: 0.75rem; color: var(--secondary-text-color); }
                @media (max-width: 500px) { .jk-set-grid { grid-template-columns: 1fr; } }
                .jk-phase { flex-direction: row; justify-content: center; gap: 10px; }
                .jk-info { display: flex; flex-wrap: nowrap; gap: 6px; justify-content: center; align-items: center; min-width: 0; }
                .jk-info .jk-chip { white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
                .jk-info .jk-chip.icon-only { flex: none; padding: 3px 7px; }
                .jk-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 12px; font-size: 0.85rem; background: rgba(var(--rgb-primary-text-color), 0.05); cursor: pointer; }
                .jk-chip ha-icon { --mdc-icon-size: 16px; }
                .jk-chip .jk-lbl { font-size: 0.7rem; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.4px; }
                .jk-chip.warn { color: #ffa726; background: rgba(255,167,38,0.12); }
                .jk-chip.ok { color: #43a047; background: rgba(67,160,71,0.12); }
                .jk-temps .jk-pill { padding: 4px 6px; min-width: 0; }
                .jk-temps .jk-pill .jk-lbl { font-size: 0.65rem; }
                .jk-temps .jk-pill .jk-val { font-size: 0.9rem; }
                .cell-res.res-max { color: #ffa726; font-weight: 700; }

                @media (max-width: 500px) { .col-3 { grid-template-columns: 1fr; } .cell-list-grid { grid-template-columns: 1fr; } }
                
                ${standardCss}
            </style>
        `;

        // Issue #3: title in the detailed view (only if the user has set one and it is not switched off)
        const detailTitle = (this._userTitle && this._config.show_title_in_detail !== false) ? this._userTitle : '';

        const html = `
            <ha-card>
                ${detailTitle ? `<div class="detail-title">${this._esc(detailTitle)}</div>` : ''}
                ${this._jkInfoEnabled() ? this._renderJkBlockHtml() : ''}
                ${show_charts !== false ? `
                <div class="row col-2">
                    <div class="box chart-box clickable" data-entity="${this._config.total_voltage_entity}" id="chart-voltage">
                        <div class="box-title">
                            <span>${this._localize('card.batt_voltage')}</span>
                            <span style="color:#039be5">V</span>
                        </div>
                        <div class="box-val-row"><span id="d-total-volt">--</span> <span class="unit">V</span></div>
                        <div class="chart-container-full"><canvas id="canvas-voltage"></canvas></div>
                        <div class="chart-meta">
                            <span>${this._localize('card.max_cell')} : <span id="d-max-cell-val" class="max-val-red clickable">--</span></span>
                            <span>${this._localize('card.min_cell')} : <span id="d-min-cell-val" class="min-val-blue clickable">--</span></span>
                        </div>
                    </div>
                    
                    <div class="box chart-box clickable" data-entity="${this._config.cell_diff_sensor}" id="chart-delta">
                        <div class="box-title">
                            <span>${this._localize('card.delta_cell_vol')}</span>
                            <ha-icon icon="mdi:delta" style="width:16px; height:16px; color:#1e88e5"></ha-icon>
                        </div>
                        <div class="box-val-row"><span id="d-delta-val">--</span> <span class="unit">mV</span></div>
                        <div class="chart-container-full"><canvas id="canvas-delta"></canvas></div>
                        <div class="chart-meta">
                            <span>${this._localize('card.max_cell')} : <span id="d-max-cell-idx" class="max-val-red">--</span></span>
                            <span>${this._localize('card.min_cell')} : <span id="d-min-cell-idx" class="min-val-blue">--</span></span>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${this._config.show_status ? `
                <div class="box status-summary">
                    <span>${this._localize('card.status')} :</span> <span class="status-val" id="d-status">--</span>
                </div>
                ` : ''}

                <div class="status-row ${this._config.stat_heater_entity ? 'has-heater' : ''}">
                    <div class="status-pill" id="btn-charge">
                        <span>${this._localize('card.charge')} :</span> <span class="status-val" id="d-stat-charge">--</span>
                    </div>
                    <div class="status-pill" id="btn-discharge">
                        <span>${this._localize('card.discharge')} :</span> <span class="status-val" id="d-stat-discharge">--</span>
                    </div>
                    <div class="status-pill" id="btn-balance">
                        <span>${this._localize('card.balance')} :</span> <span class="status-val" id="d-stat-balance">--</span>
                    </div>
                    ${this._config.stat_heater_entity ? `
                    <div class="status-pill" id="btn-heater">
                        <span>${this._localize('card.heater')} :</span> <span class="status-val" id="d-stat-heater">--</span>
                    </div>
                    ` : ''}
                </div>

                <div class="row col-3">
                    <div class="box big-stat clickable" data-entity="${this._config.total_voltage_entity}">
                        <span id="d-big-volt" class="box-val val-green">-- V</span>
                    </div>
                    <div class="box big-stat clickable" data-entity="${this._config.total_current_entity}">
                        <span id="d-big-curr" class="box-val val-green">-- A</span>
                    </div>
                    <div class="box big-stat clickable" data-entity="${this._config.watt_entity}">
                        <span id="d-big-watt" class="box-val val-green">-- W</span>
                    </div>
                </div>

                <div class="row col-2">
                     <div class="box soc-box clickable" data-entity="${this._config.soc_entity}" style="flex-direction:row;">
                        <span class="soc-title">${this._localize('card.soc')} :</span> <span id="d-soc" class="box-val-soc" style="color:#4caf50;">-- %</span>
                     </div>
                     <div class="box soc-box clickable" data-entity="${this._config.soh_entity}" style="flex-direction:row;">
                        <span class="soc-title">${this._localize('card.soh')} :</span> <span id="d-soh" class="box-val-soc" style="color:#4caf50;">-- %</span>
                     </div>
                </div>

                <div class="row col-2">
                    <div class="box detail-list" id="d-list-left"></div>
                    <div class="box detail-list" id="d-list-right"></div>
                </div>
                ${show_cell_list !== false ? `<div class="box" style="padding: 10px;"><div class="cell-list-grid" id="d-cell-list"></div></div>` : ''}
                ${this._jkSettingsEnabled() ? this._renderJkSettingsHtml() : ''}
                
                ${standardHtml}
            </ha-card>
        `;

        this.shadowRoot.innerHTML = style + html;

        this.shadowRoot.querySelector('ha-card').addEventListener('click', (e) => {
            const target = e.target.closest('.clickable');
            if (target && target.dataset.entity && target.dataset.entity !== 'undefined') {
                e.stopPropagation();
                this._fireMoreInfo(target.dataset.entity);
            }
        });
        
        if (show_standard_in_detail) {
            this._setupTooltips();
        }

        this.shadowRoot.getElementById('btn-charge')?.addEventListener('click', (e) => {
            e.stopPropagation(); this._handleSwitchAction(this._config.stat_charge_entity, this._config.stat_charge_on, this._config.stat_charge_off);
        });

        this.shadowRoot.getElementById('btn-discharge')?.addEventListener('click', (e) => {
             e.stopPropagation(); this._handleSwitchAction(this._config.stat_discharge_entity, this._config.stat_discharge_on, this._config.stat_discharge_off);
        });

        this.shadowRoot.getElementById('btn-heater')?.addEventListener('click', (e) => {
             e.stopPropagation(); this._handleSwitchAction(this._config.stat_heater_entity, this._config.stat_heater_on, this._config.stat_heater_off);
        });

        this.shadowRoot.getElementById('btn-balance')?.addEventListener('click', (e) => {
             e.stopPropagation(); 
             if(this._config.stat_balance_entity) {
                this._handleSwitchAction(this._config.stat_balance_entity, this._config.stat_balance_on, this._config.stat_balance_off);
             }
        });
        
        this._initCharts();
    }



    // --- JK-BMS: Alarmbanner, Ladephase, Temperaturfühler -----------------------------------------
    _renderJkBlockHtml() {
        const c = this._config;
        const temps = JK_TEMPS.filter(k => c[k]);
        // Kompakte Info-Zeile: Ladephase + Hinweise (nur wenn aktiv). Leer -> ausgeblendet.
        const phase = (c.charge_status_entity || c.charger_entity || c.precharge_entity || c.balancer_status_entity) ? `
            <div class="jk-info" id="jk-info">
                ${c.charge_status_entity ? `<span class="jk-chip clickable" id="jk-phase-chip" data-entity="${c.charge_status_entity}"><span class="jk-lbl">${this._localize('card.charge_phase')}</span> <b id="jk-phase">--</b></span>` : ''}
                ${c.balancer_status_entity ? `<span class="jk-chip warn clickable icon-only" id="jk-chip-balancer" data-entity="${c.balancer_status_entity}"><ha-icon icon="mdi:scale-balance"></ha-icon></span>` : ''}
                ${c.charger_entity ? `<span class="jk-chip ok clickable icon-only" id="jk-chip-charger" data-entity="${c.charger_entity}" title="${this._localize('card.charger')}"><ha-icon icon="mdi:power-plug"></ha-icon></span>` : ''}
                ${c.precharge_entity ? `<span class="jk-chip ok clickable icon-only" id="jk-chip-precharge" data-entity="${c.precharge_entity}" title="${this._localize('card.precharge')}"><ha-icon icon="mdi:flash"></ha-icon></span>` : ''}
            </div>` : '';
        const tempPills = temps.map((k, i) => `
            <div class="jk-pill clickable" data-entity="${c[k]}">
                <span class="jk-lbl">T${i + 1}</span>
                <span class="jk-val" id="jk-${k}">--</span>
            </div>`).join('');
        const alarm = (c.alarm_entity || c.alarm_list_entity) ? `
            <div class="jk-alarm ok clickable" id="jk-alarm" data-entity="${c.alarm_list_entity || c.alarm_entity}">
                <ha-icon id="jk-alarm-icon" icon="mdi:shield-check"></ha-icon><span class="jk-alarm-txt" id="jk-alarm-txt">--</span>
            </div>` : '';
        const tempsRow = temps.length ? `<div class="jk-temps" style="grid-template-columns: repeat(${temps.length}, 1fr);">${tempPills}</div>` : '';
        // Schutzabschaltung (nur sichtbar, wenn ein Freigabe-Timer läuft)
        const prot = JK_PROT.some(([k]) => c[k]) ? `
            <div class="jk-alarm bad clickable" id="jk-prot" style="display:none" data-entity="">
                <ha-icon icon="mdi:timer-alert-outline"></ha-icon><span class="jk-alarm-txt" id="jk-prot-txt"></span>
            </div>` : '';
        return `${alarm}${prot}${phase}${tempsRow}`;
    }

    // Alarm aktiv? binary_sensor "on" oder eine Alarmliste, die nicht "No alarms"/leer ist
    _jkAlarmState() {
        const c = this._config;
        const active = c.alarm_entity ? String(this._getState(c.alarm_entity) || '').toLowerCase() === 'on' : false;
        const listRaw = c.alarm_list_entity ? this._getState(c.alarm_list_entity) : null;
        const list = listRaw && !['unknown', 'unavailable'].includes(listRaw) ? String(listRaw).trim() : '';
        const listIsAlarm = !!list && !/^no\s+(bms\s+)?alarms?$/i.test(list) && !/^(none|ok|0|-)$/i.test(list);
        return { alarm: active || listIsAlarm, text: listIsAlarm ? list : '' };
    }

    _updateJkBlock() {
        const c = this._config;
        const root = this.shadowRoot;
        const show = (id, on) => { const el = root.getElementById(id); if (el) el.style.display = on ? '' : 'none'; };
        const box = root.getElementById('jk-alarm');
        if (box) {
            const { alarm, text } = this._jkAlarmState();
            box.classList.toggle('bad', alarm); box.classList.toggle('ok', !alarm);
            const icon = root.getElementById('jk-alarm-icon');
            if (icon) icon.setAttribute('icon', alarm ? 'mdi:alert' : 'mdi:shield-check');
            const txt = root.getElementById('jk-alarm-txt');
            if (txt) txt.innerText = alarm ? `${this._localize('card.alarm')}: ${text || 'BMS'}` : this._localize('card.no_alarm');
        }
        const ph = root.getElementById('jk-phase');
        if (ph) {
            const s = this._getState(c.charge_status_entity);
            const secs = c.charge_status_seconds_entity ? this._parseNumber(c.charge_status_seconds_entity) : null;
            const dur = secs !== null ? (secs > 0 ? this._formatDuration(secs, true) : null)
                : (c.charge_status_time_entity ? this._getState(c.charge_status_time_entity) : null);
            const valid = (v) => v && !['unknown', 'unavailable'].includes(v);
            const showDur = valid(dur) && !/^0\s*s?$/i.test(String(dur).trim());
            ph.innerText = valid(s) ? `${s}${showDur ? ' · ' + dur : ''}` : '--';
            // Slave-BMS hinter einem Master führen keine eigene Ladephase (Zähler bleibt 0) -> ausblenden
            show('jk-phase-chip', !(secs !== null && secs === 0) && valid(s));
            const lower = String(s || '').toLowerCase();
            ph.style.color = lower.includes('float') ? '#03a9f4' : (lower.includes('absorp') ? '#ffa726' : (lower.includes('bulk') ? '#43a047' : ''));
        }
        // Schutzabschaltung: laufende Freigabe-Timer anzeigen
        const protBox = root.getElementById('jk-prot');
        if (protBox) {
            const active = JK_PROT.map(([k, l]) => [k, l, this._parseNumber(c[k])]).filter(([, , v]) => v !== null && v > 0);
            protBox.style.display = active.length ? '' : 'none';
            protBox.dataset.entity = active.length ? c[active[0][0]] : '';
            const t = root.getElementById('jk-prot-txt');
            if (t) t.innerText = active.map(([, l, v]) => `${this._localize(l)}: ${Math.round(v)} s`).join(' · ');
        }
        const isOn = (k) => !!c[k] && String(this._getState(c[k]) || '').toLowerCase() === 'on';
        show('jk-chip-charger', isOn('charger_entity'));
        show('jk-chip-precharge', isOn('precharge_entity'));
        const balTxt = this._jkBalancerText();
        show('jk-chip-balancer', !!balTxt);
        const bc = root.getElementById('jk-chip-balancer');
        if (bc) bc.title = balTxt || '';
        const info = root.getElementById('jk-info');
        if (info) info.style.display = [...info.children].some(ch => ch.style.display !== 'none') ? '' : 'none';
        JK_TEMPS.forEach(k => {
            const el = root.getElementById(`jk-${k}`);
            if (!el || !c[k]) return;
            const v = this._parseNumber(c[k]);
            const unit = this._getTempUnit(c[k]);
            el.innerText = v !== null ? `${v.toFixed(1)} ${unit}` : '--';
            const tc = v !== null ? this._tempToCelsius(v, unit) : null;
            el.style.color = tc === null ? '' : (tc < 5 ? '#42a5f5' : (tc > 40 ? '#ef5350' : ''));
        });
    }

    // Balancer-Status als Text, null wenn aus/unbekannt
    _jkBalancerText() {
        const c = this._config;
        if (!c.balancer_status_entity) return null;
        const raw = String(this._getState(c.balancer_status_entity) || '').toLowerCase();
        const map = { 'charging balancer': 'card.bal_charge', 'discharging balancer': 'card.bal_discharge' };
        return map[raw] ? this._localize(map[raw]) : null;
    }

    // Sekunden lesbar und in der HA-Sprache, z. B. "2 Min. 44 s", "3 Std. 5 Min.", "12 T 4 Std."
    _formatDuration(totalSeconds, withSeconds = true) {
        if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return null;
        const u = (k) => this._localize(`card.unit_${k}`);
        let sec = Math.max(0, Math.floor(totalSeconds));
        const d = Math.floor(sec / 86400); sec %= 86400;
        const h = Math.floor(sec / 3600); sec %= 3600;
        const m = Math.floor(sec / 60); const s = sec % 60;
        const parts = [];
        if (d) parts.push(`${d} ${u('d')}`);
        if (h || d) parts.push(`${h} ${u('h')}`);
        if (!d) parts.push(`${m} ${u('min')}`);
        if (withSeconds && !d && !h) parts.push(`${s} ${u('s')}`);
        return parts.join(' ');
    }

    // Widerstand lesbar: Werte < 1 Ω als mΩ
    _formatResistance(entityId) {
        const r = this._parseNumber(entityId);
        if (r === null) return { str: '--', mohm: null };
        const unit = this._getUnit(entityId);
        const u = unit.toLowerCase();
        let mohm = null;
        if (u === 'mω' || u === 'mohm') mohm = r;
        else if (u === 'ω' || u === 'ohm' || u === '') mohm = r * 1000;
        if (mohm !== null) return { str: `${Math.round(mohm)} mΩ`, mohm };
        return { str: `${parseFloat(r.toFixed(3))} ${unit}`, mohm: null };
    }

    _getCellBackground() { 
        const { horizontal_layout, cell_background_color} = this._config;

        if (cell_background_color === 'gradient') {
            let direction = horizontal_layout ? 'to right' : 'to top';
            return "linear-gradient(" + direction + ", #d32f2f 0%, #ef5350 7%, #ffa726 14.28%, #ffd600 28.57%, #43a047 42.85%, #42a5f5 57.14%, #1565c0 71.42%, #ff7043 85.71%, #ff5722 100%)";
        }

        return cell_background_color && cell_background_color.length > 0 ? cell_background_color : 'var(--card-background-color, #1c1c1e)';
    }

    _lerpColor(bottom, top, value, min, max) {
        // Clamp + normalize
        const t = max === min ? 0 : (value - min) / (max - min);
        const clamped = Math.min(1, Math.max(0, t));
      
        // Convert hex → RGB
        const c1 = this._hexToRgb(bottom);
        const c2 = this._hexToRgb(top);
      
        // Interpolate channels
        const r = Math.round(c1.r + (c2.r - c1.r) * clamped);
        const g = Math.round(c1.g + (c2.g - c1.g) * clamped);
        const b = Math.round(c1.b + (c2.b - c1.b) * clamped);
      
        //console.log('Lerp Color:', { value, min, max, t, clamped, c1, c2, r, g, b });

        return `rgb(${r}, ${g}, ${b})`;
    }
      
    _hexToRgb(hex) {
        const clean = hex.replace('#', '');
        const bigint = parseInt(clean.length === 3
          ? clean.split('').map(c => c + c).join('')
          : clean, 16);
      
        return {
          r: (bigint >> 16) & 255,
          g: (bigint >> 8) & 255,
          b: bigint & 255
        };
    }

    _getColors() {
        return { bg: 'var(--card-background-color, #1c1c1e)', text: 'var(--primary-text-color, #ffffff)', textSecondary: 'var(--secondary-text-color, #9e9e9e)' };
    }

    _updateValues() {
        if (!this._initialized || !this._hass) return;
        if (this._config.show_detailed_view) {
            this._updateDetailedValues();
            return;
        }
        this._updateStandardValues();
    }

    _updateDetailedValues() {
        const c = this._config;
        // Nur schreiben, wenn sich der Inhalt geändert hat: die Karte wird bei jeder Zustandsänderung
        // einer ihrer Entitäten aufgerufen, ein Neuaufbau des DOM ist dabei meist unnötig.
        const setHtml = (el, html) => { if (el && el.__lastHtml !== html) { el.innerHTML = html; el.__lastHtml = html; } };
        const setTxt = (id, val) => setHtml(this.shadowRoot.getElementById(id), String((val !== null && val !== undefined) ? val : '--'));
        const setStyle = (id, prop, val) => { const el = this.shadowRoot.getElementById(id); if(el) el.style[prop] = val; };

        // --- HELPER FUNCTION DEFINE FIRST ---
        const isStateOn = (current, customOn) => {
            if (!current) return false;
            const curStr = String(current).trim();
            if (customOn && String(customOn).trim() !== '') { 
                return curStr.toLowerCase() === String(customOn).trim().toLowerCase(); 
            }
            const lower = curStr.toLowerCase();
            return (lower === 'on' || lower === 'true' || lower === 'balancing');
        };

        const vTotal = this._parseNumber(c.total_voltage_entity);
        const iTotal = this._parseNumber(c.total_current_entity);
        const pTotal = this._readPower();
        const delta  = this._parseNumber(c.cell_diff_sensor);
        const soc    = this._parseNumber(c.soc_entity);
        const soh    = this._parseNumber(c.soh_entity);
        
        const leftList = []; const rightList = [];
        
        const addIfConf = (list, confKey, labelKey, unit, isTemp=false, fixed=null) => {
            if (!c[confKey]) return;
            let val = this._parseNumber(c[confKey]);
            if (val !== null && fixed !== null) {
                val = val.toFixed(fixed);
            }
            // Issue #12: temperatures use the unit of the entity (°C / °F / K)
            if (isTemp) unit = this._getTempUnit(c[confKey]);

            const valStr = val !== null ? val + (unit ? ' ' + unit : '') : '--';
            const cls = isTemp ? 'detail-val-txt temp' : 'detail-val-txt';
            list.push(`<div class="detail-item clickable" data-entity="${c[confKey]}"><span class="detail-label">${this._localize(labelKey)} :</span><span class="${cls}">${valStr}</span></div>`);
        };
		
        addIfConf(leftList, 'capacity_entity', 'card.batt_capacity', 'Ah', false, 0);
        addIfConf(leftList, 'cycle_capacity_entity', 'card.cycle_capacity', 'Ah', false, 0);
        
        // --- Calculate Min/Max and Sum ---
        let cellSum = 0; let cellCnt = 0; let minV = 999; let maxV = -999; let minIdx = -1; let maxIdx = -1; 
        c.cells.forEach((cell, i) => {
            const v = this._parseNumber(cell.entity);
            if (v !== null) {
                const val = this._toVolts(cell.entity, v);
                if (val < minV) { minV = val; minIdx = i; }
                if (val > maxV) { maxV = val; maxIdx = i; }
                cellSum += val; cellCnt++;
            }
        });
        const avgVal = cellCnt > 0 ? (cellSum / cellCnt).toFixed(3) + ' V' : '--';
        leftList.push(`<div class="detail-item"><span class="detail-label">${this._localize('card.avg_cell')} :</span><span class="detail-val-txt">${avgVal}</span></div>`);
        
        addIfConf(leftList, 'temp_entity', 'editor.temp', '°C', true, 1);
        if (c.battery_type_entity) {
            const bt = this._getState(c.battery_type_entity);
            leftList.push(`<div class="detail-item clickable" data-entity="${c.battery_type_entity}"><span class="detail-label">${this._localize('card.battery_type')} :</span><span class="detail-val-txt">${this._esc(bt && !['unknown','unavailable'].includes(bt) ? bt : '--')}</span></div>`);
        }
        // Heizstrom nur zeigen, wenn die Heizung läuft oder Strom fließt
        if (c.heating_current_entity) {
            const hc = this._parseNumber(c.heating_current_entity);
            const heaterOn = String(this._getState(c.stat_heater_entity) || '').toLowerCase() === 'on';
            if (heaterOn || (hc !== null && Math.abs(hc) > 0.01)) addIfConf(leftList, 'heating_current_entity', 'card.heating_current', 'A', false, 2);
        }
        
        if (c.capacity_entity && c.soc_entity) {
            const cap = this._parseNumber(c.capacity_entity);
            if(cap && soc !== null) {
                const rem = Math.round(cap * (soc/100)) + ' Ah';
                rightList.push(`<div class="detail-item"><span class="detail-label">${this._localize('card.remain_capacity')} :</span><span class="detail-val-txt">${rem}</span></div>`);
            }
        }
        addIfConf(rightList, 'cycle_count_entity', 'card.cycle_count', '');
        addIfConf(leftList, 'throughput_entity', 'card.throughput', 'Ah', false, 0);
        if (c.runtime_entity || c.runtime_seconds_entity) {
            const rtSec = c.runtime_seconds_entity ? this._parseNumber(c.runtime_seconds_entity) : null;
            const rt = rtSec !== null ? this._formatDuration(rtSec, false) : this._getState(c.runtime_entity);
            rightList.push(`<div class="detail-item clickable" data-entity="${c.runtime_entity || c.runtime_seconds_entity}"><span class="detail-label">${this._localize('card.runtime')} :</span><span class="detail-val-txt">${this._esc(rt && !['unknown','unavailable'].includes(rt) ? rt : '--')}</span></div>`);
        }
        
        // Issue #5: delta always in mV (unit_of_measurement of the sensor, fallback: value < 1 = Volt)
        let deltaDisplay = this._toMilliVolts(c.cell_diff_sensor, delta);
        if (deltaDisplay === null && maxV > 0 && minV < 999) deltaDisplay = (maxV - minV) * 1000;
        const deltaStr = deltaDisplay !== null ? (deltaDisplay/1000).toFixed(3) + ' V' : '--';
        const deltaEnt = c.cell_diff_sensor || '';
        const deltaClass = deltaEnt ? 'detail-item clickable' : 'detail-item';
        rightList.push(`<div class="${deltaClass}" data-entity="${deltaEnt}"><span class="detail-label">${this._localize('card.delta_cell_vol')} :</span><span class="detail-val-txt">${deltaStr}</span></div>`);
        
        addIfConf(rightList, 'temp_mos_entity', 'card.mos_temp', '°C', true, 1); // PR #13 (evilstan): 1 Nachkommastelle
        addIfConf(rightList, 'balance_current_entity', 'card.balance_current', 'A', false, 3);

        const leftEl = this.shadowRoot.getElementById('d-list-left');
        const rightEl = this.shadowRoot.getElementById('d-list-right');
        setHtml(leftEl, leftList.join(''));
        setHtml(rightEl, rightList.join(''));

        setTxt('d-total-volt', vTotal?.toFixed(2));
        setTxt('d-max-cell-val', maxV > 0 ? maxV.toFixed(3) : '--');
        const maxCellEl = this.shadowRoot.getElementById('d-max-cell-val');
        if (maxCellEl && maxIdx !== -1) { maxCellEl.dataset.entity = c.cells[maxIdx].entity; }

        setTxt('d-min-cell-val', minV < 999 ? minV.toFixed(3) : '--');
        const minCellEl = this.shadowRoot.getElementById('d-min-cell-val');
        if (minCellEl && minIdx !== -1) { minCellEl.dataset.entity = c.cells[minIdx].entity; }

        setTxt('d-delta-val', deltaDisplay !== null ? Math.round(deltaDisplay) : '--');
        setTxt('d-max-cell-idx', maxIdx !== -1 ? this._esc(c.cells[maxIdx].name || (maxIdx+1)) : '--');
        setTxt('d-min-cell-idx', minIdx !== -1 ? this._esc(c.cells[minIdx].name || (minIdx+1)) : '--');
        
        const stBal  = this._getState(c.stat_balance_entity);

        // --- CHECK GLOBAL BALANCE STATE ---
        const isBalGlobal = isStateOn(stBal, c.stat_balance_on);

        // --- OVERALL STATUS (Issue #3): charging / discharging / balancing / idle ---
        if (c.show_status) {
            const statusEl = this.shadowRoot.getElementById('d-status');
            if (statusEl) {
                const anyCellBalancing = c.cells.some(cell => cell.balance_entity && isStateOn(this._getState(cell.balance_entity)));
                const balancing = isBalGlobal || anyCellBalancing;
                // positive = charging, negative = discharging (same convention as the rest of the card)
                let flow = null;
                if (pTotal !== null && Math.abs(pTotal) > 0.1) flow = pTotal;
                else if (iTotal !== null && Math.abs(iTotal) > 0.05) flow = iTotal;
                const parts = []; let color = 'var(--secondary-text-color)';
                if (flow !== null && flow > 0)      { parts.push(this._localize('card.status_charging')); color = '#43a047'; }
                else if (flow !== null && flow < 0) { parts.push(this._localize('card.status_discharging')); color = '#03a9f4'; }
                if (balancing) { parts.push(this._jkBalancerText() || this._localize('card.status_balancing')); if (flow === null) color = '#ffa726'; }
                if (parts.length === 0) parts.push(this._localize('card.status_idle'));
                statusEl.innerText = parts.join(' + ');
                statusEl.style.color = color;
            }
        }

        // Status-Pills: ohne Entität "--" (vorher irreführend "AUS"), klickbar nur bei schaltbaren Domains
        const TOGGLE_DOMAINS = ['switch', 'input_boolean', 'light', 'select', 'input_select'];
        const setStatus = (id, entityId, customOn) => {
            const el = this.shadowRoot.getElementById(id);
            if (!el) return;
            const pill = el.parentElement;
            if (!entityId) {
                el.innerText = '--';
                el.className = 'status-val';
                if (pill) pill.classList.remove('interactive');
                return;
            }
            const isOn = isStateOn(this._getState(entityId), customOn);
            el.innerText = isOn ? this._localize('card.on') : this._localize('card.off');
            el.className = `status-val ${isOn ? 'status-on' : 'status-off'}`;
            if (pill) pill.classList.toggle('interactive', TOGGLE_DOMAINS.includes(String(entityId).split('.')[0]));
        };

        setStatus('d-stat-charge', c.stat_charge_entity, c.stat_charge_on);
        setStatus('d-stat-discharge', c.stat_discharge_entity, c.stat_discharge_on);
        setStatus('d-stat-balance', c.stat_balance_entity, c.stat_balance_on);
        setStatus('d-stat-heater', c.stat_heater_entity, c.stat_heater_on);

        setTxt('d-big-volt', (vTotal !== null ? vTotal.toFixed(2) : '--') + ' <span style="font-size:0.7em">V</span>');
        setTxt('d-big-curr', (iTotal !== null ? iTotal.toFixed(2) : '--') + ' <span style="font-size:0.7em">A</span>');
        setTxt('d-big-watt', (pTotal !== null ? pTotal.toFixed(2) : '--') + ' <span style="font-size:0.7em">W</span>');
        
        const wColor = (pTotal > 0) ? '#43a047' : ((pTotal < 0) ? '#03a9f4' : 'var(--secondary-text-color)');
        setStyle('d-big-watt', 'color', wColor);
        setStyle('d-big-curr', 'color', wColor);

        setTxt('d-soc', (soc !== null ? Math.round(soc) : '--') + ' %');
        setTxt('d-soh', (soh !== null ? Math.round(soh) : '--') + ' %');

        const listContainer = this.shadowRoot.getElementById('d-cell-list');
        if (listContainer) {
            let cellListHtml = [[], []];
            
            // --- Generate HTML List (Hybrid Logic) ---
            const showResistance = c.cells.some(cell => cell.resistance_entity);
            let maxRes = -1;
            if (showResistance) c.cells.forEach(cell => { if (cell.resistance_entity) { const m = this._formatResistance(cell.resistance_entity).mohm; if (m !== null && m > maxRes) maxRes = m; } });
            c.cells.forEach((cell, i) => {
                const v = this._parseNumber(cell.entity);
                {
                    // Zellen ohne Wert bleiben als Zeile mit "--" stehen (vorher verschwand die Zeile)
                    const val = v !== null ? this._toVolts(cell.entity, v) : null;
                    const colIdx = i < Math.ceil(c.cells.length/2) ? 0 : 1;
                    
                    // --- HYBRID BALANCING LOGIC START ---
                    let isCellBalancing = false;
                    
                    if (cell.balance_entity) {
                        const bState = this._getState(cell.balance_entity);
                        isCellBalancing = isStateOn(bState); 
                    } else {
                        isCellBalancing = isBalGlobal && (i === maxIdx || i === minIdx);
                    }
                    
                    let balText = this._localize('card.cell_bal_off');
                    let balStyle = '';

                    if (isCellBalancing) {
                        balText = this._localize('card.cell_bal_on');
                        balStyle = 'color: #4caf50; font-weight: bold;';
                    }

                    // Issue #3: optional LED instead of the "bal. on / bal. off" text
                    const balHtml = c.balance_led
                        ? `<span class="cell-bal"><span class="bal-led ${isCellBalancing ? 'on' : 'off'}" title="${balText}"></span></span>`
                        : `<span class="cell-bal" style="${balStyle}">${balText}</span>`;

                    // Issue #3: optional internal resistance per cell
                    let resHtml = '';
                    if (showResistance) {
                        let resStr = ''; let isMax = false;
                        if (cell.resistance_entity) {
                            const f = this._formatResistance(cell.resistance_entity);
                            resStr = f.str;
                            isMax = f.mohm !== null && maxRes > 0 && f.mohm === maxRes;
                        }
                        resHtml = `<span class="cell-res clickable ${isMax ? 'res-max' : ''}" ${cell.resistance_entity ? `data-entity="${cell.resistance_entity}"` : ''} ${isMax ? `title="${this._localize('card.max_res')}"` : ''}>${resStr}</span>`;
                    }

                    cellListHtml[colIdx].push(`<div class="cell-text-row clickable" data-entity="${cell.entity}"><span><span class="cell-num">${String(i+1).padStart(2,'0')}.</span><span class="cell-v">${val !== null ? val.toFixed(3) + ' V' : '--'}</span></span>${resHtml}${balHtml}</div>`);
                }
            });
            setHtml(listContainer, `<div class="cell-list-col">${cellListHtml[0].join('')}</div><div class="cell-list-col">${cellListHtml[1].join('')}</div>`);
        }
        
        if (this._jkInfoEnabled()) this._updateJkBlock();
        if (this._jkSettingsEnabled()) this._updateJkSettings();

        if (this.chartVoltage && vTotal !== null) { this._updateChartData(this.chartVoltage, Date.now(), vTotal); }
        if (this.chartDelta && deltaDisplay !== null) { this._updateChartData(this.chartDelta, Date.now(), deltaDisplay); }
        
        if (c.show_standard_in_detail) {
            this._updateStandardValues();
        }
    }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, BmsBatteryCellsCard);

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === CARD_TAG)) {
    window.customCards.push({
        type: CARD_TAG,
        name: "BMS Battery Cells Card (JK-BMS)",
        preview: true,
        description: "Zellspannungen, Widerstände, Alarme, Ladephase und Temperaturen für JK-BMS (Fork der BMS Battery Cells Card)"
    });
}
