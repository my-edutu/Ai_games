// Strictly evaluates a real screenshot, never generated concept art.
// Metrics establish a reproducible visual baseline, not a substitute for independent A/B reviewers.
export async function scoreScreenshot(page,png){
  return page.evaluate(async (base64)=>{
    const img=new Image();
    img.src='data:image/png;base64,'+base64;
    await img.decode();
    const c=document.createElement('canvas');
    c.width=160;c.height=90;
    const g=c.getContext('2d',{willReadFrequently:true});
    g.drawImage(img,0,0,c.width,c.height);
    const data=g.getImageData(0,0,c.width,c.height).data;
    const luma=[],sats=[],palette=new Set();
    let bright=0,colorful=0,dark=0;
    for(let i=0;i<data.length;i+=4){
      const r=data[i]/255,green=data[i+1]/255,b=data[i+2]/255;
      const light=.2126*r+.7152*green+.0722*b;
      const sat=Math.max(r,green,b)-Math.min(r,green,b);
      luma.push(light);sats.push(sat);
      if(light>.45)bright++;
      if(light<.14)dark++;
      if(sat>.22)colorful++;
      palette.add([r,green,b].map(n=>Math.floor(n*6)).join(':'));
    }
    luma.sort((a,b)=>a-b);sats.sort((a,b)=>a-b);
    const n=luma.length;
    return {
      medianLuminance:Number(luma[Math.floor(n*.5)].toFixed(4)),
      medianSaturation:Number(sats[Math.floor(n*.5)].toFixed(4)),
      brightFraction:Number((bright/n).toFixed(4)),
      colorfulFraction:Number((colorful/n).toFixed(4)),
      darkFraction:Number((dark/n).toFixed(4)),
      distinctQuantizedColors:palette.size,
      resolution:{width:img.width,height:img.height}
    };
  },png.toString('base64'));
}
export function compareWithVisualGoals(metrics){
  return {
    minimumReadability:metrics.medianLuminance>=.20,
    minimumSaturation:metrics.colorfulFraction>=.012,
    aspirationalPremiumReadability:metrics.medianLuminance>=.34,
    aspirationalPremiumPalette:metrics.colorfulFraction>=.18,
    visualParityWithDaysGone:'NOT ASSESSED — requires blinded visual/gameplay comparison',
  };
}
