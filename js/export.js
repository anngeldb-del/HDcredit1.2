/* ============================================================
   EXPORT / IMPORT
============================================================ */
function doExport() {
  const rows = [['#','Nombre','Producto','Monto','Pago Q','Plazo','Q Pagadas','Saldo','Estado'],
    ...clientes.map((c,i)=>[i+1,c.nombre,c.producto==='unico_30d'?'Préstamo 30 Días':'Quincenal',c.monto,c.pq,plazoLabel(c),c.pagadas,c.saldo,
      c.saldo===0?'Liquidado':calcAlerta(c)||'Al corriente'])];
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download = 'HDCredit_' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
  toast('Exportado CSV ✅', 'ok');
}

function doExportXLSX() {
  if (typeof XLSX === 'undefined') {
    toast('Cargando exportador Excel...', 'wrn');
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = _generateXLSX;
    s.onerror = () => toast('Error al cargar librería Excel', 'err');
    document.head.appendChild(s);
  } else {
    _generateXLSX();
  }
}

async function _generateXLSX() {
  if (!clientes.length) { toast('No hay datos para exportar', 'err'); return; }

  // La vista solo mantiene sincronizado el historial reciente (ver
  // HIST_DIAS_RECIENTES) — para que el Excel exportado sea un respaldo
  // completo, se trae todo el historial de Firestore en este momento
  let historialCompleto = historial;
  if (USE_FB && _histHayMas) {
    toast('Preparando historial completo…', 'wa');
    try { historialCompleto = await obtenerHistorialCompleto(); }
    catch(e) { toast('No se pudo traer el historial completo, se exporta lo disponible: ' + e.message, 'wrn'); }
  }

  const wb = XLSX.utils.book_new();

  // Hoja 1: Acreditados
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['#','Nombre','Producto','Monto','Pago Q','Plazo','Q Pagadas','Q Restantes','Saldo','Estado','Inicio','Teléfono','Notas'],
    ...clientes.map((c, i) => [
      i + 1, c.nombre, c.producto==='unico_30d'?'Préstamo 30 Días':'Quincenal', c.monto, c.pq, plazoLabel(c),
      c.pagadas, c.nq - c.pagadas, c.saldo,
      c.saldo === 0 ? 'Liquidado' : calcAlerta(c) === 'ATRASADO' ? 'Atrasado' : 'Al corriente',
      c.inicio || '', c.telefono || '', c.notas || ''
    ])
  ]);
  ws1['!cols'] = [
    {wch:4},{wch:22},{wch:16},{wch:10},{wch:10},{wch:8},
    {wch:10},{wch:12},{wch:12},{wch:14},{wch:12},{wch:14},{wch:22}
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Acreditados');

  // Hoja 2: Historial
  if (historialCompleto.length) {
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['Acreditado','Monto','Quincena','Fecha','Hora','Tipo'],
      ...historialCompleto.map(h => [
        h.nombre || '', h.monto || 0, h.qKey || '',
        h.fecha || '', h.hora || '', h.accion || ''
      ])
    ]);
    ws2['!cols'] = [{wch:22},{wch:10},{wch:14},{wch:14},{wch:12},{wch:10}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Historial');
  }

  const fname = 'HDCredit_' + new Date().toISOString().split('T')[0] + '.xlsx';
  XLSX.writeFile(wb, fname);
  toast('Excel descargado ✅', 'ok');
}

async function doExportJSON() {
  if (!clientes.length) { toast('No hay datos para exportar', 'err'); return; }
  // Igual que en el Excel: el respaldo debe incluir TODO el historial, no
  // solo la ventana reciente que se mantiene sincronizada en vivo
  let historialCompleto = historial;
  if (USE_FB && _histHayMas) {
    toast('Preparando respaldo completo…', 'wa');
    try { historialCompleto = await obtenerHistorialCompleto(); }
    catch(e) { toast('No se pudo traer el historial completo, se respalda lo disponible: ' + e.message, 'wrn'); }
  }
  const payload = { clientes, historial: historialCompleto, ts: new Date().toISOString(), v: '2.1' };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], {type: 'application/json'}));
  a.download = 'HDCredit_respaldo_' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  toast('Respaldo JSON descargado ✅', 'ok');
}

function doImportJSON() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const payload = JSON.parse(ev.target.result);
        if (!payload.clientes || !Array.isArray(payload.clientes) || !payload.clientes.length) {
          toast('Archivo inválido o sin clientes', 'err'); return;
        }
        // Validar estructura de cada cliente
        const validos = payload.clientes.filter(c =>
          c && typeof c === 'object'
          && typeof c.nombre === 'string' && c.nombre.trim()
          && Number.isFinite(c.nq) && c.nq > 0
          && Number.isFinite(c.monto) && c.monto > 0
          && Number.isFinite(c.pagadas)
        );
        const omitidos = payload.clientes.length - validos.length;
        if (!validos.length) { toast('Archivo inválido: sin registros con estructura correcta', 'err'); return; }
        const tsLabel = payload.ts ? new Date(payload.ts).toLocaleDateString('es-MX') : 'fecha desconocida';
        const msg = `¿Importar ${validos.length} clientes del respaldo del ${tsLabel}?\n\nEsto reemplazará los datos actuales.`
          + (omitidos ? `\n\n⚠️ Se omitirán ${omitidos} registros con datos inválidos.` : '');
        if (!confirm(msg)) return;
        autoBackup();
        clientes = validos;
        historial = Array.isArray(payload.historial) ? payload.historial : [];
        historial.sort((a, b) => new Date(b.ts) - new Date(a.ts));
        syncAlertas();
        saveLocal();
        refresh();
        if (omitidos) toast(`${validos.length} clientes restaurados · ${omitidos} omitidos por datos inválidos`, 'wrn');
        else toast(`${validos.length} clientes restaurados ✅`, 'ok');
      } catch(err) {
        toast('Error al leer el archivo: ' + err.message, 'err');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

