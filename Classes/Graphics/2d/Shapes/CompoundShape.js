/*
    A simple 2d rectangle shape
    Author: Tar van Krieken
    Starting Date: 28/04/2018
*/
class CompoundShape2d extends Shape2d{
    constructor(graphics, preInit){
        super(graphics, null, preInit);
        this.shapes = [];
        
        //forward location change to children (world location)
        var This = this;
        this.getLoc().onChange(function(){
            for(var i=0; i<This.shapes.length; i++)
                This.shapes[i].getLoc().__fireEvent();
        });
    }
    __createGfx(){
        return new PIXI.Sprite();
    }
    
    //updating shapes
    addShape(shape){
        for(var i=0; i<arguments.length; i++){
            var shape = arguments[i];
            this.shapes.push(shape);
            shape.__setParentShape(this);
        }
        this.__redraw();
        return this;
    }
    removeShape(shape){
        for(var i=0; i<arguments.length; i++){
            var shape = arguments[i];
            var index = this.shapes.indexOf(shape);
            if(index!=-1){
                this.shapes.splice(index, 1);
                shape.__setParentShape(null);
            }
        }
        this.__redraw();
        return this;
    }
    
    //redraw shapes
    __redraw(){
        var aabb = {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity,
        };
        var ix, ax, iy, ay;
        for(var i=0; i<this.shapes.length; i++){
            var shape = this.shapes[i];
            if((ax=shape.__getMaxX())>aabb.maxX) aabb.maxX=ax;
            if((ix=shape.__getMinX())<aabb.minX) aabb.minX=ix;
            if((ay=shape.__getMaxY())>aabb.maxY) aabb.maxY=ay;
            if((iy=shape.__getMinY())<aabb.minY) aabb.minY=iy;
        }
        
        var rt = PIXI.RenderTexture.create(aabb.maxX-aabb.minX, aabb.maxY-aabb.minY);
        for(var i=0; i<this.shapes.length; i++){
            var shape = this.shapes[i];
            
            shape.gfx.x -= aabb.minX;
            shape.gfx.y -= aabb.minY;
            this.graphics.__getRenderer().render(shape.gfx, rt, false);
            shape.gfx.x += aabb.minX;
            shape.gfx.y += aabb.minY;
        }
        
        this.gfx.setTexture(rt);
        
        //update width and height
        this.size = {
            width: Math.max(-aabb.minX, aabb.maxX)*2,
            height: Math.max(-aabb.minY, aabb.maxY)*2
        }
        this.gfx.pivot.x = -aabb.minX;
        this.gfx.pivot.y = -aabb.minY;
    }
    __getRadius(){
        var x = this.size.width/2;
        var y = this.size.height/2;
        return Math.sqrt(x*x + y*y)*this.getScale();
    }
}