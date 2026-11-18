// Live values from Home Assistant, 18.11.2026 ~23:45
const cells = "bms_master|1|3.454|0.064;bms_master|2|3.448|0.062;bms_master|3|3.45|0.064;bms_master|4|3.452|0.062;bms_master|5|3.452|0.065;bms_master|6|3.453|0.064;bms_master|7|3.454|0.066;bms_master|8|3.456|0.064;bms_master|9|3.456|0.066;bms_master|10|3.456|0.065;bms_master|11|3.454|0.067;bms_master|12|3.452|0.069;bms_master|13|3.448|0.073;bms_master|14|3.457|0.068;bms_master|15|3.45|0.066;bms_master|16|3.447|0.065;bms_1|1|3.527|0.067;bms_1|2|3.418|0.063;bms_1|3|3.431|0.066;bms_1|4|3.426|0.062;bms_1|5|3.418|0.066;bms_1|6|3.479|0.063;bms_1|7|3.483|0.066;bms_1|8|3.493|0.062;bms_1|9|3.484|0.066;bms_1|10|3.431|0.063;bms_1|11|3.43|0.066;bms_1|12|3.418|0.062;bms_1|13|3.421|0.067;bms_1|14|3.421|0.065;bms_1|15|3.473|0.068;bms_1|16|3.425|0.065;bms_2|1|3.459|0.065;bms_2|2|3.408|0.063;bms_2|3|3.402|0.064;bms_2|4|3.419|0.061;bms_2|5|3.486|0.064;bms_2|6|3.48|0.062;bms_2|7|3.402|0.064;bms_2|8|3.49|0.062;bms_2|9|3.485|0.066;bms_2|10|3.49|0.064;bms_2|11|3.41|0.064;bms_2|12|3.463|0.062;bms_2|13|3.467|0.067;bms_2|14|3.403|0.065;bms_2|15|3.473|0.065;bms_2|16|3.425|0.064";
const per = {
  bms_master: { soc: 82, soh: 100, power: 271.5, unsigned: 271.518, volt: 55.21, curr: 4.917, t: [22.2, 23.5, 22.3, 23.4, 25.8], mos: 25.8, cap: 280, rem: 230.38, cyc: 78, thr: 22087.111, rt: 24298371, phase: 'Absorption', phaseSec: 977, bal: 'off', balTxt: 'Off', balI: 0 },
  bms_1: { soc: 100, soh: 100, power: 410.4, unsigned: 423.82, volt: 55.17, curr: 7.438, t: [24.5, 25.5, 25.2, 24.1, 27.1], mos: 27.1, cap: 280, rem: 280, cyc: 70, thr: 19698.373, rt: 24299921, phase: 'Bulk', phaseSec: 0, bal: 'on', balTxt: 'Discharging balancer', balI: -2.096 },
  bms_2: { soc: 100, soh: 100, power: 378.9, unsigned: 378.851, volt: 55.15, curr: 6.87, t: [22, 22.2, 22.8, 22.6, 25.5], mos: 25.5, cap: 280, rem: 280, cyc: 65, thr: 18321.441, rt: 24300188, phase: 'Bulk', phaseSec: 0, bal: 'on', balTxt: 'Discharging balancer', balI: -2.019 },
};
// BMS-Einstellungen (number-Entitäten), live 19.11.2026 00:14 – bei allen drei BMS gleich
const settings = "balance_starting_voltage|3.4|V;balance_trigger_voltage|0.01|V;cell_count|16|;cell_request_charge_voltage|3.45|V;cell_request_float_voltage|3.45|V;cell_soc0_voltage|2.64|V;cell_soc100_voltage|3.449|V;cell_voltage_overvoltage_protection|3.65|V;cell_voltage_overvoltage_recovery|3.448|V;cell_voltage_undervoltage_protection|2.6|V;cell_voltage_undervoltage_recovery|2.65|V;charge_overcurrent_protection_delay|3|s;charge_overcurrent_protection_recovery_time|60|s;charge_overtemperature_protection|55|°C;charge_overtemperature_protection_recovery|50|°C;charge_undertemperature_protection|2|°C;charge_undertemperature_protection_recovery|5|°C;discharge_overcurrent_protection_delay|30|s;discharge_overcurrent_protection_recovery_time|60|s;discharge_overtemperature_protection|50|°C;discharge_overtemperature_protection_recovery|45|°C;max_balance_current|2|A;max_charge_current|200|A;max_discharge_current|200|A;power_off_voltage|2.5|V;power_tube_overtemperature_protection|80|°C;power_tube_overtemperature_protection_recovery|70|°C;short_circuit_protection_delay|5|s;short_circuit_protection_recovery_time|5|s;smart_sleep_voltage|3.285|V;total_battery_capacity_ah|280|Ah";
export function buildStates({ alarmOn = null, protectionOn = null } = {}) {
  const st = (s, u = '') => ({ state: String(s), attributes: u ? { unit_of_measurement: u } : {} });
  const S = {};
  for (const row of cells.split(';')) {
    const [p, i, v, o] = row.split('|');
    S[`sensor.${p}_bms_cell_${i}_volt`] = st(v, 'V');
    S[`sensor.${p}_bms_cell_${i}_ohm`] = st(o, 'Ω');
  }
  for (const [p, d] of Object.entries(per)) {
    const a = (k, v, u) => { S[k] = st(v, u); };
    a(`sensor.${p}_bms_soc_pourcentage`, d.soc, '%');
    a(`sensor.${p}_bms_soh_pourcentage`, d.soh, '%');
    a(`sensor.${p}_bms_battery_power`, d.power, 'W');
    a(`sensor.${p}_bms_puissance_totale`, d.unsigned, 'W');
    a(`sensor.${p}_bms_tension_totale_volt`, d.volt, 'V');
    a(`sensor.${p}_bms_courant_total`, d.curr, 'A');
    ['sonde_1_temp', 'sonde_2_temp', 'sonde_3_temp', 'sonde_4_temp', 'temp_sensor_5'].forEach((k, i) => a(`sensor.${p}_bms_${k}`, d.t[i], '°C'));
    a(`sensor.${p}_bms_mos_temp`, d.mos, '°C');
    a(`sensor.${p}_bms_capacite_batterie_ah`, d.cap, 'Ah');
    a(`sensor.${p}_bms_capacite_restante_ah`, d.rem, 'Ah');
    a(`sensor.${p}_bms_nombre_cycle`, d.cyc);
    a(`sensor.${p}_bms_cycle_capacite_ah`, d.thr, 'Ah');
    a(`sensor.${p}_bms_total_runtime`, d.rt);
    a(`sensor.${p}_bms_total_runtime_formatted`, '');
    a(`sensor.${p}_bms_charge_status_text`, d.phase);
    a(`sensor.${p}_bms_charge_status_time`, d.phaseSec);
    a(`sensor.${p}_bms_charge_status_time_formatted`, '');
    const alarm = alarmOn === p;
    a(`binary_sensor.${p}_${p}_alarm_active`, alarm ? 'on' : 'off');
    a(`sensor.${p}_${p}_alarm_list`, alarm ? 'Cell overvoltage' : 'No alarms');
    a(`binary_sensor.${p}_bms_switch_charge`, 'on');
    a(`binary_sensor.${p}_bms_switch_decharge`, 'on');
    a(`binary_sensor.${p}_bms_balance_action`, d.bal);
    a(`binary_sensor.${p}_bms_heating`, 'off');
    a(`sensor.${p}_bms_balancer_status_text`, d.balTxt);
    a(`sensor.${p}_bms_balance_courant`, d.balI, 'A');
    a(`binary_sensor.${p}_bms_charger_plugged`, 'off');
    a(`binary_sensor.${p}_bms_precharging`, 'off');
    a(`sensor.${p}_bms_heating_current`, 0, 'A');
    a(`sensor.${p}_bms_battery_type_text`, 'LFP');
    for (const k of ['emergency_countdown', 'discharge_ocp_release_timer', 'discharge_scp_release_timer', 'charge_ocp_release_timer', 'charge_scp_release_timer', 'undervoltage_release_timer', 'overvoltage_release_timer'])
      a(`sensor.${p}_bms_${k}`, protectionOn === p && k === 'charge_ocp_release_timer' ? 42 : 0, 's');
  }
  const extra = { 'sensor:discharge_undertemperature_protection': [2, '°C'], 'sensor:discharge_undertemperature_protection_recovery': [7, '°C'], 'sensor:heating_start_temperature': [-10, '°C'], 'sensor:heating_stop_temperature': [0, '°C'], 'sensor:smart_sleep_delay': [24, 'h'], 'sensor:precharge_time': [0, 's'], 'sensor:battery_type_text': ['LFP', ''], 'switch:charging_floating_mode': ['on', ''], 'switch:smart_sleep_switch': ['off', ''], 'switch:timed_stored_data_switch': ['off', ''], 'switch:display_always_on_switch': ['off', ''], 'switch:disable_pcl_module_switch': ['off', ''], 'binary_sensor:heating_switch': ['off', ''], 'binary_sensor:disable_temperature_sensors': ['off', ''], 'binary_sensor:discharge_ocp2': ['on', ''], 'binary_sensor:discharge_ocp3': ['off', ''], 'binary_sensor:dry_alarm_intermittent': ['off', ''], 'binary_sensor:special_charger': ['off', ''] };
  const addr = { bms_master: 0, bms_1: 1, bms_2: 2 };
  for (const p of Object.keys(per)) {
    for (const [k, [v, u]] of Object.entries(extra)) { const [d, n] = k.split(':'); S[`${d}.${p}_bms_${n}`] = st(v, u); }
    S[`number.${p}_bms_device_address`] = st(addr[p]);
  }
  for (const p of Object.keys(per)) for (const row of settings.split(';')) {
    const [k, v, u] = row.split('|');
    S[`number.${p}_bms_${k}`] = st(v, u);
  }
  return S;
}
