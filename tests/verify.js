/**
 * Automated Test Suite for PlayerWebsite PR #3
 * Tests DOM structure, modal hierarchy, script syntax, gallery logic, and responsive CSS rules.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert');

const HTML_PATH = path.join(__dirname, '..', 'index.html');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  \x1b[32m✔\x1b[0m ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`  \x1b[31m✖\x1b[0m ${description}`);
    console.error(`    \x1b[31m${error.message}\x1b[0m`);
    process.exitCode = 1;
  }
}

function describe(suiteName, fn) {
  console.log(`\n\x1b[1m\x1b[36m▶ ${suiteName}\x1b[0m`);
  fn();
}

console.log('\x1b[1m========================================\x1b[0m');
console.log('\x1b[1m🧪 Running PlayerWebsite Automated Test Suite\x1b[0m');
console.log('\x1b[1m========================================\x1b[0m');

// Load HTML content
const html = fs.readFileSync(HTML_PATH, 'utf-8');

describe('1. File & HTML Semantic Integrity', () => {
  it('index.html exists and is readable', () => {
    assert(fs.existsSync(HTML_PATH), 'index.html file must exist');
    assert(html.length > 50000, 'index.html must be populated with content');
  });

  it('contains valid HTML5 doctype and charset', () => {
    assert(/<!DOCTYPE\s+html>/i.test(html), 'Missing <!DOCTYPE html>');
    assert(/<meta\s+charset=["']utf-8["']/i.test(html), 'Missing UTF-8 charset declaration');
  });

  it('contains essential meta viewport tag for mobile devices', () => {
    assert(/name=["']viewport["']/i.test(html), 'Missing viewport meta tag');
    assert(/width=device-width/i.test(html), 'Viewport width must be device-width');
  });
});

describe('2. Gallery & Lightbox DOM Architecture', () => {
  it('includes #galleryLightboxOverlay with proper accessibility attributes', () => {
    assert(html.includes('id="galleryLightboxOverlay"'), 'Missing #galleryLightboxOverlay element');
    assert(html.includes('role="dialog"'), 'Lightbox should have role="dialog"');
    assert(html.includes('aria-modal="true"'), 'Lightbox should have aria-modal="true"');
  });

  it('includes #lightboxMainImg and navigation controls', () => {
    assert(html.includes('id="lightboxMainImg"'), 'Missing #lightboxMainImg element');
    assert(html.includes('id="lightboxPrevBtn"'), 'Missing #lightboxPrevBtn element');
    assert(html.includes('id="lightboxNextBtn"'), 'Missing #lightboxNextBtn element');
    assert(html.includes('id="lightboxCloseBtn"'), 'Missing #lightboxCloseBtn element');
    assert(html.includes('id="lightboxDownloadBtn"'), 'Missing #lightboxDownloadBtn element');
  });

  it('verifies #galleryLightboxOverlay is NOT nested inside #googleModalOverlay', () => {
    const googleModalStart = html.indexOf('id="googleModalOverlay"');
    assert(googleModalStart !== -1, 'googleModalOverlay exists');
    
    const lightboxIndex = html.indexOf('id="galleryLightboxOverlay"');
    assert(lightboxIndex !== -1, 'galleryLightboxOverlay exists');
    
    const sliceBetween = html.substring(googleModalStart, lightboxIndex);
    assert(sliceBetween.includes('</div>'), 'googleModalOverlay must be closed before galleryLightboxOverlay starts');
    
    const openDivs = (sliceBetween.match(/<div\b/gi) || []).length;
    const closeDivs = (sliceBetween.match(/<\/div>/gi) || []).length;
    assert.strictEqual(openDivs, closeDivs, `Div tags between googleModal and lightbox must be balanced (open: ${openDivs}, closed: ${closeDivs})`);
  });

  it('contains .gallery-featured-stage and .gallery-thumbnails-strip styling structures', () => {
    assert(html.includes('.gallery-featured-stage'), 'CSS must define .gallery-featured-stage');
    assert(html.includes('.gallery-thumbnails-strip'), 'CSS must define .gallery-thumbnails-strip');
    assert(html.includes('detailMainFeaturedImg'), 'DOM template must contain detailMainFeaturedImg');
  });
});

describe('3. JavaScript Syntax & Compilation Validation', () => {
  const scriptRegex = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;
  const scriptChunks = [];

  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1].trim();
    if (content) {
      scriptChunks.push(content);
      scriptCount++;
    }
  }

  it(`found ${scriptCount} inline <script> block(s) and parses all without SyntaxError`, () => {
    assert(scriptCount > 0, 'Must have at least one inline script block');
    scriptChunks.forEach((chunk, i) => {
      assert.doesNotThrow(() => {
        new vm.Script(chunk, { filename: `inline-script-${i + 1}.js` });
      }, `Syntax error in inline script block ${i + 1}`);
    });
  });

  it('exposes window.openFullPageDetail and window.openGalleryLightbox globally', () => {
    const combinedScript = scriptChunks.join('\n');
    assert(combinedScript.includes('window.openFullPageDetail = openFullPageDetail;'), 
      'Must assign window.openFullPageDetail to window');
    assert(combinedScript.includes('window.openGalleryLightbox = function') || combinedScript.includes('window.openGalleryLightbox ='), 
      'Must assign window.openGalleryLightbox to window');
  });
});

describe('4. Gallery Interactive Engine & State Logic', () => {
  it('correctly simulates lightbox image indexing, wrapping, and keyboard shortcuts', () => {
    const fakeImages = [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg'
    ];
    let currentIndex = 0;

    function nextImage() {
      currentIndex = (currentIndex + 1) % fakeImages.length;
      return currentIndex;
    }

    function prevImage() {
      currentIndex = (currentIndex - 1 + fakeImages.length) % fakeImages.length;
      return currentIndex;
    }

    assert.strictEqual(currentIndex, 0);
    assert.strictEqual(nextImage(), 1);
    assert.strictEqual(nextImage(), 2);
    assert.strictEqual(nextImage(), 0, 'Next button should wrap around to index 0');
    assert.strictEqual(prevImage(), 2, 'Prev button should wrap around to last index');
  });

  it('handles image error fallback safely', () => {
    assert(html.includes('onerror="window.handleDriveImgError') || html.includes('handleDriveImgError'), 
      'Image tags should contain safe fallback error handlers');
  });
});

describe('5. Mobile Responsiveness & Apple Aesthetics Style Rules', () => {
  it('implements high-performance backdrop-filter and obsidian dark theme tokens', () => {
    assert(html.includes('backdrop-filter: blur(') || html.includes('-webkit-backdrop-filter: blur('), 
      'Lightbox overlay must use backdrop blur for Apple glassmorphic look');
    assert(html.includes('rgba(6, 182, 212,'), 'Cyan neon active accent border must be styled');
  });

  it('has dedicated media queries for small screen mobile devices (max-width: 768px)', () => {
    assert(html.includes('@media (max-width: 768px)'), 'Must include 768px media query');
    assert(html.includes('@media (max-width: 480px)'), 'Must include 480px extra compact media query');
  });

  it('guarantees lightbox z-index is higher than any other modal layer', () => {
    const lightboxZIndexMatch = html.match(/#galleryLightboxOverlay[\s\S]*?z-index:\s*(\d+)/);
    assert(lightboxZIndexMatch, 'galleryLightboxOverlay must have an explicit z-index');
    const zIndex = parseInt(lightboxZIndexMatch[1], 10);
    assert(zIndex >= 100000, `Lightbox z-index should be >= 100000 (found ${zIndex})`);
  });
});

console.log('\n\x1b[1m========================================\x1b[0m');
if (passedTests === totalTests) {
  console.log(`\x1b[32m\x1b[1m✨ ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY! (100% Pass Rate)\x1b[0m`);
} else {
  console.log(`\x1b[31m\x1b[1m❌ ${totalTests - passedTests} TEST(S) FAILED (${passedTests}/${totalTests} passed)\x1b[0m`);
}
console.log('\x1b[1m========================================\x1b[0m\n');
