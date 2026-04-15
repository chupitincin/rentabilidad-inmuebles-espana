// ITP rates by autonomous community (segunda mano)
const ITP_RATES = {
    'andalucia': 7,
    'aragon': 8,
    'asturias': 8,
    'baleares': 8,
    'canarias': 6.5,
    'cantabria': 10,
    'castilla-la-mancha': 9,
    'castilla-y-leon': 8,
    'cataluna': 10,
    'extremadura': 8,
    'galicia': 9,
    'madrid': 6,
    'murcia': 8,
    'navarra': 6,
    'pais-vasco': 4,
    'la-rioja': 7,
    'valencia': 10,
    'ceuta': 6,
    'melilla': 6,
};

// IVA for obra nueva is 10% + AJD varies by community
const AJD_RATES = {
    'andalucia': 1.2,
    'aragon': 1.5,
    'asturias': 1.2,
    'baleares': 1.5,
    'canarias': 1, // IGIC 7% instead of IVA
    'cantabria': 1.5,
    'castilla-la-mancha': 1.5,
    'castilla-y-leon': 1.5,
    'cataluna': 1.5,
    'extremadura': 1.5,
    'galicia': 1.5,
    'madrid': 0.75,
    'murcia': 1.5,
    'navarra': 0.5,
    'pais-vasco': 0,
    'la-rioja': 1.5,
    'valencia': 2,
    'ceuta': 0.5,
    'melilla': 0.5,
};

function $(id) {
    return document.getElementById(id);
}

function val(id) {
    return parseFloat($(id).value) || 0;
}

function fmt(n) {
    return n.toLocaleString('es-ES', { maximumFractionDigits: 0 });
}

function fmtDec(n, d = 2) {
    return n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function calcularImpuestoCompra(precio, comunidad, tipo) {
    if (tipo === 'obra-nueva') {
        const ivaRate = comunidad === 'canarias' ? 7 : 10;
        const ajdRate = AJD_RATES[comunidad] || 1.5;
        const iva = precio * ivaRate / 100;
        const ajd = precio * ajdRate / 100;
        return {
            total: iva + ajd,
            description: comunidad === 'canarias'
                ? `IGIC ${ivaRate}% + AJD ${ajdRate}%`
                : `IVA ${ivaRate}% + AJD ${ajdRate}%`
        };
    } else {
        const itpRate = ITP_RATES[comunidad] || 8;
        const itp = precio * itpRate / 100;
        return {
            total: itp,
            description: `ITP ${itpRate}%`
        };
    }
}

function calcularCuotaMensual(capital, tipoInteres, anos) {
    if (capital <= 0 || anos <= 0) return 0;
    const r = tipoInteres / 100 / 12;
    const n = anos * 12;
    if (r === 0) return capital / n;
    return capital * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function calcular() {
    const precio = val('precio-compra');
    const tipo = $('tipo-vivienda').value;
    const comunidad = $('comunidad').value;
    const reforma = val('reforma');

    // Impuesto de compra
    const impuesto = calcularImpuestoCompra(precio, comunidad, tipo);
    $('itp').value = Math.round(impuesto.total);
    $('itp-info').textContent = impuesto.description;

    // Gastos de compra
    const notaria = val('notaria');
    const registro = val('registro');
    const gestoria = val('gestoria');
    const totalGastosCompra = impuesto.total + notaria + registro + gestoria;
    $('total-gastos-compra').textContent = fmt(totalGastosCompra) + ' \u20AC';

    // Inversion total
    const inversionTotal = precio + reforma + totalGastosCompra;
    $('inversion-total').textContent = fmt(inversionTotal) + ' \u20AC';
    $('inversion-detail').textContent = `Precio + Reforma + Gastos`;

    // Hipoteca
    const conHipoteca = $('con-hipoteca').checked;
    const hipotecaFields = $('hipoteca-fields');
    hipotecaFields.style.display = conHipoteca ? 'block' : 'none';

    let cuotaMensual = 0;
    let cuotaAnual = 0;
    let capitalPropio = inversionTotal;
    let totalIntereses = 0;

    if (conHipoteca) {
        const pctFinanciado = val('porcentaje-financiado');
        const anos = val('anos-hipoteca');
        const interes = val('interes');
        const capitalFinanciado = precio * pctFinanciado / 100;

        cuotaMensual = calcularCuotaMensual(capitalFinanciado, interes, anos);
        cuotaAnual = cuotaMensual * 12;
        totalIntereses = (cuotaMensual * anos * 12) - capitalFinanciado;
        capitalPropio = inversionTotal - capitalFinanciado;

        $('capital-financiado').textContent = fmt(capitalFinanciado) + ' \u20AC';
        $('cuota-mensual').textContent = fmt(cuotaMensual) + ' \u20AC/mes';
        $('total-intereses').textContent = fmt(totalIntereses) + ' \u20AC';
        $('capital-aportado').textContent = fmt(capitalPropio) + ' \u20AC';
    }

    $('capital-propio').textContent = fmt(capitalPropio) + ' \u20AC';
    $('capital-propio-detail').textContent = conHipoteca
        ? 'Entrada + Gastos + Reforma'
        : 'Sin hipoteca: 100% del coste';

    // Ingresos
    const alquilerMensual = val('alquiler-mensual');
    const mesesOcupacion = val('meses-ocupacion');
    const ingresoAnual = alquilerMensual * mesesOcupacion;
    $('ingreso-anual').textContent = fmt(ingresoAnual) + ' \u20AC/año';

    // Gastos anuales
    const ibi = val('ibi');
    const comunidadGastos = val('comunidad-gastos') * 12;
    const seguroHogar = val('seguro-hogar');
    const mantenimiento = precio * val('mantenimiento') / 100;
    const seguroImpago = val('seguro-impago');
    const totalGastosAnuales = ibi + comunidadGastos + seguroHogar + mantenimiento + seguroImpago;
    $('total-gastos-anuales').textContent = fmt(totalGastosAnuales) + ' \u20AC/año';

    // FISCALIDAD
    const residencia = $('residencia-fiscal').value;
    const esResidente = residencia === 'residente';
    const esUE = residencia === 'no-residente-ue';

    // Mostrar/ocultar campos segun residencia
    $('campos-residente').style.display = esResidente ? 'block' : 'none';
    $('campos-no-residente').style.display = esResidente ? 'none' : 'block';

    let irpfAnual = 0;
    let tramoIrpf = 0;
    let reduccionAlquiler = 0;
    let interesAnualDeducible = conHipoteca && val('anos-hipoteca') > 0 ? totalIntereses / val('anos-hipoteca') : 0;
    let rentaImputada = 0;

    if (esResidente) {
        // IRPF residente
        tramoIrpf = val('tramo-irpf') / 100;
        reduccionAlquiler = val('reduccion-alquiler') / 100;

        const gastosDeducibles = ibi + comunidadGastos + seguroHogar + mantenimiento + seguroImpago + interesAnualDeducible;
        const rendimientoNeto = Math.max(0, ingresoAnual - gastosDeducibles);
        const rendimientoReducido = rendimientoNeto * (1 - reduccionAlquiler);
        irpfAnual = rendimientoReducido * tramoIrpf;
    } else {
        // IRNR - No residente
        const tipoIRNR = esUE ? 19 : 24;
        tramoIrpf = tipoIRNR / 100;
        reduccionAlquiler = 0; // No aplica reduccion para no residentes

        $('irnr-tipo').textContent = tipoIRNR + '%';

        if (esUE) {
            // UE/EEE: puede deducir gastos proporcionales a los meses alquilados
            $('irnr-deducibles').textContent = 'Si (UE/EEE)';
            $('irnr-info-text').innerHTML = '<strong>IRNR para residentes UE/EEE:</strong> Tipo fijo del 19%. Puedes deducir gastos directamente relacionados (IBI, comunidad, seguros, intereses hipoteca, amortizacion). Se tributa por el rendimiento neto. Modelo 210 trimestral.';

            const gastosDeducibles = ibi + comunidadGastos + seguroHogar + mantenimiento + seguroImpago + interesAnualDeducible;
            const rendimientoNeto = Math.max(0, ingresoAnual - gastosDeducibles);
            irpfAnual = rendimientoNeto * tramoIrpf;
        } else {
            // Fuera UE: no puede deducir gastos, tributa sobre ingreso bruto
            $('irnr-deducibles').textContent = 'No (fuera UE)';
            $('irnr-info-text').innerHTML = '<strong>IRNR para residentes fuera de la UE:</strong> Tipo fijo del 24% sobre el <u>ingreso bruto</u> (sin deducir gastos). No aplica reduccion por alquiler de vivienda. Modelo 210 trimestral.';

            irpfAnual = ingresoAnual * tramoIrpf;
        }

        // Valor catastral estimado
        const pctCatastral = val('pct-catastral');
        const valorCatastral = precio * pctCatastral / 100;
        $('pct-catastral-label').textContent = pctCatastral + '%';
        $('valor-catastral-estimado').textContent = fmt(valorCatastral) + ' \u20AC';

        // Renta imputada por meses vacios (no residentes)
        const mesesVacios = 12 - mesesOcupacion;
        if (mesesVacios > 0) {
            // 1.1% si valor catastral revisado (posterior a 1994), 2% si no
            const pctImputacion = 1.1;
            rentaImputada = (valorCatastral * pctImputacion / 100) * (mesesVacios / 12);
            const impuestoImputado = rentaImputada * tramoIrpf;
            irpfAnual += impuestoImputado;
        }

        $('renta-imputada-row').style.display = (mesesOcupacion < 12 && !esResidente) ? 'flex' : 'none';
        $('renta-imputada').textContent = fmt(rentaImputada) + ' \u20AC';
    }

    if (esResidente) {
        $('renta-imputada-row').style.display = 'none';
    }

    $('irpf-estimado').textContent = fmt(irpfAnual) + ' \u20AC/año';

    // Rentabilidades
    const rentBruta = precio > 0 ? (ingresoAnual / precio) * 100 : 0;
    const beneficioNeto = ingresoAnual - totalGastosAnuales - irpfAnual;
    const rentNeta = inversionTotal > 0 ? (beneficioNeto / inversionTotal) * 100 : 0;
    const roce = capitalPropio > 0 ? ((beneficioNeto - cuotaAnual + (conHipoteca ? cuotaAnual - (totalIntereses / val('anos-hipoteca') || 0) : 0)) / capitalPropio) * 100 : 0;
    // ROCE simplificado: cashflow / capital propio
    const cashflowAnual = ingresoAnual - totalGastosAnuales - cuotaAnual - irpfAnual;
    const roceReal = capitalPropio > 0 ? (cashflowAnual / capitalPropio) * 100 : 0;

    $('rent-bruta').textContent = fmtDec(rentBruta) + '%';
    $('rent-neta').textContent = fmtDec(rentNeta) + '%';
    $('roce').textContent = fmtDec(roceReal) + '%';

    // Cash flow
    const cashflowMensual = cashflowAnual / 12;
    $('cashflow-mensual').textContent = fmt(cashflowMensual) + ' \u20AC';
    $('cashflow-mensual').className = 'result-value ' + (cashflowMensual >= 0 ? 'positive' : 'negative');
    $('cashflow-anual').textContent = fmt(cashflowAnual) + ' \u20AC';
    $('cashflow-anual').className = 'result-value ' + (cashflowAnual >= 0 ? 'positive' : 'negative');

    // Payback
    if (cashflowAnual > 0) {
        const payback = capitalPropio / cashflowAnual;
        $('payback').textContent = fmtDec(payback, 1) + ' años';
    } else {
        $('payback').textContent = 'N/A (cash flow negativo)';
        $('payback').className = 'result-value negative';
    }

    // Tabla anual
    const anosHipoteca = conHipoteca ? val('anos-hipoteca') : 0;
    generarTablaAnual({
        ingresos: ingresoAnual,
        gastos: totalGastosAnuales,
        hipoteca: cuotaAnual,
        anosHipoteca,
        tramoIrpf,
        reduccionAlquiler,
        ibi, comunidadGastos, seguroHogar, mantenimiento, seguroImpago,
        interesAnualDeducible,
        esResidente,
        esUE,
        rentaImputada
    });
}

function generarTablaAnual(p) {
    const tbody = document.querySelector('#tabla-anual tbody');
    tbody.innerHTML = '';

    let acumulado = 0;
    for (let i = 1; i <= 10; i++) {
        const hipotecaAnio = (p.anosHipoteca > 0 && i <= p.anosHipoteca) ? p.hipoteca : 0;
        const interesDeducible = (p.anosHipoteca > 0 && i <= p.anosHipoteca) ? p.interesAnualDeducible : 0;

        let irpfAnio = 0;
        if (p.esResidente) {
            const gastosDeducibles = p.ibi + p.comunidadGastos + p.seguroHogar + p.mantenimiento + p.seguroImpago + interesDeducible;
            const rendimientoNeto = Math.max(0, p.ingresos - gastosDeducibles);
            irpfAnio = rendimientoNeto * (1 - p.reduccionAlquiler) * p.tramoIrpf;
        } else if (p.esUE) {
            const gastosDeducibles = p.ibi + p.comunidadGastos + p.seguroHogar + p.mantenimiento + p.seguroImpago + interesDeducible;
            irpfAnio = Math.max(0, p.ingresos - gastosDeducibles) * p.tramoIrpf + (p.rentaImputada * p.tramoIrpf);
        } else {
            // Fuera UE: bruto sin deducciones
            irpfAnio = p.ingresos * p.tramoIrpf + (p.rentaImputada * p.tramoIrpf);
        }

        const cashflow = p.ingresos - p.gastos - hipotecaAnio - irpfAnio;
        acumulado += cashflow;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i}</td>
            <td class="positive">${fmt(p.ingresos)} \u20AC</td>
            <td class="negative">-${fmt(p.gastos)} \u20AC</td>
            <td class="negative">${hipotecaAnio > 0 ? '-' + fmt(hipotecaAnio) + ' \u20AC' : '-'}</td>
            <td class="negative">-${fmt(irpfAnio)} \u20AC</td>
            <td class="${cashflow >= 0 ? 'positive' : 'negative'}">${fmt(cashflow)} \u20AC</td>
            <td class="${acumulado >= 0 ? 'positive' : 'negative'}">${fmt(acumulado)} \u20AC</td>
        `;
        tbody.appendChild(tr);
    }
}

// Bind all inputs to recalculate
function bindInputs() {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', calcular);
        input.addEventListener('change', calcular);
    });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    bindInputs();
    calcular();
});
