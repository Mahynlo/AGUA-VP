import React from 'react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { useAppLogo } from '../../../context/LogoContext'

export default function PrintableDocContainer({
  printData,
  fileContents,
  filteredSections,
  sectionConfig
}) {
  const { logoSrc } = useAppLogo()
  if (!printData) return null

  const { alcance, seccion, archivo, incluirPortada, incluirIndice } = printData
  const fechaHoy = new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Construir la lista de documentos a imprimir según el alcance
  let docsAImprimir = []

  if (alcance === 'guia_actual') {
    const key = `${seccion}/${archivo}`
    const content = fileContents[key] || ''
    const files = filteredSections[seccion] || []
    const fileObj = files.find((f) => f.fileName === archivo)
    docsAImprimir.push({
      seccionKey: seccion,
      seccionTitulo: sectionConfig[seccion]?.title || seccion,
      fileName: archivo,
      titulo: fileObj?.metadata?.titulo || archivo.replace('.md', ''),
      descripcion: fileObj?.metadata?.descripcion || '',
      orden: fileObj?.metadata?.orden || 1,
      tags: fileObj?.metadata?.tags || [],
      content
    })
  } else if (alcance === 'modulo_actual') {
    const files = filteredSections[seccion] || []
    files.forEach((f) => {
      const key = `${seccion}/${f.fileName}`
      const content = fileContents[key] || ''
      docsAImprimir.push({
        seccionKey: seccion,
        seccionTitulo: sectionConfig[seccion]?.title || seccion,
        fileName: f.fileName,
        titulo: f.metadata?.titulo || f.fileName.replace('.md', ''),
        descripcion: f.metadata?.descripcion || '',
        orden: f.metadata?.orden || 1,
        tags: f.metadata?.tags || [],
        content
      })
    })
  } else if (alcance === 'manual_completo') {
    Object.entries(filteredSections).forEach(([secKey, files]) => {
      files.forEach((f) => {
        const key = `${secKey}/${f.fileName}`
        const content = fileContents[key] || ''
        docsAImprimir.push({
          seccionKey: secKey,
          seccionTitulo: sectionConfig[secKey]?.title || secKey,
          fileName: f.fileName,
          titulo: f.metadata?.titulo || f.fileName.replace('.md', ''),
          descripcion: f.metadata?.descripcion || '',
          orden: f.metadata?.orden || 1,
          tags: f.metadata?.tags || [],
          content
        })
      })
    })
  }

  const tituloModulo = sectionConfig[seccion]?.title || seccion || 'Manual de Operación'

  return (
    <div id="print-doc-container" className="hidden print:block w-full bg-white text-slate-900">
      {/* ── PORTADA INSTITUCIONAL (Para Módulo o Manual Completo) ── */}
      {alcance !== 'guia_actual' && incluirPortada && (
        <div className="min-h-[85vh] flex flex-col justify-between items-center text-center p-12 print-page-break">
          <div className="w-full flex justify-between items-center border-b pb-6 border-slate-300">
            <img src={logoSrc} alt="Logo Institucional" className="w-20 h-auto object-contain" />
            <div className="text-right">
              <h4 className="font-black text-sm uppercase tracking-widest text-slate-700">
                Sistema AguaVP
              </h4>
              <p className="text-xs text-slate-500">Organismo Operador de Agua Potable</p>
            </div>
          </div>

          <div className="my-auto space-y-6 max-w-xl">
            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-100 text-blue-800 border border-blue-200">
              {alcance === 'manual_completo'
                ? 'Manual General de Operación'
                : `Manual de Módulo: ${tituloModulo}`}
            </span>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
              {alcance === 'manual_completo'
                ? 'Manual Integral de Usuario y Procedimientos'
                : `Guía Maestra: ${tituloModulo}`}
            </h1>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Documentación técnica, flujos operativos, catálogo de procedimientos y reglas de
              negocio del sistema AguaVP.
            </p>
          </div>

          <div className="w-full border-t pt-6 border-slate-300 flex justify-between text-xs text-slate-500">
            <span>
              Fecha de emisión: <strong>{fechaHoy}</strong>
            </span>
            <span>
              Versión: <strong>1.2 Oficial</strong>
            </span>
          </div>
        </div>
      )}

      {/* ── ÍNDICE TEMÁTICO ── */}
      {alcance !== 'guia_actual' && incluirIndice && (
        <div className="p-8 print-page-break">
          <h2 className="text-2xl font-black text-slate-900 border-b-2 border-slate-900 pb-3 mb-6 uppercase tracking-wider">
            Tabla de Contenidos
          </h2>

          <div className="space-y-6">
            {alcance === 'modulo_actual' ? (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-blue-900 uppercase tracking-wide">
                  {tituloModulo} ({docsAImprimir.length} guías)
                </h3>
                <ul className="space-y-2 pl-4 border-l-2 border-slate-200">
                  {docsAImprimir.map((doc, index) => (
                    <li key={index} className="flex justify-between items-baseline text-sm">
                      <span className="font-semibold text-slate-800">
                        {index + 1}. {doc.titulo}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {doc.descripcion ? doc.descripcion.slice(0, 60) + '...' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              Object.entries(filteredSections).map(([secKey, files], sIdx) => (
                <div key={secKey} className="space-y-2">
                  <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest flex items-center gap-2">
                    <span>{sIdx + 1}.</span>
                    <span>{sectionConfig[secKey]?.title || secKey}</span>
                  </h3>
                  <ul className="space-y-1.5 pl-6 border-l-2 border-slate-200">
                    {files.map((f, fIdx) => (
                      <li key={f.fileName} className="text-xs font-semibold text-slate-700">
                        {sIdx + 1}.{fIdx + 1} {f.metadata?.titulo || f.fileName.replace('.md', '')}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── CUERPO DE LAS GUÍAS ── */}
      {docsAImprimir.map((doc, docIndex) => (
        <article
          key={`${doc.seccionKey}-${doc.fileName}-${docIndex}`}
          className={`p-8 ${docIndex > 0 || (alcance !== 'guia_actual' && (incluirPortada || incluirIndice)) ? 'print-page-break' : ''}`}
        >
          {/* Encabezado Institucional del Capítulo */}
          <header className="print-header mb-6 pb-4 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500">
            <span className="font-bold text-blue-800 uppercase tracking-wider">
              AguaVP • {doc.seccionTitulo}
            </span>
            <span>Guía #{doc.orden}</span>
          </header>

          {/* Contenido Markdown Renderizado */}
          <div className="prose prose-slate max-w-none">
            <MarkdownRenderer content={doc.content} />
          </div>

          {/* Pie de Página del Documento */}
          <footer className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span>Sistema Integral de Agua Potable AguaVP</span>
            <span>
              {doc.seccionTitulo} • {doc.titulo}
            </span>
          </footer>
        </article>
      ))}
    </div>
  )
}
