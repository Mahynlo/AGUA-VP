import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppLogo } from "../../context/LogoContext";
import { useNotifyPrintReady } from "../../hooks/useNotifyPrintReady";
import { MarkdownRenderer } from "../vistas/ayuda/MarkdownRenderer";
import EscudoVillaPesqueira from "../../assets/images/Escudo_Villa_Pesqueira_sin_fondo.png";
import 'katex/dist/katex.min.css';

const ReporteDocumentacion = () => {
  const [searchParams] = useSearchParams();
  const { logoSrc } = useAppLogo();
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);

  useNotifyPrintReady(ready);

  useEffect(() => {
    const load = async () => {
      const dataKey = searchParams.get("dataKey");
      if (!dataKey) {
        setData(null);
        setReady(true);
        return;
      }

      try {
        const raw = await window.api.getPrintData(dataKey);
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        setData(parsed || null);
      } catch (error) {
        console.error("Error leyendo datos de impresión de documentación:", error);
        setData(null);
      } finally {
        setReady(true);
      }
    };

    load();
  }, [searchParams]);

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans">
        Cargando documento para impresión...
      </div>
    );
  }

  const {
    alcance = "guia_actual",
    tituloPrincipal = "Documentación del Sistema AguaVP",
    subtitulo = "Manual de Operación y Procedimientos",
    fechaHoy = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }),
    incluirPortada = true,
    incluirIndice = true,
    docs = []
  } = data;

  const escudoImg = logoSrc || EscudoVillaPesqueira;

  return (
    <div className="bg-white text-slate-900 font-sans min-h-screen">
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 1.2cm 1.2cm 1.2cm 1.2cm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break {
            break-after: page !important;
            page-break-after: always !important;
          }
          .page-break:last-child {
            break-after: auto !important;
            page-break-after: auto !important;
          }
          .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── 1. PORTADA INSTITUCIONAL (Para Módulo o Manual Completo) ── */}
      {alcance !== "guia_actual" && incluirPortada && (
        <div className="min-h-[92vh] flex flex-col justify-between items-center text-center p-12 page-break">
          {/* Cabecera Portada */}
          <div className="w-full flex justify-between items-center border-b pb-6 border-slate-200">
            <img src={escudoImg} alt="Escudo Institucional" className="w-20 h-auto object-contain" />
            <div className="text-right">
              <h4 className="font-black text-sm uppercase tracking-widest text-slate-800">Sistema AguaVP</h4>
              <p className="text-xs text-slate-500 font-medium">Organismo Operador de Agua Potable</p>
            </div>
          </div>

          {/* Títulos Centrales */}
          <div className="my-auto space-y-6 max-w-xl">
            <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-800 border border-blue-200">
              {alcance === "manual_completo" ? "Manual General de Operación" : "Manual de Procedimientos por Módulo"}
            </span>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
              {tituloPrincipal}
            </h1>
            <p className="text-base font-medium text-slate-600 leading-relaxed">
              {subtitulo}
            </p>
          </div>

          {/* Pie de Portada */}
          <div className="w-full border-t pt-6 border-slate-200 flex justify-between text-xs text-slate-500">
            <span>Fecha de Emisión: <strong className="text-slate-700">{fechaHoy}</strong></span>
            <span>Versión del Software: <strong className="text-slate-700">1.2 Oficial</strong></span>
          </div>
        </div>
      )}

      {/* ── 2. TABLA DE CONTENIDOS / ÍNDICE (Para Módulo o Manual Completo) ── */}
      {alcance !== "guia_actual" && incluirIndice && docs.length > 1 && (
        <div className="p-10 page-break">
          <div className="border-b-2 border-slate-900 pb-3 mb-8 flex justify-between items-baseline">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-wider">
              Tabla de Contenidos
            </h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {docs.length} temas incluidos
            </span>
          </div>

          <div className="space-y-4">
            {docs.map((doc, idx) => (
              <div key={idx} className="flex justify-between items-baseline border-b border-slate-100 pb-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs font-bold text-blue-700 w-6">
                    {String(idx + 1).padStart(2, "0")}.
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-800">
                      {doc.titulo}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {doc.seccionTitulo} • {doc.descripcion || "Sin descripción"}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  Cap. {doc.orden || idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. CUERPO PRINCIPAL DE LAS GUÍAS ── */}
      {docs.map((doc, docIndex) => (
        <article
          key={`${doc.seccionKey}-${doc.fileName}-${docIndex}`}
          className="p-8 page-break"
        >
          {/* Encabezado del Capítulo */}
          <header className="mb-6 pb-4 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-800 uppercase tracking-wider">
                AguaVP • {doc.seccionTitulo}
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-600">Guía #{doc.orden || docIndex + 1}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{doc.fileName}</span>
          </header>

          {/* Contenido Markdown Renderizado */}
          <div className="prose prose-slate max-w-none
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
            prose-h1:text-2xl prose-h1:font-black prose-h1:pb-3 prose-h1:border-b prose-h1:border-slate-200 prose-h1:mb-6
            prose-h2:text-xl prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-lg prose-h3:font-bold prose-h3:mt-5 prose-h3:mb-2
            prose-p:text-sm prose-p:leading-relaxed prose-p:text-slate-700
            prose-li:text-sm prose-li:text-slate-700
            prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-slate-800 prose-code:text-xs prose-code:font-mono
            prose-table:w-full prose-table:text-xs prose-table:border-collapse
            prose-th:bg-slate-100 prose-th:p-2.5 prose-th:border prose-th:border-slate-300 prose-th:font-bold prose-th:text-slate-800
            prose-td:p-2.5 prose-td:border prose-td:border-slate-200 prose-td:text-slate-700
          ">
            <MarkdownRenderer content={doc.content} />
          </div>

          {/* Pie de Página del Documento */}
          <footer className="mt-10 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span>Sistema Integral de Agua Potable AguaVP</span>
            <span>{doc.seccionTitulo} • {doc.titulo}</span>
          </footer>
        </article>
      ))}

    </div>
  );
};

export default ReporteDocumentacion;
