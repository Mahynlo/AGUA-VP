import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import logoagua from '../../assets/images/Escudo_Villa_Pesqueira_sin_fondo.png';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtFecha = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }); }
    catch { return iso; }
};

const getFechaHoy = () => new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
const getMesLabel = (mes) => {
    if (!mes) return '';
    try {
        const [y, m] = mes.split('-');
        return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    } catch { return mes; }
};

// ─── Subcomponentes ───────────────────────────────────────────────────────────

const PageHeader = ({ mes, totalRegistros }) => (
    <div style={{ marginBottom: '18px' }}>
        {/* Franja principal */}
        <div style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)',
            color: '#fff',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderRadius: '8px 8px 0 0',
        }}>
            <img src={logoagua} alt="Escudo" style={{ height: '56px', width: '56px', objectFit: 'contain', flexShrink: 0, filter: 'brightness(0) invert(1)' }} />
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    COMISARÍA DE AGUA POTABLE
                </div>
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    Villa Pesqueira, Sonora — Reporte Operativo de Campo
                </div>
            </div>
            <div style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '8px',
                padding: '8px 16px',
                textAlign: 'center',
                flexShrink: 0,
            }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.8 }}>Período</div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '2px', textTransform: 'capitalize' }}>
                    {getMesLabel(mes) || 'General'}
                </div>
            </div>
        </div>
        {/* Barra de título */}
        <div style={{
            background: '#f0f9ff',
            borderLeft: '4px solid #1e40af',
            borderRight: '1px solid #bfdbfe',
            borderBottom: '1px solid #bfdbfe',
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: '0 0 6px 6px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    TOMA DE LECTURAS
                </span>
                <span style={{
                    background: '#1e40af', color: '#fff',
                    fontSize: '10px', fontWeight: 700,
                    padding: '2px 10px', borderRadius: '999px',
                }}>
                    {totalRegistros} tomas
                </span>
            </div>
            <div style={{ textAlign: 'right', fontSize: '10px', color: '#6b7280' }}>
                <div style={{ fontWeight: 600, color: '#374151' }}>Fecha de emisión</div>
                <div style={{ textTransform: 'capitalize' }}>{getFechaHoy()}</div>
            </div>
        </div>
    </div>
);

// ─── Tabla real con <thead> para que el encabezado se repita en cada hoja ────────────

const TH = ({ children, align = 'left', last = false }) => (
    <th style={{
        padding: '7px 9px',
        background: '#1e3a8a',
        color: '#fff',
        fontSize: '9px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        textAlign: align,
        borderRight: last ? 'none' : '1px solid rgba(255,255,255,0.18)',
        whiteSpace: 'nowrap',
    }}>
        {children}
    </th>
);

const DataTable = ({ items, offset = 0 }) => (
    <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        fontSize: '10px',
    }}>
        <colgroup>
            <col style={{ width: '30px' }} />
            <col />
            <col style={{ width: '105px' }} />
            <col style={{ width: '72px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
        </colgroup>
        <thead>
            <tr>
                <TH align="center">#</TH>
                <TH>Cliente / Dirección</TH>
                <TH>N° Medidor</TH>
                <TH align="center">Lect. Ant.</TH>
                <TH align="center">Diferencia</TH>
                <TH align="center" last>Lect. Actual</TH>
            </tr>
        </thead>
        <tbody>
            {items.map((item, idx) => {
                const nombre     = item.nombre || item.cliente || 'Sin Nombre';
                const medidorObj = typeof item.medidor === 'object' ? item.medidor : null;
                const serie      = medidorObj ? (medidorObj.serie || medidorObj.numero_serie || 'S/N') : (item.medidor || 'S/N');
                const direccion  = medidorObj?.ubicacion || item.direccion || '';
                const lectAntObj = typeof item.lectura_anterior === 'object' ? item.lectura_anterior : null;
                const consumoAnt = lectAntObj?.consumo_registrado ?? (typeof item.lectura_anterior === 'number' ? item.lectura_anterior : '');
                const isEven     = idx % 2 === 0;
                const bg         = isEven ? '#ffffff' : '#f5f8ff';
                const td         = { padding: '5px 8px', borderRight: '1px solid #e5e7eb', verticalAlign: 'middle', color: '#111827', background: bg };
                return (
                    <tr key={idx} style={{ pageBreakInside: 'avoid' }}>
                        {/* # */}
                        <td style={{ ...td, textAlign: 'center', color: '#9ca3af', fontWeight: 700, background: '#f9fafb', fontSize: '9px' }}>
                            {offset + idx + 1}
                        </td>
                        {/* Cliente */}
                        <td style={{ ...td, overflow: 'hidden', maxWidth: 0 }}>
                            <div style={{ fontWeight: 700, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {nombre}
                            </div>
                            {direccion && (
                                <div style={{ fontSize: '8px', color: '#6b7280', textTransform: 'uppercase', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    📍 {direccion}
                                </div>
                            )}
                        </td>
                        {/* Medidor */}
                        <td style={{ ...td, background: isEven ? '#f0f4ff' : '#e8eeff' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{serie}</span>
                        </td>
                        {/* Lect. Anterior */}
                        <td style={{ ...td, textAlign: 'center', background: '#eff6ff' }}>
                            {consumoAnt !== '' ? (
                                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e40af', fontSize: '11px' }}>
                                    {consumoAnt}<span style={{ fontSize: '7px', marginLeft: '1px', opacity: 0.65 }}>m³</span>
                                </span>
                            ) : <span style={{ color: '#d1d5db' }}>—</span>}
                        </td>
                        {/* Diferencia — espacio de escritura */}
                        <td style={{ ...td, background: '#fafafa', position: 'relative', borderRight: '1px solid #e5e7eb' }}>
                            <span style={{ position: 'absolute', bottom: '3px', right: '5px', fontSize: '7px', color: '#d1d5db' }}>m³</span>
                        </td>
                        {/* Lect. Actual — espacio de escritura */}
                        <td style={{ ...td, background: '#fafafa', borderRight: 'none', position: 'relative' }}>
                            <span style={{ position: 'absolute', bottom: '3px', right: '5px', fontSize: '7px', color: '#d1d5db' }}>m³</span>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>
);

const GrupoSection = ({ grupo, offset = 0 }) => (
    <div style={{ marginBottom: '22px' }}>
        {/* Etiqueta del grupo */}
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#e0e7ff', border: '1px solid #c7d2fe',
            borderRadius: '4px', padding: '5px 12px', marginBottom: '2px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1e40af' }} />
                <span style={{ fontWeight: 800, fontSize: '11px', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {grupo.localidad || grupo.ruta || 'Localidad'}
                </span>
            </div>
            <span style={{ fontSize: '9px', color: '#6b7280', fontFamily: 'monospace' }}>
                {grupo.clientes?.length || 0} registros
            </span>
        </div>
        <DataTable items={grupo.clientes || []} offset={offset} />
        <div style={{ height: '2px', background: '#1e3a8a', borderRadius: '0 0 4px 4px' }} />
    </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────

const ReporteLecturas = () => {
    const [searchParams] = useSearchParams();
    const [data, setData]     = useState([]);
    const [mes, setMes]       = useState('');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const cargarDatos = async () => {
            setMes(searchParams.get('mes') || '');
            const dataKey   = searchParams.get('dataKey');
            const dataParam = searchParams.get('data');
            const useStorage = searchParams.get('useStorage');

            if (dataKey) {
                try {
                    const raw = await window.api.getPrintData(dataKey);
                    if (raw) setData(typeof raw === 'string' ? JSON.parse(raw) : raw);
                } catch (e) { console.error('Error IPC:', e); }
            } else if (dataParam) {
                try { setData(JSON.parse(decodeURIComponent(dataParam))); } catch (e) { console.error(e); }
            } else if (useStorage) {
                try {
                    const stored = localStorage.getItem('reporte_lecturas_data');
                    if (stored) setData(JSON.parse(stored));
                } catch (e) { console.error(e); }
            } else {
                // Demo
                setData(Array.from({ length: 8 }, (_, i) => ({
                    id: 1000 + i, nombre: `CLIENTE DEMO ${i + 1}`,
                    direccion: `CALLE ${i + 1}, COLONIA CENTRO`,
                    medidor: { numero_serie: `M-${5000 + i}`, ubicacion: `CALLE ${i + 1}` },
                    lectura_anterior: { consumo_registrado: 1200 + i * 15 },
                })));
            }
            setIsReady(true);
        };
        cargarDatos();
    }, [searchParams]);

    if (!isReady) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#6b7280' }}>
            Cargando reporte…
        </div>
    );

    const isGrouped   = data.length > 0 && data[0]?.clientes;
    const totalRegistros = isGrouped
        ? data.reduce((acc, g) => acc + (g.clientes?.length || 0), 0)
        : data.length;

    return (
        <>
            <style>{`
                @media print {
                    @page { size: letter portrait; margin: 10mm; }
                    body { margin: 0; padding: 0; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    thead { display: table-header-group; }
                    tr    { page-break-inside: avoid; }
                }
            `}</style>

            <div style={{
                background: '#fff',
                minHeight: '100vh',
                padding: '24px',
                fontFamily: "'Segoe UI', Arial, sans-serif",
                color: '#111827',
            }}>
                <PageHeader mes={mes} totalRegistros={totalRegistros} />

                {/* Tablas */}
                {isGrouped ? (
                    (() => {
                        let offset = 0;
                        return data.map((grupo, gIdx) => {
                            const el = <GrupoSection key={gIdx} grupo={grupo} offset={offset} />;
                            offset += grupo.clientes?.length || 0;
                            return el;
                        });
                    })()
                ) : (
                    <div style={{ marginBottom: '20px' }}>
                        <DataTable items={data} offset={0} />
                        <div style={{ height: '2px', background: '#1e3a8a', borderRadius: '0 0 4px 4px' }} />
                    </div>
                )}

                {/* Footer */}
                <div style={{
                    marginTop: '16px',
                    paddingTop: '10px',
                    borderTop: '1px dashed #d1d5db',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '9px',
                    color: '#9ca3af',
                }}>
                    <span>Sistema AguaVP — Comisaría de Agua Potable Villa Pesqueira</span>
                    <span style={{ fontWeight: 600, color: '#374151' }}>{totalRegistros} tomas de lectura listadas</span>
                    <span>Documento generado automáticamente — no requiere firma</span>
                </div>
            </div>
        </>
    );
};

export default ReporteLecturas;
