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
(function () {
    'use strict';
    var select = document.createElement('select');
    select.setAttribute('aria-label', 'Campaña de Commerce');
    var detail = document.createElement('p');
    var required = false;
    var campaigns = [];
    document.body.appendChild(select);
    document.body.appendChild(detail);
    function emit(type, payload) { window.emit({ type: type, payload: payload }); }
    function render(value) {
        var id = typeof value === 'string' ? value : (value && value.id) || '';
        select.replaceChildren(new Option('Selecciona una campaña', ''));
        campaigns.forEach(function (c) { select.add(new Option(c.id + (c.enabled ? '' : ' (desactivada)'), c.id)); });
        if (id && !campaigns.some(function (c) { return c.id === id; })) select.add(new Option(id + ' (no encontrada)', id));
        select.value = id;
        info();
    }
    function info() {
        var c = campaigns.filter(function (item) { return item.id === select.value; })[0];
        detail.textContent = c ? 'Inicio: ' + (c.start || 'sin fecha') + '\nFin: ' + (c.end || 'sin fecha') + '\nFechas UTC. Se sincronizan con Commerce al cargar la página.' : 'Campañas del sitio seleccionado. Cierra y abre el componente para actualizar la lista.';
        emit('sfcc:valid', { valid: !required || !!c, message: 'Selecciona una campaña válida.' });
    }
    select.addEventListener('change', function () { info(); emit('sfcc:value', select.value ? { id: select.value } : null); });
    window.subscribe('sfcc:ready', function (p) { campaigns = p.config.campaigns || []; required = !!p.isRequired; select.disabled = !!p.isDisabled; render(p.value); });
    window.subscribe('sfcc:value', render);
    window.subscribe('sfcc:disabled', function (v) { select.disabled = !!v; });
    window.subscribe('sfcc:required', function (v) { required = !!v; info(); });
}());
