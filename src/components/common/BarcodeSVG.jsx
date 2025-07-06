import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

function BarcodeSVG({ sku }) {
  const svgRef = useRef(null);
  
  useEffect(() => {
    if (svgRef.current && sku) {
      JsBarcode(svgRef.current, sku, { 
        format: 'CODE128', 
        width: 2, 
        height: 40, 
        displayValue: false 
      });
    }
  }, [sku]);
  
  return <svg ref={svgRef}></svg>;
}

export default BarcodeSVG; 