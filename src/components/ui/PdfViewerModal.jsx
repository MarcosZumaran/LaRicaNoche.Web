import { useState } from 'react';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';

export default function PdfViewerModal({ pdfUrl, onClose }) {
    const [descargando, setDescargando] = useState(false);

    if (!pdfUrl) return null;

    const handleDownload = async () => {
        setDescargando(true);
        try {
            const response = await fetch(pdfUrl);
            if (!response.ok) throw new Error('Error al descargar');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'comprobante.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar PDF:', error);
        } finally {
            setDescargando(false);
        }
    };

    const handlePrint = async () => {
        try {
            const response = await fetch(pdfUrl);
            if (!response.ok) throw new Error('Error al cargar el PDF');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
                newWindow.onload = () => {
                    newWindow.print();
                };
            } else {
                console.warn('El navegador bloqueó la ventana emergente. Permita las ventanas emergentes para imprimir.');
            }
            // Limpieza diferida
            setTimeout(() => window.URL.revokeObjectURL(url), 5000);
        } catch (error) {
            console.error('Error al imprimir PDF:', error);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box w-full max-w-4xl h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Vista previa del comprobante</h3>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={handleDownload}
                            disabled={descargando}
                        >
                            {descargando ? 'Descargando...' : 'Descargar'}
                        </button>
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={handlePrint}
                        >
                            Imprimir
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                        <Viewer fileUrl={pdfUrl} />
                    </Worker>
                </div>
            </div>
        </div>
    );
}