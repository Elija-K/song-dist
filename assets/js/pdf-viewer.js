// Minimal PDF viewer using PDF.js (loaded from CDN) with simple toolbar
(function(window){
  var pdfjsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
  var pdfWorkerUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  var state = {};

  function loadScript(src){
    return new Promise(function(resolve, reject){
      if (document.querySelector('script[data-pdfjs]')) return resolve();
      var s = document.createElement('script');
      s.src = src;
      s.setAttribute('data-pdfjs','1');
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function applyColors(container){
    var bodyStyle = getComputedStyle(document.body);
    var bg = bodyStyle.backgroundColor || '#fff';
    var btnBg = getComputedStyle(document.documentElement).getPropertyValue('--bs-btn-bg') || bodyStyle.color;
    container.style.background = bg;
    var toolbar = container.querySelector('.pdf-toolbar');
    if (toolbar) toolbar.style.background = btnBg.trim() || '#ad3030';
  }

  function createViewer(containerId){
    var container = document.getElementById(containerId);
    if (!container) return null;
    container.innerHTML = '\n      <div class="pdf-toolbar" style="padding:8px;display:flex;gap:8px;align-items:center;">
        <button class="btn-prev btn btn-sm btn-light">Prev</button>
        <button class="btn-next btn btn-sm btn-light">Next</button>
        <span class="page-info" style="margin-left:8px"></span>
        <div style="flex:1"></div>
        <button class="btn-zoom-in btn btn-sm btn-light">+</button>
        <button class="btn-zoom-out btn btn-sm btn-light">-</button>
      </div>
      <div class="pdf-canvas-wrap" style="padding:8px;text-align:center;"><canvas></canvas></div>';
    applyColors(container);
    return container;
  }

  function renderPage(pdf, num, scale, canvas){
    return pdf.getPage(num).then(function(page){
      var viewport = page.getViewport({scale: scale});
      var ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      return page.render({canvasContext: ctx, viewport: viewport}).promise;
    });
  }

  function load(url, containerId){
    return loadScript(pdfjsUrl).then(function(){
      if (!window['pdfjsLib']) throw new Error('pdfjsLib not available');
      window['pdfjsLib'].GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      var container = createViewer(containerId);
      if (!container) throw new Error('container not found');
      var canvas = container.querySelector('canvas');
      var pageInfo = container.querySelector('.page-info');
      var scale = 1.2;
      return window['pdfjsLib'].getDocument(url).promise.then(function(pdf){
        state.pdf = pdf; state.page = 1; state.scale = scale; state.canvas = canvas; state.container = container;
        return renderPage(pdf, state.page, state.scale, canvas).then(function(){
          pageInfo.textContent = state.page + ' / ' + pdf.numPages;
        });
      }).then(function(){
        // hook up controls
        container.querySelector('.btn-prev').onclick = function(){ if (state.page>1) { state.page--; renderPage(state.pdf, state.page, state.scale, state.canvas).then(()=> state.container.querySelector('.page-info').textContent = state.page + ' / ' + state.pdf.numPages); }};
        container.querySelector('.btn-next').onclick = function(){ if (state.page<state.pdf.numPages) { state.page++; renderPage(state.pdf, state.page, state.scale, state.canvas).then(()=> state.container.querySelector('.page-info').textContent = state.page + ' / ' + state.pdf.numPages); }};
        container.querySelector('.btn-zoom-in').onclick = function(){ state.scale = Math.min(3, state.scale + 0.2); renderPage(state.pdf, state.page, state.scale, state.canvas); };
        container.querySelector('.btn-zoom-out').onclick = function(){ state.scale = Math.max(0.5, state.scale - 0.2); renderPage(state.pdf, state.page, state.scale, state.canvas); };
      });
    });
  }

  window.PDFViewer = { load: load };
})(window);
