/**
 * ComprobantePago.jsx
 * Plantilla de visualización e impresión para comprobantes de pago.
 * Diseño vertical (portrait), una sola hoja oficial homogénea con AguaVP.
 */

import { useAppLogo } from '../../context/LogoContext';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNotifyPrintReady } from '../../hooks/useNotifyPrintReady';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
    `$${Number(n || 0).toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const fmtFechaCorta = (iso) => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return String(iso);
        return d.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch {
        return iso;
    }
};

const fmtFechaHora = (iso) => {
    if (!iso) return '—';
    try {
        const d = new Date(iso);
        if (isNaN(d.getTime())) return String(iso);
        return d.toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch {
        return iso;
    }
};

const METODO_ICONO = {
    Efectivo: '💵',
    Tarjeta: '💳',
    Transferencia: '🏦',
    default: '📄'
};

// ─── Subcomponentes ─────────────────────────────────────────────────────────

const InfoRow = ({ label, value, bold, highlight }) => (
    <tr>
        <td style={{ color: '#64748b', padding: '3px 10px 3px 0', whiteSpace: 'nowrap', verticalAlign: 'top', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            {label}
        </td>
        <td style={{ fontWeight: bold ? 800 : 600, padding: '3px 0', color: highlight ? '#1e3a8a' : '#0f172a', wordBreak: 'break-word', fontSize: '11px', textAlign: 'right' }}>
            {value}
        </td>
    </tr>
);

const TotalRow = ({ label, value, color = '#0f172a', strong, sub }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: sub ? '2px 0' : '4px 0', fontSize: sub ? '11px' : '12px' }}>
        <span style={{ color: '#64748b', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: strong ? 800 : 700, color, fontFamily: 'monospace' }}>{value}</span>
    </div>
);

// ─── Comprobante individual ────────────────────────────────────────────────

const Comprobante = ({ data }) => {
    const { logoSrc } = useAppLogo();
    if (!data) return null;

    const factura = data.factura || {};
    const pago = data.pago || {};

    const folioPago = data.folio_pago || pago.id || pago.folio || data.folio || '000000';
    const facturaId = factura.id || pago.factura_id || factura.factura_id || '—';
    const clienteNombre = factura.cliente_nombre || pago.cliente_nombre || data.cliente_nombre || 'PÚBLICO EN GENERAL';
    const direccionCliente = factura.direccion_cliente || pago.direccion_cliente || data.direccion_cliente || 'Domicilio conocido';
    const clienteCiudad = factura.cliente_ciudad || pago.cliente_ciudad || data.cliente_ciudad || 'Villa Pesqueira, Sonora';
    const medidorSerie = factura.medidor_serie || pago.medidor_numero_serie || factura.medidor?.numero_serie || 'S/N';
    const tarifaNombre = factura.tarifa_nombre || pago.tarifa_nombre || factura.tarifa || 'Doméstica';
    const periodo = factura.periodo || pago.periodo_facturado || factura.mes_facturado || '—';
    const consumoM3 = factura.consumo_m3 !== undefined && factura.consumo_m3 !== null ? factura.consumo_m3 : '—';

    const totalFactura = Number(factura.total ?? pago.total_factura ?? factura.total_factura ?? 0);
    const montoPagado = Number(pago.monto ?? data.monto ?? 0);
    const cantidadRecibida = Number(pago.cantidad_entregada ?? data.cantidad_entregada ?? montoPagado);
    const cambioCalculado = Number(data.cambio ?? (cantidadRecibida > montoPagado ? cantidadRecibida - montoPagado : 0));
    const saldoRestante = Number(factura.saldo_restante ?? pago.saldo_pendiente_factura ?? factura.saldo_pendiente ?? (totalFactura > montoPagado ? totalFactura - montoPagado : 0));
    const esPagoParcial = data.es_pago_parcial !== undefined ? Boolean(data.es_pago_parcial) : saldoRestante > 0.01;

    const metodoPago = pago.metodo_pago || data.metodo_pago || 'Efectivo';
    const icono = METODO_ICONO[metodoPago] || METODO_ICONO.default;
    const comentario = pago.comentario || data.comentario || '';
    const operador = data.operador || pago.modificado_por_nombre || 'Ventanilla / Caja';
    const fechaEmision = data.fecha_hora_emision || data.fecha_emision || pago.fecha_creacion || new Date().toISOString();
    const fechaPago = pago.fecha_pago || data.fecha_pago || fechaEmision;
    const historialPagos = Array.isArray(data.historial_pagos) ? data.historial_pagos : [];

    const estadoColor = esPagoParcial ? '#b45309' : '#15803d';
    const estadoBg = esPagoParcial ? '#fffbeb' : '#f0fdf4';
    const estadoBorder = esPagoParcial ? '#fde68a' : '#bbf7d0';

    return (
        <div
            className="w-full max-w-[760px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:shadow-none print:rounded-none print:border-none print:max-w-none"
            style={{
                fontFamily: "'Segoe UI', Arial, sans-serif",
                color: '#0f172a',
                pageBreakInside: 'avoid',
            }}
        >
            {/* ── Header azul institucional ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: '8px 8px 0 0',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img src={logoSrc} alt="Escudo" style={{ height: '62px', width: '62px', objectFit: 'contain', flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                            Comisión Municipal de Agua Potable y Alcantarillado
                        </div>
                        <div style={{ fontSize: '11px', color: '#93c5fd', fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            H. Ayuntamiento de Villa Pesqueira, Sonora
                        </div>
                        <div style={{ fontSize: '10px', color: '#dbeafe', marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Comprobante Oficial de Ingreso y Recaudación
                        </div>
                    </div>
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    textAlign: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.85, fontWeight: 700 }}>Folio de Pago</div>
                    <div style={{ fontWeight: 800, fontSize: '17px', marginTop: '2px', letterSpacing: '0.05em' }}>#{String(folioPago).padStart(6, '0')}</div>
                </div>
            </div>

            {/* ── Banda azul con título + estado + fecha ── */}
            <div style={{
                background: '#f0f9ff',
                borderLeft: '4px solid #1e40af',
                borderRight: '1px solid #bfdbfe',
                borderBottom: '1px solid #bfdbfe',
                padding: '6px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Comprobante de Pago <span style={{ color: '#64748b', fontWeight: 600, fontSize: '11px', textTransform: 'none' }}>· Constancia administrativa oficial</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                        background: estadoBg,
                        border: `1px solid ${estadoBorder}`,
                        color: estadoColor,
                        fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '2px 9px', borderRadius: '999px',
                    }}>
                        {esPagoParcial ? '● Abono / Pago parcial' : '● Pagado en su totalidad'}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>Emisión: {fmtFechaHora(fechaEmision)}</span>
                </div>
            </div>

            {/* ── Datos cliente / comprobante ── */}
            <div style={{ padding: '14px 20px 6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#1e3a8a', color: '#fff', padding: '5px 12px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Datos del Contribuyente / Titular
                    </div>
                    <div style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a', textTransform: 'uppercase' }}>{clienteNombre}</div>
                        <div style={{ borderTop: '1px solid #f1f5f9', margin: '5px 0' }} />
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <InfoRow label="Dirección" value={direccionCliente} />
                                <InfoRow label="Localidad" value={clienteCiudad} />
                                <InfoRow label="N° Medidor" value={medidorSerie} bold />
                                <InfoRow label="Tarifa" value={tarifaNombre} bold />
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#1e3a8a', color: '#fff', padding: '5px 12px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Detalles de la Operación y Pago
                    </div>
                    <div style={{ padding: '8px 12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <InfoRow label="Folio Comprobante" value={`#${String(folioPago).padStart(6, '0')}`} bold highlight />
                                <InfoRow label="Factura / Recibo" value={`#${facturaId}`} bold />
                                <InfoRow label="Período Facturado" value={periodo} bold />
                                <InfoRow label="Fecha de Pago" value={fmtFechaCorta(fechaPago)} bold />
                                <InfoRow label="Método de Pago" value={`${icono} ${metodoPago}`} />
                                <InfoRow label="Cajero / Operador" value={operador} />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Tabla de conceptos facturados ── */}
            <div style={{ padding: '8px 20px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                        <tr>
                            <th style={{ background: '#1e3a8a', color: '#fff', padding: '6px 10px', textAlign: 'left', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Concepto / Descripción</th>
                            <th style={{ background: '#1e3a8a', color: '#fff', padding: '6px 10px', textAlign: 'center', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Período</th>
                            <th style={{ background: '#1e3a8a', color: '#fff', padding: '6px 10px', textAlign: 'center', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consumo</th>
                            <th style={{ background: '#1e3a8a', color: '#fff', padding: '6px 10px', textAlign: 'right', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Importe Factura</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>
                                Servicio de Agua Potable y Alcantarillado
                                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, marginTop: '1px' }}>Factura oficial #{facturaId} · Tarifa regular de suministro</div>
                            </td>
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{periodo}</td>
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontFamily: 'monospace' }}>{consumoM3} m³</td>
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(totalFactura)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ── Desglose de totales y certificación ── */}
            <div style={{ padding: '10px 20px 4px', display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'flex-start' }}>
                    {comentario && (
                        <div style={{ fontSize: '10.5px', color: '#334155', background: '#f8fafc', padding: '7px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#475569', textTransform: 'uppercase', fontSize: '9px', letterSpacing: '0.04em' }}>Observaciones: </strong>
                            <span style={{ fontStyle: 'italic' }}>{comentario}</span>
                        </div>
                    )}
                    <div style={{ background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px 10px', fontSize: '9.5px', color: '#475569', lineHeight: 1.4 }}>
                        <div style={{ fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', fontSize: '8.5px', letterSpacing: '0.05em', marginBottom: '2px' }}>
                            Certificación Institucional de Recepción de Fondos
                        </div>
                        El presente comprobante ampara el ingreso correspondiente al servicio de agua potable y alcantarillado. Válido legal y administrativamente ante cualquier aclaración futura. Todo pago queda debidamente registrado en el sistema oficial del municipio.
                    </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
                    <TotalRow label="Total de la factura" value={fmt(totalFactura)} />
                    <TotalRow label={esPagoParcial ? 'Abono aplicado' : 'Importe pagado'} value={fmt(montoPagado)} color={estadoColor} strong />
                    <TotalRow label="Cantidad recibida" value={fmt(cantidadRecibida)} sub />
                    {cambioCalculado > 0 && <TotalRow label="Cambio entregado" value={fmt(cambioCalculado)} color="#b45309" sub />}
                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '6px 0' }} />
                    <TotalRow label="Saldo pendiente" value={fmt(saldoRestante)} color={saldoRestante > 0 ? '#b45309' : '#15803d'} strong />
                </div>
            </div>

            {/* ── Monto total destacado ── */}
            <div style={{
                margin: '8px 20px 14px',
                background: esPagoParcial
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'linear-gradient(135deg, #15803d, #166534)',
                borderRadius: '8px',
                padding: '10px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff',
            }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '0.06em' }}>
                        {esPagoParcial ? 'ABONO PARCIAL REGISTRADO' : 'TOTAL PAGADO EN VENTANILLA'}
                    </div>
                    <div style={{ fontSize: '9px', opacity: 0.88, marginTop: '1px' }}>
                        {esPagoParcial ? 'PAGO PARCIAL APLICADO A CUENTA · SUJETO A LIQUIDACIÓN' : 'IMPORTE CUBIERTO SATISFACTORIAMENTE EN CAJA'}
                    </div>
                </div>
                <span style={{ fontWeight: 900, fontSize: '24px', letterSpacing: '0.02em', fontFamily: 'monospace' }}>
                    {fmt(montoPagado)} <span style={{ fontSize: '13px', fontWeight: 700 }}>MXN</span>
                </span>
            </div>

            {/* ── Historial de pagos (si hay más de uno) ── */}
            {historialPagos && historialPagos.length > 0 && (
                <div style={{ margin: '0 20px 14px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Historial de pagos registrados — Factura #{facturaId}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                        <thead>
                            <tr>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '5px 8px', textAlign: 'center', fontWeight: 800, textTransform: 'uppercase' }}>Folio</th>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '5px 8px', textAlign: 'center', fontWeight: 800, textTransform: 'uppercase' }}>Fecha</th>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '5px 8px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Método</th>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '5px 8px', textAlign: 'right', fontWeight: 800, textTransform: 'uppercase' }}>Monto</th>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '5px 8px', textAlign: 'center', fontWeight: 800, textTransform: 'uppercase' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historialPagos.map((p, i) => {
                                const esCurrent = String(p.id) === String(folioPago);
                                return (
                                    <tr key={i} style={{ background: esCurrent ? '#f0fdf4' : '#fff', borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '5px 8px', textAlign: 'center', color: esCurrent ? '#15803d' : '#94a3b8', fontFamily: 'monospace', fontWeight: 700 }}>#{p.id || i + 1}</td>
                                        <td style={{ padding: '5px 8px', textAlign: 'center', color: '#475569', fontWeight: 500 }}>{p.fecha_pago ? fmtFechaCorta(p.fecha_pago) : '—'}</td>
                                        <td style={{ padding: '5px 8px', color: '#475569', fontWeight: 500 }}>{p.metodo_pago || '—'}</td>
                                        <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', fontWeight: esCurrent ? 800 : 600, color: esCurrent ? '#15803d' : '#0f172a' }}>{fmt(p.monto)}</td>
                                        <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                                            {esCurrent
                                                ? <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '8px', padding: '2px 7px', borderRadius: '999px', fontWeight: 800, textTransform: 'uppercase' }}>Este pago</span>
                                                : <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '8px', padding: '2px 7px', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase' }}>Anterior</span>
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Footer ── */}
            <div style={{
                padding: '10px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                fontSize: '9.5px',
                color: '#64748b',
            }}>
                <div>
                    <div style={{ fontWeight: 500 }}>Atendido por: <strong style={{ color: '#0f172a', fontWeight: 800 }}>{operador}</strong></div>
                    <div style={{ marginTop: '2px', fontWeight: 500 }}>Sistema AguaVP · Organismo Operador de Agua Potable de Villa Pesqueira, Sonora · {new Date().getFullYear()}</div>
                    <div style={{ marginTop: '2px', fontStyle: 'italic', fontSize: '8.5px' }}>Este comprobante tiene plena validez fiscal y administrativa sin tachaduras ni enmendaduras.</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        width: '150px',
                        borderTop: '1px solid #94a3b8',
                        paddingTop: '4px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '9px'
                    }}>
                        Firma / Sello de Caja
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Página completa ────────────────────────────────────────────────────────

const ComprobantePago = () => {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useNotifyPrintReady(!loading);

    useEffect(() => {
        const cargarDatos = async () => {
            const dataKey = searchParams.get('dataKey');
            if (!dataKey) {
                setLoading(false);
                return;
            }
            try {
                const raw = await window.api.getPrintData(dataKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    setData(Array.isArray(parsed) ? parsed[0] : parsed);
                }
            } catch (e) {
                console.error('Error cargando datos del comprobante:', e);
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
    }, [searchParams]);

    if (loading) {
        return (
            <div className="bg-slate-50 dark:bg-black/20 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Generando comprobante...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 dark:bg-black/20 min-h-screen py-8 px-4 flex justify-center print:p-0 print:bg-white print:block">
            <style>{`
                @media print {
                    body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: portrait; margin: 8mm; }
                }
            `}</style>
            {data ? (
                <Comprobante data={data} />
            ) : (
                <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-md mx-auto border border-slate-200">
                    <p className="text-slate-500 font-bold">No se encontraron los datos del comprobante.</p>
                </div>
            )}
        </div>
    );
};

export default ComprobantePago;
