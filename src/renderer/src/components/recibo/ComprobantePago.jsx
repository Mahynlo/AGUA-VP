/**
 * ComprobantePago.jsx
 * Plantilla de impresión para comprobantes de pago.
 * Diseño vertical (portrait), una sola hoja.
 */

import { useAppLogo } from '../../context/LogoContext';
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNotifyPrintReady } from '../../hooks/useNotifyPrintReady';

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

// ─── Subcomponentes ─────────────────────────────────────────────────────────
const InfoRow = ({ label, value, bold }) => (
    <tr>
        <td style={{ color: '#64748b', padding: '3px 12px 3px 0', whiteSpace: 'nowrap', verticalAlign: 'top', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            {label}
        </td>
        <td style={{ fontWeight: bold ? 800 : 600, padding: '3px 0', color: '#0f172a', wordBreak: 'break-word', fontSize: '12px', textAlign: 'right' }}>
            {value}
        </td>
    </tr>
);

const TotalRow = ({ label, value, color = '#0f172a', strong, sub }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: sub ? '3px 0' : '5px 0', fontSize: sub ? '11px' : '12px' }}>
        <span style={{ color: '#64748b', fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: strong ? 800 : 700, color, fontFamily: 'monospace' }}>{value}</span>
    </div>
);

// ─── Comprobante individual ────────────────────────────────────────────────

const Comprobante = ({ data }) => {
    const { logoSrc } = useAppLogo();
    if (!data) return null;

    const { folio_pago, factura, pago, cambio, operador, fecha_hora_emision, es_pago_parcial, historial_pagos } = data;
    const icono = METODO_ICONO[pago?.metodo_pago] || METODO_ICONO.default;
    const saldoRestante = Number(factura?.saldo_restante ?? 0);
    const totalFactura = Number(factura?.total ?? 0);
    const estadoColor = es_pago_parcial ? '#b45309' : '#15803d';
    const estadoBg = es_pago_parcial ? '#fffbeb' : '#f0fdf4';
    const estadoBorder = es_pago_parcial ? '#fde68a' : '#bbf7d0';

    return (
        <div
            className="w-full max-w-[760px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 print:shadow-none print:rounded-none print:border-none print:max-w-none"
            style={{
                fontFamily: "'Segoe UI', Arial, sans-serif",
                color: '#0f172a',
                pageBreakInside: 'avoid',
            }}
        >
            {/* ── Header azul (igual a los demás reportes) ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)',
                color: '#fff',
                padding: '14px 20px',
                borderRadius: '8px 8px 0 0',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logoSrc} alt="Escudo" style={{ height: '72px', width: '72px', objectFit: 'contain', flexShrink: 0 }} />
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            Comisión Municipal de Agua Potable y Alcantarillado
                        </div>
                        <div style={{ fontSize: '11px', opacity: 0.88, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Villa Pesqueira, Sonora — Comprobante de pago
                        </div>
                    </div>
                </div>
                <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    textAlign: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Folio</div>
                    <div style={{ fontWeight: 800, fontSize: '16px', marginTop: '2px' }}>#{String(folio_pago || '—').padStart(6, '0')}</div>
                </div>
            </div>

            {/* ── Banda azul con título + estado + fecha ── */}
            <div style={{
                background: '#f0f9ff',
                borderLeft: '4px solid #1e40af',
                borderRight: '1px solid #bfdbfe',
                borderBottom: '1px solid #bfdbfe',
                borderRadius: '0 0 8px 8px',
                padding: '8px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Comprobante de Pago
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                        background: estadoBg,
                        border: `1px solid ${estadoBorder}`,
                        color: estadoColor,
                        fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '3px 10px', borderRadius: '999px',
                    }}>
                        {es_pago_parcial ? '● Pago parcial' : '● Pagado'}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>{fmtFecha(fecha_hora_emision)}</span>
                </div>
            </div>

            {/* ── Datos cliente / comprobante (estilo factura) ── */}
            <div style={{ padding: '20px 24px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#1e3a8a', color: '#fff', padding: '6px 12px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Cliente
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{factura?.cliente_nombre || '—'}</div>
                        <div style={{ borderTop: '1px solid #f1f5f9', margin: '6px 0' }} />
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <InfoRow label="Dirección" value={factura?.direccion_cliente || 'Domicilio conocido'} />
                                <InfoRow label="Localidad" value={factura?.cliente_ciudad || 'Villa Pesqueira'} />
                                <InfoRow label="N° Medidor" value={factura?.medidor_serie || '—'} />
                                <InfoRow label="Tarifa" value={factura?.tarifa_nombre || '—'} />
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ background: '#1e3a8a', color: '#fff', padding: '6px 12px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Datos del comprobante
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                <InfoRow label="Folio comprobante" value={`#${String(folio_pago || '—').padStart(6, '0')}`} bold />
                                <InfoRow label="Folio factura" value={`#${factura?.id || '—'}`} />
                                <InfoRow label="Período" value={factura?.periodo || '—'} />
                                <InfoRow label="Fecha de pago" value={pago?.fecha_pago || '—'} />
                                <InfoRow label="Método" value={`${icono} ${pago?.metodo_pago || '—'}`} />
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Tabla de conceptos (factura real) ── */}
            <div style={{ padding: '8px 24px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                    <thead>
                        <tr>
                            <th style={{ background: '#1e3a8a', color: '#fff', padding: '7px 10px', textAlign: 'left', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Concepto</th>
                            <th style={{ background: '#1e3a8a', color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Período</th>
                            <th style={{ background: '#1e3a8a', color: '#fff', padding: '7px 10px', textAlign: 'center', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consumo</th>
                            <th style={{ background: '#1e3a8a', color: '#fff', padding: '7px 10px', textAlign: 'right', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '9px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>
                                Servicio de agua potable
                                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>Factura #{factura?.id || '—'}</div>
                            </td>
                            <td style={{ padding: '9px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>{factura?.periodo || '—'}</td>
                            <td style={{ padding: '9px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontFamily: 'monospace' }}>{factura?.consumo_m3 ?? '—'} m³</td>
                            <td style={{ padding: '9px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{fmt(totalFactura)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* ── Totales (alineados a la derecha, estilo factura) ── */}
            <div style={{ padding: '14px 24px 4px', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px' }}>
                    <TotalRow label="Total de la factura" value={fmt(totalFactura)} />
                    <TotalRow label={es_pago_parcial ? 'Abono aplicado' : 'Importe pagado'} value={fmt(pago?.monto)} color={estadoColor} strong />
                    <TotalRow label="Cantidad recibida" value={fmt(pago?.cantidad_entregada)} sub />
                    {cambio > 0 && <TotalRow label="Cambio entregado" value={fmt(cambio)} color="#a16207" sub />}
                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '8px 0' }} />
                    {es_pago_parcial ? (
                        <TotalRow label="Saldo pendiente" value={fmt(saldoRestante)} color="#b45309" strong />
                    ) : (
                        <TotalRow label="Saldo pendiente" value={fmt(0)} color="#15803d" strong />
                    )}
                </div>
            </div>

            {/* ── Monto total destacado ── */}
            <div style={{
                margin: '8px 24px 20px',
                background: es_pago_parcial
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'linear-gradient(135deg, #15803d, #166534)',
                borderRadius: '10px',
                padding: '14px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#fff',
            }}>
                <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.06em' }}>
                    {es_pago_parcial ? 'ABONO PARCIAL' : 'TOTAL PAGADO'}
                </div>
                <span style={{ fontWeight: 900, fontSize: '26px', letterSpacing: '0.02em' }}>
                    {fmt(pago?.monto)}
                </span>
            </div>

            {/* ── Nota ── */}
            {pago?.comentario && (
                <div style={{ margin: '0 24px 16px', fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '8px 12px', borderRadius: '6px', fontStyle: 'italic' }}>
                    <strong>Nota:</strong> {pago.comentario}
                </div>
            )}

            {/* ── Historial de pagos (si hay más de uno) ── */}
            {historial_pagos && historial_pagos.length > 0 && (
                <div style={{ margin: '0 24px 20px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                        Historial de pagos — Factura #{factura?.id}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <thead>
                            <tr>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '6px 10px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>#</th>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '6px 10px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Fecha</th>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '6px 10px', textAlign: 'left', fontWeight: 800, textTransform: 'uppercase' }}>Método</th>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '6px 10px', textAlign: 'right', fontWeight: 800, textTransform: 'uppercase' }}>Monto</th>
                                <th style={{ background: '#1e3a8a', color: '#fff', padding: '6px 10px', textAlign: 'center', fontWeight: 800, textTransform: 'uppercase' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial_pagos.map((p, i) => {
                                const esCurrent = p.id == folio_pago;
                                return (
                                    <tr key={i} style={{ background: esCurrent ? '#f0fdf4' : '#fff', borderTop: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '6px 10px', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 600 }}>#{p.id || i + 1}</td>
                                        <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 500 }}>{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-MX') : '—'}</td>
                                        <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 500 }}>{p.metodo_pago || '—'}</td>
                                        <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: esCurrent ? 800 : 600, color: esCurrent ? '#15803d' : '#0f172a' }}>{fmt(p.monto)}</td>
                                        <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                            {esCurrent
                                                ? <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '8px', padding: '2px 8px', borderRadius: '999px', fontWeight: 800, textTransform: 'uppercase' }}>Este pago</span>
                                                : <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '8px', padding: '2px 8px', borderRadius: '999px', fontWeight: 700, textTransform: 'uppercase' }}>Anterior</span>
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
                padding: '14px 24px',
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
                    <div style={{ marginTop: '4px', fontWeight: 500 }}>Sistema AguaVP — Comprobante oficial · {new Date().getFullYear()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        width: '160px',
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
