// Paste this into browser console to debug chart visibility

console.log('🔍 Chart Visibility Debug');
console.log('========================\n');

// Find chart container
const chartContainer = document.querySelector('[class*="h-[500px]"]');
console.log('1. Chart container found:', !!chartContainer);

if (chartContainer) {
  console.log('   - Dimensions:', {
    width: chartContainer.clientWidth,
    height: chartContainer.clientHeight,
    offsetWidth: chartContainer.offsetWidth,
    offsetHeight: chartContainer.offsetHeight,
  });

  const computed = window.getComputedStyle(chartContainer);
  console.log('   - CSS:', {
    display: computed.display,
    visibility: computed.visibility,
    opacity: computed.opacity,
    position: computed.position,
    overflow: computed.overflow,
  });

  console.log('   - Children:', chartContainer.children.length);

  // Highlight it
  chartContainer.style.border = '5px solid red';
  chartContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
  console.log('   ✅ Container highlighted with RED border');
}

// Find chart wrapper
const chartWrapper = document.querySelector('[class*="rounded-lg border bg-card"]');
console.log('\n2. Chart wrapper found:', !!chartWrapper);

if (chartWrapper) {
  console.log('   - Dimensions:', {
    width: chartWrapper.clientWidth,
    height: chartWrapper.clientHeight,
  });

  chartWrapper.style.border = '3px solid blue';
  console.log('   ✅ Wrapper highlighted with BLUE border');
}

// Check if lightweight-charts canvas exists
const canvas = document.querySelector('canvas');
console.log('\n3. Canvas element found:', !!canvas);

if (canvas) {
  console.log('   - Canvas dimensions:', {
    width: canvas.width,
    height: canvas.height,
    style: canvas.style.cssText,
  });

  canvas.style.border = '2px solid green';
  console.log('   ✅ Canvas highlighted with GREEN border');
}

console.log('\n4. Scroll to chart...');
if (chartContainer) {
  chartContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
  console.log('   ✅ Scrolled to chart position');
}

console.log('\n✅ Debug complete. Check the page for colored borders!');
