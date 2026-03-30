/**
 * ComprobantePago.jsx
 * Plantilla de impresión para comprobantes de pago.
 * Diseño vertical (portrait), una sola hoja.
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

// ─── Subcomponente: Fila de tabla informativa ──────────────────────────────
const Fila = ({ label, value, bold }) => (
    <tr>
        <td style={{ color: '#64748b', paddingBottom: '6px', paddingRight: '12px', whiteSpace: 'nowrap', verticalAlign: 'top', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            {label}:
        </td>
        <td style={{ fontWeight: bold ? 800 : 600, paddingBottom: '6px', color: '#0f172a', wordBreak: 'break-word', fontSize: '13px' }}>
            {value}
        </td>
    </tr>
);

// ─── Comprobante individual ────────────────────────────────────────────────

const Comprobante = ({ data }) => {
    if (!data) return null;

    const { folio_pago, factura, pago, cambio, operador, fecha_hora_emision, es_pago_parcial, historial_pagos } = data;
    const icono = METODO_ICONO[pago?.metodo_pago] || METODO_ICONO.default;
    const saldoRestante = factura?.saldo_restante ?? 0;

    return (
        <div 
            className="w-full max-w-[720px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:shadow-none print:rounded-none print:border-none print:max-w-none"
            style={{
                fontFamily: "'Segoe UI', Arial, sans-serif",
                color: '#0f172a',
                pageBreakInside: 'avoid',
            }}
        >
            {/* ── Header ── */}
            <div style={{
                backgroundColor: '#b91c1c', // Rojo institucional sólido y limpio
                color: '#fff',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
            }}>
                <img src={logoagua} alt="Escudo" style={{ height: '56px', width: '56px', objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        COMISARÍA DE AGUA POTABLE
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px', letterSpacing: '0.02em' }}>
                        Villa Pesqueira, Sonora
                    </div>
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    textAlign: 'center',
                    flexShrink: 0,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{ fontSize: '9px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                        Comprobante
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '0.05em', marginTop: '2px' }}>
                        #{String(folio_pago || '—').padStart(6, '0')}
                    </div>
                </div>
            </div>

            {/* ── Sello PAGADO / PARCIAL ── */}
            <div style={{
                background: es_pago_parcial ? '#fffbeb' : '#f0fdf4',
                borderBottom: es_pago_parcial ? '1px solid #fde68a' : '1px solid #bbf7d0',
                padding: '10px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
            }}>
                <span style={{ fontSize: '16px' }}>{es_pago_parcial ? '⚠️' : '✅'}</span>
                <span style={{ fontWeight: 800, color: es_pago_parcial ? '#b45309' : '#15803d', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {es_pago_parcial ? 'PAGO PARCIAL REGISTRADO' : 'Pago Registrado Exitosamente'}
                </span>
                {es_pago_parcial && (
                    <span style={{ fontSize: '11px', color: '#92400e', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '2px 8px', fontWeight: 700, marginLeft: '8px' }}>
                        Saldo pendiente: {fmt(saldoRestante)}
                    </span>
                )}
                <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '11px', fontWeight: 600 }}>
                    {fmtFecha(fecha_hora_emision)}
                </span>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Columna 1: Datos del cliente */}
                <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                        Datos del Cliente
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                        {es_pago_parcial ? 'Factura (Abono Parcial)' : 'Factura Pagada'}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            <Fila label="Folio Factura" value={`#${factura?.id || '—'}`} />
                            <Fila label="Período"       value={factura?.periodo || '—'} />
                            <Fila label="Consumo"       value={`${factura?.consumo_m3 ?? '—'} m³`} />
                            <Fila label="Total Factura" value={fmt(factura?.total)} />
                            {es_pago_parcial && (
                                <Fila label="Saldo restante" value={fmt(saldoRestante)} bold />
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* ── Resumen del pago ── */}
            <div style={{
                margin: '0 24px 20px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                overflow: 'hidden',
            }}>
                <div style={{
                    background: '#0f172a', // Slate 900
                    color: '#fff',
                    padding: '8px 16px',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                }}>
                    Detalle del Pago
                </div>
                <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Método de pago</span>
                        <span style={{ fontWeight: 700 }}>{icono} {pago?.metodo_pago || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Fecha de operación</span>
                        <span style={{ fontWeight: 600 }}>{pago?.fecha_pago || '—'}</span>
                    </div>
                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>{es_pago_parcial ? 'Abono aplicado' : 'Saldo pagado'}</span>
                        <span style={{ fontWeight: 800, color: es_pago_parcial ? '#b45309' : '#15803d' }}>{fmt(pago?.monto)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Cantidad recibida</span>
                        <span style={{ fontWeight: 700 }}>{fmt(pago?.cantidad_entregada)}</span>
                    </div>
                    {cambio > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fef9c3', borderRadius: '8px', marginTop: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#a16207' }}>Cambio entregado</span>
                            <span style={{ fontWeight: 800, color: '#a16207' }}>{fmt(cambio)}</span>
                        </div>
                    )}
                    {es_pago_parcial && saldoRestante > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginTop: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#b45309' }}>Saldo pendiente actual</span>
                            <span style={{ fontWeight: 800, color: '#b45309' }}>{fmt(saldoRestante)}</span>
                        </div>
                    )}
                    {pago?.comentario && (
                        <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontStyle: 'italic' }}>
                            <strong>Nota:</strong> {pago.comentario}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Monto total destacado ── */}
            <div style={{
                margin: '0 24px 24px',
                background: es_pago_parcial
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'linear-gradient(135deg, #15803d, #166534)',
                borderRadius: '12px',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.05em', opacity: 0.9 }}>
                        {es_pago_parcial ? 'ABONO PARCIAL' : 'TOTAL PAGADO'}
                    </div>
                </div>
                <span style={{ fontWeight: 900, fontSize: '28px', letterSpacing: '0.02em' }}>
                    {fmt(pago?.monto)}
                </span>
            </div>

            {/* ── Historial de pagos (si hay más de uno) ── */}
            {historial_pagos && historial_pagos.length > 0 && (
                <div style={{ margin: '0 24px 24px' }}>
                    <div style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '8px 16px',
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        borderRadius: '8px 8px 0 0',
                        border: '1px solid #e2e8f0',
                        borderBottom: 'none'
                    }}>
                        Historial de Pagos — Factura #{factura?.id}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #e2e8f0', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>#</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Fecha</th>
                                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Método</th>
                                <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Monto</th>
                                <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial_pagos.map((p, i) => {
                                const esCurrent = p.id == folio_pago;
                                return (
                                    <tr key={i} style={{ background: esCurrent ? '#f0fdf4' : '#fff', borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '8px 12px', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>#{p.id || i + 1}</td>
                                        <td style={{ padding: '8px 12px', color: '#475569', fontWeight: 500 }}>{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-MX') : '—'}</td>
                                        <td style={{ padding: '8px 12px', color: '#475569', fontWeight: 500 }}>{p.metodo_pago || '—'}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: esCurrent ? 800 : 600, color: esCurrent ? '#15803d' : '#0f172a' }}>{fmt(p.monto)}</td>
                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                            {esCurrent
                                                ? <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '9px', padding: '2px 8px', borderRadius: '999px', fontWeight: 800, textTransform: 'uppercase' }}>Este pago</span>
                                                : <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '9px', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase' }}>Anterior</span>
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
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                fontSize: '10px',
                color: '#64748b',
            }}>
                <div>
                    <div style={{ fontWeight: 500 }}>Atendido por: <strong style={{ color: '#0f172a', fontWeight: 800 }}>{operador || '—'}</strong></div>
                    <div style={{ marginTop: '4px', fontWeight: 500 }}>Sistema AguaVP — {new Date().getFullYear()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        width: '140px',
                        borderTop: '1px solid #94a3b8',
                        paddingTop: '6px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        Firma / Sello
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
                    @page { size: portrait; margin: 10mm; }
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
