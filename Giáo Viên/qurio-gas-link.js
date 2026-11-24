document.getElementById('qurioOpenGas')?.addEventListener(
    'click',()=>{const url=window.QURIO_TEACHER_GAS_URL;if(!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(url||'')){alert('Hãy dán URL Web App /exec vào qurio-gas-config.js trước nhé.');return;}window.open(url,'_blank','noopener,noreferrer');});
