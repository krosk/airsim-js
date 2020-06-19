// PixiSimEngine

let PSETILE = (function ()
{
    let public = {};
    
    public.getColor = function psetile_getColor(r, g, b)
    {
        return (r | 0) * 2**16 + (g | 0) * 2**8 + (b | 0);
    }
    
    let nuanceColor = function psetile_nuanceColor(color, level)
    {
        const R = 0xff0000;
        const G = 0x00ff00;
        const B = 0x0000ff;
        let cR = color & R;
        let cG = color & G;
        let cB = color & B;
        let nR = cR + (0x010000 * level);
        nR = Math.min(nR, R);
        nR = Math.max(nR, G);
        nR = nR & R;
        let nG = cG + (0x000100 * level);
        nG = Math.min(nG, G);
        nG = Math.max(nG, B);
        nG = nG & G;
        let nB = cB + (0x000001 * level);
        nB = Math.min(nB, B);
        nB = Math.max(nB, 0);
        nB = nB & B;
        return nR + nG + nB;
    }
    
    public.drawBlock = function psetile_drawBlock(graphics, color, BWo, BHo, BW, BH, H)
    {
        //console.log(color + ' ' + nuanceColor(color, 1));
        //console.log(BW + ' ' + BH + ' ' + BWo + ' ' + BHo);
        // 0, 0 is the center of the base
        let x1 = BWo;
        let y1 = BHo - BH / 2 - H;
        
        let x2 = BWo - BW / 2;
        let y2 = BHo - H;
        
        let x3 = x2;
        let y3 = y2 + H;
        
        let x7 = x1;
        let y7 = BHo + BH / 2 - H;
        
        let x4 = x1;
        let y4 = y7 + H;
        
        let x6 = BWo + BW / 2;
        let y6 = y2;
        
        let x5 = x6;
        let y5 = y6 + H;
        
        let baseBlockLineColor = 0x000000;
        let bisBlockLineColor = 0x000000;
        let terBlockLineColor = 0x000000;
            
        // draw a rectangle
        // top
        // fill
        let fillTop = function ()
        {
            graphics.lineStyle(0, baseBlockLineColor);
            graphics.beginFill(color);
            graphics.moveTo(x1, y1 - 1);
            graphics.lineTo(x2, y2 - 1);
            graphics.lineTo(x7, y7 - 1);
            graphics.lineTo(x6, y6 - 1);
            graphics.lineTo(x1, y1 - 1);
            graphics.endFill();
        };
        
        let contourTop = function ()
        {
            // contour
            graphics.lineStyle(1, baseBlockLineColor);
            graphics.moveTo(x1, y1 - 1);
            graphics.lineTo(x2, y2 - 1);
            graphics.lineStyle(1, terBlockLineColor);
            graphics.moveTo(x2, y2 - 1);
            graphics.lineTo(x7, y7 - 1);
            graphics.lineStyle(1, bisBlockLineColor);
            graphics.moveTo(x7, y7 - 1);
            graphics.lineTo(x6, y6 - 1);
            graphics.moveTo(x6, y6 - 1);
            graphics.lineTo(x1, y1 - 1);
        };
        
        // left
        let fillLeft = function ()
        {
            graphics.lineStyle(0, baseBlockLineColor);
            graphics.beginFill(nuanceColor(color, -32));
            graphics.moveTo(x7, y7 - 1);
            graphics.lineTo(x2, y2 - 1);
            graphics.lineTo(x3, y3);
            graphics.lineTo(x4, y4);
            graphics.endFill();
        }
        
        let contourLeft = function ()
        {
            graphics.lineStyle(1, bisBlockLineColor);
            graphics.moveTo(x2 + 0.5, y2);
            graphics.lineTo(x3 + 0.5, y3);
            graphics.moveTo(x3, y3);
            graphics.lineTo(x4, y4);
            graphics.moveTo(x4 - 1, y4);
            graphics.lineTo(x7 - 1, y7);
        }
        
        // right
        let fillRight = function () 
        {
            graphics.lineStyle(0, bisBlockLineColor);
        
            graphics.beginFill(nuanceColor(color, -64));
            graphics.moveTo(x7, y7 - 1); // center
            graphics.lineTo(x6, y6 - 1); // right
            graphics.lineTo(x5, y5); // right
            graphics.lineTo(x4, y4); // bottom
            graphics.lineTo(x7, y7); // center
            graphics.endFill();
        }
        
        let contourRight = function ()
        {
            graphics.lineStyle(1, terBlockLineColor);
            graphics.moveTo(x6 - 1, y6);
            graphics.lineTo(x5 - 1, y5);
            graphics.moveTo(x5, y5);
            graphics.lineTo(x4, y4);
            graphics.moveTo(x4, y4);
            graphics.lineTo(x7, y7);
        }
        
        fillTop();
        fillLeft();
        fillRight();
        contourTop();
        contourLeft();
        contourRight();
    }
    
    public.createTexture = function astile_createTexture(color, margin, height)
    {
        let graphics = new PIXI.Graphics(false);
        
        let C_TEXTURE_BASE_SIZE_X = MMAPRENDER.getTextureBaseSizeX();
        let C_TEXTURE_BASE_SIZE_Y = MMAPRENDER.getTextureBaseSizeY();
        
        // defining a rectangle
        // is defining its base and height
        // and top left offset
    
        let M = margin;
        let H = height;
        
        let BW = C_TEXTURE_BASE_SIZE_X - M * 4;
        let BWo = 0;
        let BH = C_TEXTURE_BASE_SIZE_Y - M * 2;
        let BHo = 0;
        
        public.drawBlock(graphics, color, BWo, BHo, BW, BH, H);
        
        return graphics;
    }
    
    return public;
})();