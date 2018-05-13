/*
    Generalized shape abstract class
    Author: Tar van Krieken
    Starting Date: 28/04/2018
*/
class AbstractShape{
    constructor(graphics, preInit){
        //setup stuff before init
        this.storeInSpatialTree = false;
        if(preInit)
            preInit.call(this);
            
        //set fields
        this.graphics = graphics; 
        
        this.transform = {
            loc: new XYZ(0, 0, 0), 
            rot: new XYZ(0, 0, 0), 
            scale: 1
        };
        this.velo = {
            loc: new Vec(0, 0, 0),
            rot: new Vec(0, 0, 0),
            scale: 0
        };
        this.speedFactor = 1;                                           //a constant to multiply the velo with
        this.aabb = {minX:0, maxX:0, minY:0, maxY:0, minZ:0, maxZ:0};   //loose bounding box
        this.color = 0;                                                 //int color
        this.isRendered = false;                                        //whether or not the shape is being rendered
        
        //interaction listeners
        this.listeners = {
            hover: [],
            click: [],
            mouse: [],
            update: []
        };
        
        //target
        this.target = {
            loc: null,
            rot: null,
            scale: null,
            friction: {
                loc: 0.8,
                rot: 0.8,
                scale: 0.7
            },
            speed: {
                loc: 1,
                rot: 1,
                scale: 2,
            },
            callback: {
                loc: null,
                rot: null,
                scale: null
            }
        };
        
        //whether updates and interactions are disabled
        this.updatesDisabled = false;
        this.interactionsDisabled = false;
        
        //add listener to loc changes in order to update aabb
        var This = this;
        this.transform.loc.onChange(function(){
            This.__updateAABB();
        });
        
        //velo listeners
        this.velo.loc.onChange(function(){
             This.__updateUpdates();
        });
        
        //update AABB
        this.__updateAABB();
    }
    
    //build in listeners                         
    __onDrag(location){} //method to be overwritten for custom dragging
    __registerUpdateListener(){
        return this.onUpdate(this.__onUpdate);
    }
    __deregisterUpdateListener(){
        return this.offUpdate(this.__onUpdate);
    }
    __onUpdate(deltaTime){ //method to be extended to be called every 'tick'
        //apply velocities
        var velo = this.getVelo();
        if(velo.isNonZero(this.getScale()))
            this.getLoc().add(new Vec(velo).mul(deltaTime*this.speedFactor));
        var velo = this.getRotVelo();
        if(velo.isNonZero())
            this.getRot().add(new Vec(velo).mul(deltaTime*this.speedFactor));
        var velo = this.getScaleVelo();
        if(Math.abs(velo)>1e-3*this.getScale())
            this.setScale(this.getScale() + velo*deltaTime*this.speedFactor );
            
            
        //targetting methods
        if(this.target.loc){
            var delta = this.getVecTo((this.target.loc) instanceof Function?
                                            this.target.loc.call(this):
                                            this.target.loc);
            var velo = this.getVelo().mul(this.target.friction.loc).add(delta.mul(this.target.speed.loc));
            if(delta.getLength()<1*this.getScale() && velo.getLength()<150*this.getScale() && this.target.callback.loc){
                this.target.callback.loc.call(this);
                this.target.callback.loc = null;
            }
        }
        if(this.target.rot){
            var delta = this.getRot().getVecTo((this.target.rot) instanceof Function?
                                            this.target.rot.call(this):
                                            this.target.rot);
            var velo = this.getRotVelo().mul(this.target.friction.rot).add(delta.mul(this.target.speed.rot));
            if(delta.getLength()<0.1 && velo.getLength()<0.1 && this.target.callback.rot){
                this.target.callback.rot.call(this);
                this.target.callback.rot = null;
            }
        }
        if(this.target.scale){
            var delta = ((this.target.scale) instanceof Function?
                            this.target.scale.call(this):
                            this.target.scale)
                        -this.getScale();
            this.setScaleVelo(this.getScaleVelo()*this.target.friction.scale + delta*this.target.speed.scale);
            if(delta<0.01*this.getScale() && Math.abs(this.getScaleVelo())<0.05*this.getScale() && this.target.callback.scale){
                this.target.callback.scale.call(this);
                this.target.callback.scale = null;
            }
        }
    
        return this;
    }
    
    //position
    setX(x){
        this.transform.loc.setX(x);
        return this;
    }
    getX(){
        return this.transform.loc.getX();
    }
    setY(y){
        this.transform.loc.setY(y);
        return this;
    }
    getY(){
        return this.transform.loc.getY();
    }
    setZ(z){
        this.transform.loc.setZ(z);
        return this;
    }
    getZ(){
        return this.transform.loc.getZ();
    }
    setLoc(x, y, z){
        this.transform.loc.set(x, y, z);
        return this;
    }
    getLoc(){
        return this.transform.loc;
    }
    
    //absolute position
    getAbsoluteX(){}
    getAbsoluteY(){}
    getAbsoluteZ(){}
    
    //rotation
    setXRot(x){
        this.transform.rot.setX(x);
        return this;
    }
    getXRot(){
        return this.transform.rot.getX();
    }
    setYRot(y){
        this.transform.rot.setY(y);
        return this;
    }
    getYRot(){
        return this.transform.rot.getY();
    }
    setZRot(z){
        this.transform.rot.setZ(z);
        return this;
    }
    getZRot(){
        return this.transform.rot.getZ();
    }
    setRot(x, y, z){
        this.transform.rot.set(x, y, z);
        return this;
    }
    getRot(){
        return this.transform.rot;
    }
    
    //scale
    getScale(){
        return this.transform.scale;
    }
    setScale(scale){
        this.transform.scale = scale;
        this.__updateAABB();
        return this;
    }
    
    
    //velocity
    getVelo(){
        return this.velo.loc;
    }
    getRotVelo(){
        return this.velo.rot;
    }
    getScaleVelo(){
        return this.velo.scale;
    }
    setScaleVelo(scaleVelo){
        this.velo.scale = scaleVelo;
        return this;
    }
    
    //targetting
    setTargetLoc(loc, friction, speed, onReach){
        if(typeof(friction)=="function"){
            onReach = friction;
            friction = null;
        }else if(typeof(speed)=="function"){
            onReach = speed;
            speed = null;
        }
        this.getVelo().setLength(0);
        
        this.target.loc = loc;
        if(friction!=null)
            this.target.friction.loc = friction;
        if(speed)
            this.target.speed.loc = speed;
        if(onReach)
            this.target.callback.loc = onReach;
        return this;
    }
    setTargetRot(rot, friction, speed, onReach){
        if(typeof(friction)=="function"){
            onReach = friction;
            friction = null;
        }else if(typeof(speed)=="function"){
            onReach = speed;
            speed = null;
        }
        
        this.target.rot = rot;
        if(friction!=null)
            this.target.friction.rot = friction;
        if(speed)
            this.target.speed.rot = speed;
        if(onReach)
            this.target.callback.rot = onReach;
        return this;
    }
    setTargetScale(scale, friction, speed, onReach){
        if(typeof(friction)=="function"){
            onReach = friction;
            friction = null;
        }else if(typeof(speed)=="function"){
            onReach = speed;
            speed = null;
        }
        
        this.target.scale = scale;
        if(friction!=null)
            this.target.friction.scale = friction;
        if(speed)
            this.target.speed.scale = speed;
        if(onReach)
            this.target.callback.scale = onReach;
        return this;
    }
    
    //color
    setColor(color){
        this.color = color;
        return this;
    }
    getColor(){
        return this.color;
    }
    
    //event handlers
    //hover
    onHover(listener){
        if(this.listeners.hover.indexOf(listener)==-1)
            this.listeners.hover.push(listener);
        this.__updateInteraction();
        return this;
    }
    offHover(listener){
        var index = this.listeners.hover.indexOf(listener);
        if(index!=-1) this.listeners.hover.splice(index, 1);
        this.__updateInteraction();
        return this;
    }
    __triggerHover(){
        var ret = false;
        for(var i=0; i<this.listeners.hover.length; i++)
            if(this.listeners.hover[i].apply(this, arguments))
                ret = true;
        return ret;
    }
    
    //click
    onClick(listener){
        if(this.listeners.click.indexOf(listener)==-1)
            this.listeners.click.push(listener);
        this.__updateInteraction();
        return this;
    }
    offClick(listener){
        var index = this.listeners.click.indexOf(listener);
        if(index!=-1) this.listeners.click.splice(index, 1);
        this.__updateInteraction();
        return this;
    }
    __triggerClick(){
        var ret = false;
        for(var i=0; i<this.listeners.click.length; i++)
            if(this.listeners.click[i].apply(this, arguments))
                ret = true;
        return ret;
    }
    
    //mouse events
    /*
        Types:
        -down
        -up
        -move
    */
    onMouseEvent(listener){
        if(this.listeners.mouse.indexOf(listener)==-1)
            this.listeners.mouse.push(listener);
        this.__updateInteraction();
        return this;
    }
    offMouseEvent(listener){
        var index = this.listeners.mouse.indexOf(listener);
        if(index!=-1) this.listeners.mouse.splice(index, 1);
        this.__updateInteraction();
        return this;
    }
    __triggerMouseEvent(){
        var ret = false;
        for(var i=0; i<this.listeners.mouse.length; i++)
            if(this.listeners.mouse[i].apply(this, arguments))
                ret = true;
        return ret;
    }
    
    //enable/disable interaction
    __updateInteraction(internally){
        if(!this.interactionDisabled)
            if(this.listeners.click.length==0 && this.listeners.hover.length==0 && this.listeners.mouse.length==0)
                this.disableInteraction(true);
            else
                this.enableInteraction(true);
    }
    enableInteraction(internally){
        if(!internally) this.interactionsDisabled = false;
    }
    disableInteraction(internally){
        if(!internally) this.interactionsDisabled = true;
    }
    
    
    //update
    onUpdate(listener){
        if(this.listeners.update.indexOf(listener)==-1)
            this.listeners.update.push(listener);
        this.__updateUpdates();
        return this;
    }
    offUpdate(listener){
        var index = this.listeners.update.indexOf(listener);
        if(index!=-1)
            this.listeners.update.splice(index, 1);
        this.__updateUpdates();
        return this;
    }
    __triggerUpdate(){
        for(var i=0; i<this.listeners.update.length; i++)
            this.listeners.update[i].apply(this, arguments);
        return this;
    }
    
    //enable/disable updates
    __updateUpdates(){
        if(!this.updatesDisabled)
            if(this.listeners.update.length==0)
                this.disableUpdates(true);
            else
                this.enableUpdates(true);
    }
    enableUpdates(internally){
        if(!internally) this.updatesDisabled = false;
        this.graphics.activateShape(this);
        return this;
    }
    disableUpdates(internally){
        if(!internally) this.updatesDisabled = true;
        this.graphics.deactivateShape(this);
        return this;
    }
    
    //parent shape
    __setParentShape(parent){
        this.parentShape = parent;
        return this;
    }
    getParentShape(){
        return this.parentShape;
    }
    getWorldLoc(){
        return this.getLoc();
    }
    
    //add or remove from graphics
    getGraphics(){
        return this.graphics;
    }
    add(){
        this.graphics.__registerShape(this);
        this.__updateUpdates();
        
        var tree = this.__getTree();
        if(tree && this.storeInSpatialTree)
            tree.insert(this);
            
        this.isRendered = true;
        return this;
    }
    remove(dontDelete){
        this.graphics.__deregisterShape(this);  //indicate that the node is being removed
        if(dontDelete) return this;
        return this.__delete();                 //fully remove it without an animation
    }
    __delete(){
        this.graphics.__deregisterShape(this, true); //remove the node entirely
        this.disableUpdates(true);
        
        var tree = this.__getTree();
        if(tree && this.storeInSpatialTree)
            tree.remove(this);
            
        this.isRendered = false;
        return this;
    }
    getIsRendered(){
        return this.isRendered;
    }
    
    //physics methods
    getVecTo(x, y, z){
        if(x instanceof AbstractShape)
            x = x.getLoc();
        return new Vec(x, y, z).sub(this.getLoc());
    }
    
    //spatial tree methods
    __getRadius(){
        return 0;
    }
    __getRadiusPadding(){
        return this.__getRadius()/2;
    }
    __getTree(){
        return this.graphics.getSpatialTree();
    }
    __updateAABB(){
        if(this.storeInSpatialTree){
            var minRad = this.__getRadius();
            var loc = this.getWorldLoc();
            //check whether the shape moved outside of the loose bounding box
            if( this.aabb.minX > loc.getX()-minRad||
                this.aabb.minY > loc.getY()-minRad||
                this.aabb.minZ > loc.getZ()-minRad||
                this.aabb.maxX < loc.getX()+minRad||
                this.aabb.maxY < loc.getY()+minRad||
                this.aabb.maxZ < loc.getZ()+minRad){
                    
                //remove data from the tree
                var tree = this.__getTree();
                if(tree) tree.remove(this);
                
                //update the bounding box
                var maxRad = this.__getRadius()+this.__getRadiusPadding();
                this.aabb = {
                    minX: loc.getX() - maxRad,
                    minY: loc.getY() - maxRad,
                    minZ: loc.getZ() - maxRad,
                    maxX: loc.getX() + maxRad,
                    maxY: loc.getY() + maxRad,
                    maxZ: loc.getZ() + maxRad,
                };
                
                //reinsert the data into the tree
                if(tree) tree.insert(this);
            }
        }
        return this;
    }
    search(radius, filter){
        var tree = this.__getTree();
        if(tree){
            //search the tree
            var loc = this.getWorldLoc();
            var results = tree.search({
                minX: loc.getX() - radius,
                minY: loc.getY() - radius,
                minZ: loc.getZ() - radius,
                maxX: loc.getX() + radius,
                maxY: loc.getY() + radius,
                maxZ: loc.getZ() + radius,
            });
            
            var This = this;
            if(filter) //apply the filter and make sure to not include 'this'
                return results.filter(function(val){
                    return val!=This && filter.call(val, val);
                });
                
            //only filter such that 'this' isn't returned
            return results.filter(function(val){ return val!=This; });
        }
        return [];
    }
}