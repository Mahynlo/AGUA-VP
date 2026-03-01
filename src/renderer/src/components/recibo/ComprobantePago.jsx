/**
 * ComprobantePago.jsx
 * Plantilla de impresión para comprobantes de pago.
 * Diseño vertical (portrait), una sola hoja.
 * Muestra historial de abonos parciales cuando existen múltiples pagos.
 *
 * Estructura del objeto de datos esperado:
 * {
 *   folio_pago:        number | string,
 *   factura:           { id, cliente_nombre, direccion_cliente, cliente_ciudad, periodo, tarifa_nombre, medidor_serie, consumo_m3, total, saldo_restante },
 *   pago:              { monto, cantidad_entregada, metodo_pago, comentario, fecha_pago },
 *   historial_pagos:   [{ id, monto, fecha_pago, metodo_pago }],
 *   cambio:            number,
 *   es_pago_parcial:   boolean,
 *   operador:          string,
 *   fecha_hora_emision: string (ISO)
 * }
 */

import logoagua from '../../assets/images/Escudo_Villa_Pesqueira_sin_fondo.png';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n) =>
    typeof n === 'number' ? `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${parseFloat(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtFecha = (iso) => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('es-MX', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
    } catch { return iso; }
};

const METODO_ICONO = {
    Efectivo: '💵',
    Tarjeta:  '💳',
    default:  '📄'
};

// ─── Comprobante individual ────────────────────────────────────────────────

const Comprobante = ({ data }) => {
    if (!data) return null;

    const { folio_pago, factura, pago, cambio, operador, fecha_hora_emision, es_pago_parcial, historial_pagos } = data;
    const icono = METODO_ICONO[pago?.metodo_pago] || METODO_ICONO.default;
    const saldoRestante = factura?.saldo_restante ?? 0;

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '720px',
                margin: '0 auto',
                fontFamily: "'Segoe UI', Arial, sans-serif",
                fontSize: '13px',
                color: '#1a1a1a',
                background: '#fff',
                border: '1.5px solid #b91c1c',
                borderRadius: '8px',
                overflow: 'hidden',
                pageBreakInside: 'avoid',
            }}
        >
            {/* ── Header ── */}
            <div style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
                color: '#fff',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
            }}>
                <img src={logoagua} alt="Escudo" style={{ height: '54px', width: '54px', objectFit: 'contain', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '0.03em' }}>
                        COMISARÍA DE AGUA POTABLE
                    </div>
                    <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                        Villa Pesqueira, Sonora
                    </div>
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    textAlign: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Comprobante
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.05em', marginTop: '1px' }}>
                        #{String(folio_pago || '—').padStart(6, '0')}
                    </div>
                </div>
            </div>

            {/* ── Sello PAGADO / PARCIAL ── */}
            <div style={{
                background: es_pago_parcial ? '#fffbeb' : '#f0fdf4',
                borderBottom: es_pago_parcial ? '1px solid #fde68a' : '1px solid #bbf7d0',
                padding: '8px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}>
                <span style={{ fontSize: '14px' }}>{es_pago_parcial ? '⚠️' : '✅'}</span>
                <span style={{ fontWeight: 700, color: es_pago_parcial ? '#b45309' : '#15803d', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {es_pago_parcial ? 'PAGO PARCIAL REGISTRADO' : 'Pago Registrado Exitosamente'}
                </span>
                {es_pago_parcial && (
                    <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', padding: '1px 7px', fontWeight: 600 }}>
                        Saldo pendiente: {fmt(saldoRestante)}
                    </span>
                )}
                <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '11px' }}>
                    {fmtFecha(fecha_hora_emision)}
                </span>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Columna 1: Datos del cliente */}
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                        Datos del Cliente
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <tbody>
                            <Fila label="Nombre"    value={factura?.cliente_nombre || '—'} bold />
                            <Fila label="Dirección" value={factura?.direccion_cliente || 'Domicilio conocido'} />
                            <Fila label="Localidad" value={factura?.cliente_ciudad || 'Villa Pesqueira'} />
                            <Fila label="N° Medidor" value={factura?.medidor_serie || '—'} />
                            <Fila label="Tarifa"    value={factura?.tarifa_nombre || '—'} />
                        </tbody>
                    </table>
                </div>

                {/* Columna 2: Datos de la factura */}
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                        {es_pago_parcial ? 'Factura (Abono Parcial)' : 'Factura Pagada'}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <tbody>
                            <Fila label="Folio Factura" value={`#${factura?.id || '—'}`} />
                            <Fila label="Período"       value={factura?.periodo || '—'} />
                            <Fila label="Consumo"       value={`${factura?.consumo_m3 ?? '—'} m³`} />
                            <Fila label="Total Factura" value={fmt(factura?.total)} />
                            {es_pago_parcial && (
                                <Fila label="Saldo pendiente" value={fmt(saldoRestante)} bold />
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* ── Resumen del pago ── */}
            <div style={{
                margin: '0 20px 16px',
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden',
            }}>
                <div style={{
                    background: '#1e3a5f',
                    color: '#fff',
                    padding: '6px 14px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                }}>
                    Detalle del Pago
                </div>
                <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#6b7280' }}>Método</span>
                        <span style={{ fontWeight: 600 }}>{icono} {pago?.metodo_pago || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#6b7280' }}>Fecha de pago</span>
                        <span>{pago?.fecha_pago || '—'}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#6b7280' }}>{es_pago_parcial ? 'Abono aplicado' : 'Saldo pagado'}</span>
                        <span style={{ fontWeight: 600, color: es_pago_parcial ? '#b45309' : '#15803d' }}>{fmt(pago?.monto)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: '#6b7280' }}>Cantidad recibida</span>
                        <span>{fmt(pago?.cantidad_entregada)}</span>
                    </div>
                    {cambio > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#fef9c3', borderRadius: '4px', marginTop: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#92400e' }}>Cambio entregado</span>
                            <span style={{ fontWeight: 700, color: '#92400e' }}>{fmt(cambio)}</span>
                        </div>
                    )}
                    {es_pago_parcial && saldoRestante > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '4px', marginTop: '4px' }}>
                            <span style={{ fontWeight: 600, color: '#92400e' }}>Saldo pendiente</span>
                            <span style={{ fontWeight: 700, color: '#b45309' }}>{fmt(saldoRestante)}</span>
                        </div>
                    )}
                    {pago?.comentario && (
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                            Nota: {pago.comentario}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Monto total destacado ── */}
            <div style={{
                margin: '0 20px 16px',
                background: es_pago_parcial
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'linear-gradient(135deg, #15803d, #166534)',
                borderRadius: '6px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff',
            }}>
                <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                        {es_pago_parcial ? 'ABONO PARCIAL' : 'TOTAL PAGADO'}
                    </div>
                    {es_pago_parcial && (
                        <div style={{ fontSize: '10px', opacity: 0.85, marginTop: '2px' }}>
                            Pendiente: {fmt(saldoRestante)}
                        </div>
                    )}
                </div>
                <span style={{ fontWeight: 800, fontSize: '22px', letterSpacing: '0.02em' }}>
                    {fmt(pago?.monto)}
                </span>
            </div>

            {/* ── Historial de pagos (si hay más de uno) ── */}
            {historial_pagos && historial_pagos.length > 0 && (
                <div style={{ margin: '0 20px 16px' }}>
                    <div style={{
                        background: '#1e3a5f',
                        color: '#fff',
                        padding: '6px 14px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        borderRadius: '6px 6px 0 0',
                    }}>
                        Historial de Pagos — Factura #{factura?.id}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                        <thead>
                            <tr style={{ background: '#f3f4f6' }}>
                                <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>#</th>
                                <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Fecha</th>
                                <th style={{ padding: '5px 10px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Método</th>
                                <th style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 600, color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Monto</th>
                                <th style={{ padding: '5px 10px', textAlign: 'center', fontWeight: 600, color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial_pagos.map((p, i) => {
                                const esCurrent = p.id == folio_pago;
                                return (
                                    <tr key={i} style={{ background: esCurrent ? '#f0fdf4' : '#fff', borderTop: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '5px 10px', color: '#9ca3af', fontFamily: 'monospace' }}>#{p.id || i + 1}</td>
                                        <td style={{ padding: '5px 10px', color: '#374151' }}>{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-MX') : '—'}</td>
                                        <td style={{ padding: '5px 10px', color: '#374151' }}>{p.metodo_pago || '—'}</td>
                                        <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: esCurrent ? 700 : 500, color: esCurrent ? '#15803d' : '#111827' }}>{fmt(p.monto)}</td>
                                        <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                                            {esCurrent
                                                ? <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '10px', padding: '1px 7px', borderRadius: '999px', fontWeight: 700 }}>Este pago</span>
                                                : <span style={{ background: '#f3f4f6', color: '#6b7280', fontSize: '10px', padding: '1px 7px', borderRadius: '999px' }}>Anterior</span>
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
                padding: '10px 20px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                borderTop: '1px solid #e5e7eb',
                fontSize: '10px',
                color: '#9ca3af',
            }}>
                <div>
                    <div>Atendido por: <strong style={{ color: '#374151' }}>{operador || '—'}</strong></div>
                    <div style={{ marginTop: '2px' }}>Sistema AguaVP — {new Date().getFullYear()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        width: '120px',
                        borderTop: '1px solid #9ca3af',
                        paddingTop: '4px',
                        textAlign: 'center',
                        color: '#6b7280',
                    }}>
                        Firma / Sello
                    </div>
                </div>
            </div>
        </div>
    );
};

// Fila de tabla informativa
const Fila = ({ label, value, bold }) => (
    <tr>
        <td style={{ color: '#6b7280', paddingBottom: '4px', paddingRight: '8px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
            {label}:
        </td>
        <td style={{ fontWeight: bold ? 700 : 500, paddingBottom: '4px', color: '#111827', wordBreak: 'break-word' }}>
            {value}
        </td>
    </tr>
);

// ─── Página completa: una hoja vertical ─────────────────────────────────────

const ComprobantePago = () => {
    const [searchParams] = useSearchParams();
    const [data, setData] = useState(null);

    useEffect(() => {
        const cargarDatos = async () => {
            const dataKey = searchParams.get('dataKey');
            if (!dataKey) return;
            try {
                const raw = await window.api.getPrintData(dataKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    // Normalizar: si llegó un array por alguna razón, tomar el primero
                    setData(Array.isArray(parsed) ? parsed[0] : parsed);
                }
            } catch (e) {
                console.error('Error cargando datos del comprobante:', e);
            }
        };
        cargarDatos();
    }, []);

    return (
        <div style={{
            background: '#fff',
            color: '#1a1a1a',
            minHeight: '100vh',
            padding: '20px',
        }}>
            <style>{`
                @media print {
                    body { margin: 0; padding: 0; }
                    @page { size: portrait; margin: 10mm; }
                }
            `}</style>
            <Comprobante data={data} />
        </div>
    );
};

export default ComprobantePago;
