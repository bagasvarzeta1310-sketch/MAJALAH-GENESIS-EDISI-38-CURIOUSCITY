// Konfigurasi path worker PDF.js menggunakan CDN yang sama
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

let pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    scale = 1.5, // Mengatur ketajaman kualitas render PDF
    canvas = document.getElementById('pdf-canvas'),
    ctx = canvas.getContext('2d');

const welcomeMessage = document.getElementById('welcome-message');
const navBar = document.getElementById('navigation-bar');
const prevBtn = document.getElementById('prev-page');
const nextBtn = document.getElementById('next-page');

/**
 * Merender halaman PDF terpilih ke dalam element HTML Canvas
 */
function renderPage(num) {
    pageRendering = true;
    
    pdfDoc.getPage(num).then((page) => {
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        // Tunggu proses render halaman selesai
        renderTask.promise.then(() => {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    // Perbarui teks indikator nomor halaman saat ini
    document.getElementById('page-num').textContent = num;

    // Atur status tombol navigasi aktif/tidak aktif
    prevBtn.disabled = num <= 1;
    nextBtn.disabled = num >= pdfDoc.numPages;
}

/**
 * Mengantrekan render halaman jika sistem sedang memproses halaman lain
 */
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// Tombol Halaman Sebelumnya
prevBtn.addEventListener('click', () => {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
});

// Tombol Halaman Selanjutnya
nextBtn.addEventListener('click', () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
});

/**
 * Memuat dan menginisialisasi dokumen PDF
 */
function loadPDF(pdfData) {
    pdfjsLib.getDocument(pdfData).promise.then((pdfDoc_) => {
        pdfDoc = pdfDoc_;
        document.getElementById('page-count').textContent = pdfDoc.numPages;

        // Sembunyikan pesan awal, munculkan toolbar navigasi bawah
        welcomeMessage.style.display = 'none';
        navBar.style.display = 'flex';

        // Mulai render dari halaman pertama
        pageNum = 1;
        renderPage(pageNum);
    }).catch(err => {
        alert('Gagal memproses file PDF: ' + err.message);
    });
}

/**
 * Event listener untuk membaca file PDF lokal yang diunggah pengguna
 */
document.getElementById('pdf-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            loadPDF({ data: typedarray });
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        alert('Format file tidak didukung. Harap pilih file PDF.');
    }
});

/**
 * TIPS UNTUK GITHUB PAGES:
 * Jika ingin web otomatis memuat file majalah bawaan saat dibuka (tanpa klik tombol pilih file),
 * letakkan file PDF Anda di folder proyek yang sama dengan nama "majalah.pdf", 
 * lalu hapus tanda komentar (//) pada baris kode di bawah ini:
 */

// window.addEventListener('DOMContentLoaded', () => {
//     loadPDF('majalah.pdf');
// });
