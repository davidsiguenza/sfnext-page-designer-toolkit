/**
 * Copyright 2026 Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function (root) {
    'use strict';
    function resolve(local, zone) {
        if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error('Introduce una fecha y hora completas.');
        var wall = Date.parse(local + ':00Z');
        if (!isFinite(wall) || new Date(wall).toISOString().slice(0, 16) !== local) throw new Error('Fecha no válida.');
        if (/^UTC[+-](?:0\d|1[0-4]):[0-5]\d$/.test(zone)) return new Date(local + ':00' + zone.slice(3)).toISOString().slice(0,19) + 'Z';
        var format = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
        function localAt(timestamp) {
            var parts = {};
            format.formatToParts(new Date(timestamp)).forEach(function (part) { parts[part.type] = part.value; });
            return parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute;
        }
        var candidates = [];
        [-86400000, 0, 86400000].forEach(function (delta) {
            var sample = wall + delta;
            var offset = Date.parse(localAt(sample) + ':00Z') - sample;
            var candidate = wall - offset;
            if (localAt(candidate) === local && candidates.indexOf(candidate) === -1) candidates.push(candidate);
        });
        if (!candidates.length) throw new Error('Esta hora no existe por el cambio de horario. Elige otra hora.');
        if (candidates.length > 1) throw new Error('Hora repetida por el cambio de horario. Especifica UTC+02:00 o UTC+01:00.');
        return new Date(candidates[0]).toISOString().slice(0,19) + 'Z';
    }
    if (typeof module === 'object') module.exports = { resolve: resolve };
    if (!root || !root.document) return;
    var date = document.createElement('input'); date.type = 'datetime-local'; date.step = '60';
    var zone = document.createElement('input'); zone.type = 'text'; zone.value = 'Europe/Madrid'; zone.setAttribute('list', 'zones');
    var list = document.createElement('datalist'); list.id = 'zones';
    ['Europe/Madrid', 'Atlantic/Canary', 'Europe/Lisbon', 'Europe/London', 'UTC', 'America/New_York'].forEach(function (name) { list.appendChild(new Option(name)); });
    var message = document.createElement('p');
    var required = false;
    function label(text, input) { var l = document.createElement('label'); var span = document.createElement('span'); span.textContent = text; l.append(span, input); document.body.appendChild(l); }
    label('Fecha y hora', date); label('Zona horaria (IANA o UTC+01:00)', zone); document.body.append(list, message);
    function emit(type, payload) { root.emit({ type: type, payload: payload }); }
    function validate(save) {
        try {
            if (!date.value && required) throw new Error('Selecciona una fecha y hora.');
            var value = date.value ? resolve(date.value, zone.value.trim()) : null;
            message.textContent = value ? 'Instante guardado: ' + value + '. El horario de verano se aplica automáticamente a zonas IANA.' : 'Configura esta fecha solo si usas el modo manual.';
            message.dataset.error = 'false';
            emit('sfcc:valid', { valid: true });
            if (save) emit('sfcc:value', value ? { value: value, local: date.value, zone: zone.value.trim() } : null);
        } catch (e) {
            message.textContent = e.message; message.dataset.error = 'true';
            emit('sfcc:valid', { valid: false, message: e.message });
        }
    }
    function render(v) {
        date.value = v && v.local || '';
        zone.value = v && v.zone || zone.value;
        if (v && !v.local && v.value) { date.value = v.value.slice(0,16); zone.value = 'UTC'; }
        validate(false);
    }
    date.addEventListener('change', function () { validate(true); });
    zone.addEventListener('change', function () { validate(true); });
    root.subscribe('sfcc:ready', function (p) { required = !!p.isRequired; date.disabled = zone.disabled = !!p.isDisabled; zone.value = p.config.timeZone || 'Europe/Madrid'; render(p.value); });
    root.subscribe('sfcc:value', render);
    root.subscribe('sfcc:disabled', function (v) { date.disabled = zone.disabled = !!v; });
    root.subscribe('sfcc:required', function (v) { required = !!v; validate(false); });
}(typeof window === 'undefined' ? null : window));
