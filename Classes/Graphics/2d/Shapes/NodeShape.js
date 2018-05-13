/*
    A node shape that manages sub shapes
    Author: Tar van Krieken
    Starting Date: 30/04/2018
*/
class NodeShape2d extends ShapeGroup2d{
    constructor(graphics, node, preInit){ //attributes will just be stored in the object
        super(graphics, preInit);
        this.node = node;
        
        this.connectionHasBeenSetup = false; //track if an initial connection has ever been made
        
        //keep track of some tree related properties to decide how to grow and shrink the visualisation
        this.parent = null;
        this.children = [];
        this.__init();      //seperate method in order to allow for it to be overwritten
        
        //save state data
        this.state = {
            hover: false,
            expanded: this.node.getChildren().length==0,
            selected: false,
            focused: false,
            dragged: false,
        };
        this.__changeState(); //update state
    }
    getNode(){
        return this.node;
    }
    
    //rendering related methods
    __setupConnection(parent, child, first){}   //method to be extended to connect to parent graphically
    __stateChanged(field, val, oldState){}      //method to be extended to update the visuals to represent the state
    
    __changeState(field, value){
        var oldState = Object.assign({}, this.state);
        this.state[field] = value;
        var changed = oldState[field]!=this.state[field];
        this.__stateChanged(changed?field:null, changed?value:null, oldState);
        return this;
    }
    
    //to be used when creating child or parent instances
    __getClass(node){
        //attempt to get from graphics
        var getFromGFX = this.graphics.__getNodeShapeClass;
        if(getFromGFX) return getFromGFX.call(this.graphics, Visualisation2d.classes, node);
        
        //otherwise return this class
        return this.__proto__.constructor;
    }
    
    __init(){  //initialise node connection
        var UID = this.graphics.getUID();
        var prevShape = this.node.getShape(UID);
        
        if(prevShape==this) return; //this shape has already been set up
        
        if(prevShape!=null){ // it shouldn't occur that 1 node gets created twice
            console.warn("A shape in the tree got overwritten", prevShape);
            prevShape.remove();
        }
        
        this.node.addShape(UID, this);
    }
    
    //relation maintenance
    add(){
        var ret = super.add();
        
        //register shape as root and leave, as no parent or children are set up yet
        this.graphics.__registerShapeLeave(this);
        this.graphics.__registerShapeRoot(this);
        if(this.__getChildNodes().length!=this.children.length)
            this.graphics.__registerShapeCollapsed(this);
        
        //connect the parent and child nodes
        var parent = this.__getParentFromNode();
        if(parent) this.__setParent(parent);
        
        var children = this.__getChildrenFromNode();
        for(var i=0; i<children.length; i++)
            this.__addChild(children[i]);
            
        //setup connection
        if(!this.__setupConnection(this.getParent(), this.getChildren()[0], !this.connectionHasBeenSetup))   //with argument true the first time
            this.connectionHasBeenSetup = true;
            
        //update visuals for the state
        this.__stateChanged(null, null, this.state);
        return ret;
    }
    remove(fully){
        //collapse the parent as not all its child nodes are shown anymore
        parent = this.getParent();
        if(parent) parent.__removeChild(this);
        
        //remove fron children
        for(var i=0; i<this.children.length; i++)
            this.children[i].__setParent(null);
            
        //clean up own relations
        this.__setParent(null);
        this.children = [];
        
        return super.remove(fully);
    }
    __delete(){
        //test: keep the node around, but don't render it
        // //if the shape is deleted from the visualisation, disconnect it from the tree
        // if(this.graphics && this.node)
        //     this.node.removeShape(this.graphics.getUID());
            
        
            
        //indicate that this shape is no longer anything in tree
        this.graphics.__deregisterShapeRoot(this);  
        this.graphics.__deregisterShapeCollapsed(this);
        this.graphics.__deregisterShapeLeave(this);
        return super.__delete();
    }
    
    //relation methods
    __setParent(parentShape){
        if(this.parent!=parentShape){
            this.parent = parentShape;
            if(parentShape){
                parentShape.__addChild(this);   //will only be added if it wasn't already
                this.graphics.__deregisterShapeRoot(this);  //indicate that this shape is no longer a root
            }else{
                this.graphics.__registerShapeRoot(this);    //indicate that this shape is now a root
            }
        }
        return this;
    }
    __addChild(childShape){
        var index = this.children.indexOf(childShape);
        if(index==-1){
            this.children.push(childShape);
            childShape.__setParent(this);   //will only be set if it wasn't already
            if(this.children.length==1)
                this.graphics.__deregisterShapeLeave(this);    //indicate that this shape is no longer a leave
            if(this.__getChildNodes().length==this.children.length){
                this.graphics.__deregisterShapeCollapsed(this); //indicate that there is nothing left to expand
                this.__changeState("expanded", true);
            }
        } 
        return this;
    }
    __removeChild(childShape){
        var index = this.children.indexOf(childShape);
        if(index!=-1){
            if(this.__getChildNodes().length==this.children.length)
                this.graphics.__registerShapeCollapsed(this);//indicate that there is something left to expand
                
            this.children.splice(index, 1);
            if(this.children.length==0)
                this.graphics.__registerShapeLeave(this);    //indicate that this shape is now a leave
            this.__changeState("expanded", false);
        }
        return this;
    }
    
    getParent(){
        return this.parent;
    }
    isParent(shape){
        return this.parent==shape;
    }
    isRoot(){
        return !this.parent;
    }
    isLeave(){
        return this.children.length==0;
    }
    getChildren(){
        return this.children;
    }
    isChild(shape){
        return this.children.indexOf(shape)!=-1;
    }
    getAncestors(depth){
        if(depth==null) depth=Infinity;
        if(depth<=0) return [];
        
        var ret = [];
        var p = this.getParent();
        if(p){
            ret.push(p);
            ret.push.apply(p, p.getAncestors(depth-1));
        }
        return ret;
    }
    getAncestorsTo(shape){
        var ret = [];
        var p = this.getParent();
        if(p && p!=shape){
            ret.push(p);
            ret.push.apply(p, p.getAncestors(depth-1));
        }
        return ret;
    }
    getDescendants(depth){
        if(depth==null) depth=Infinity;
        if(depth<=0) return [];
        
        var ret = [];
        var children = this.getChildren();
        ret.push.apply(ret, children);
        for(var i=0; i<children.length; i++){
            var child = children[i];
            ret.push.apply(ret, child.getDescendants(depth-1));
        }
        return ret;
    }
    getConnectedNodeShape(){
        var parent = this.getParent();
        if(parent) return parent;
        return this.getChildren()[0];
    }
    
    __getParentFromNode(){  //get parent node through the tree, as it might not have been connected yet
        var parentNode = this.__getParentNode();
        if(parentNode){
            var shape = parentNode.getShape(this.graphics.getUID());
            return shape.getIsRendered()?shape:undefined;
        }
    }
    __getChildrenFromNode(){//get child nodes through the tree, as they might not have been connected yet
        var UID = this.graphics.getUID();
        var children = [];
        var nodeChildren = this.__getChildNodes();
        if(nodeChildren){
            for(var i=0; i<nodeChildren.length; i++){
                var shape = nodeChildren[i].getShape(UID);
                if(shape && shape.getIsRendered())
                    children.push(shape);
            }
        }
        return children;
    }
    
    //tree node retrieval methods (instead of shapes)
    __getMissingChildNodes(){
        var UID = this.graphics.getUID();
        var children = [];
        var nodeChildren = this.__getChildNodes();
        if(nodeChildren){
            for(var i=0; i<nodeChildren.length; i++){
                var shape = nodeChildren[i].getShape(UID);
                if(!shape || !shape.getIsRendered())
                    children.push(nodeChildren[i]);
            }
        }
        return children;
    }
    __getChildNodes(){
        return this.node.getChildren();
    }
    __getParentNode(){
        return this.node.getParent();
    }
    
    //tree statistics methods
    getDepth(){
        return this.node.getDepth();
    }
    getIndex(){
        return this.__getParentNode()?this.__getParentNode().getChildren().indexOf(this.node):0;
    }
    
    //methods for creating parent/children nodes
    __createNodeShape(node){
        return new (this.__getClass(node))(this.getGraphics(), node);
    }
    createParent(){
        if(!this.getParent()){ //make sure there isn't already a parent shape
            var UID = this.graphics.getUID();
            var parentNode = this.__getParentNode();
            if(parentNode){
                var shape = parentNode.getShape(UID);
                if(!shape)
                    shape = this.__createNodeShape(parentNode);
                return shape.add();
            }
        }
    }
    createAncestors(depth){
        //depth indicates how many layers to create
        if(depth==null) depth = 1;
        
        var ret = [];
        if(depth>=1){
            var p = this.createParent();
            if(p) ret.push(p);  //only add p if it waas just created
            
            var p = this.getParent();
            if(p) ret.push.apply(ret, p.createAncestors(depth-1)); //recurse
        }
        return ret;
    }
    destroyParent(){
        var parent = this.getParent();
        if(parent){
            return parent.remove();
        }
    }
    destroyAncestors(depth, fully){
        //depth indicates how many layers to keep
        //fully indicates whether to also destroy descendants
        if(depth==null) depth = 0;
        
        var ret = [];
        var parent = this.getParent();
        if(parent){
            if(fully)
                ret.push.apply(ret, parent.destroyDescendants(0, [this])); //don't destroy this decendant
            ret.push.apply(ret, parent.destroyAncestors(depth-1, fully));
            if(depth<=0)
                ret.push(parent.remove());
        }
        return ret;
    }
    createChild(){
        var UID = this.graphics.getUID();
        var graphics = this.getGraphics();
        var missingChildNodes = this.__getMissingChildNodes();
        
        var node = missingChildNodes[0];
        if(node){
            var shape = node.getShape(UID);
            if(!shape)
                shape = this.__createNodeShape(node);
            return shape.add();
        }
    }
    createChildren(){
        var UID = this.graphics.getUID();
        var graphics = this.getGraphics();
        var missingChildNodes = this.__getMissingChildNodes();
        
        var ret = [];
        for(var i=0; i<missingChildNodes.length; i++){
            var node = missingChildNodes[i];
            var shape = node.getShape(UID);
            if(!shape)
                shape = this.__createNodeShape(node);
            ret.push(shape.add());
        }
        return ret;
    }
    createDescendants(depth){
        //depth indicates how many layers to create
        if(depth==null) depth = 1;
        
        var ret = [];
        if(depth>=1){
            ret.push.apply(ret, this.createChildren());
            
            var children = this.getChildren();
            for(var i=0; i<children.length; i++){
                var child = children[i];
                ret.push.apply(ret, child.createDescendants(depth-1));
            }
        }
        return ret;
    }
    destroyChildren(keep){
        //keep is a list of shapes you don't want to destroy
        var children = this.getChildren();
        for(var i=children.length-1; i>=0; i--){
            var child = children[i];
            if(!keep || keep.indexOf(child)==-1)
                child.remove();
        }
        return children;
    }
    destroyDescendants(depth, keep){
        //depth indicates how many layers to keep
        //keep is a list of shapes you don't want to destroy
        if(depth==null) depth = 0;
        
        var ret = [];
        var children = this.getChildren();
        for(var i=0; i<children.length; i++){
            var child = children[i];
            if(!keep || keep.indexOf(child)==-1)
                ret.push.apply(ret, child.destroyDescendants(depth-1, keep));
        }
        
        if(depth<=0)
            ret.push.apply(ret, this.destroyChildren(keep));
        return ret;
    }
    
    //methods for changing the state
    forwardToVisualisations(func){
        this.getNode().forwardToShapes(func, this);
        return this;
    }
    select(forwarded){
        if(!this.state.selected){
            this.graphics.selectShape(this);
            if(!forwarded)
                this.forwardToVisualisations(function(){
                    this.select(true);
                });
        }
    }
    deselect(forwarded){
        if(this.state.selected){
            this.graphics.selectShape(null);
            if(!forwarded)
                this.forwardToVisualisations(function(){
                    this.deselect(true);
                });
        }
    }
    focus(forwarded){
        if(!this.state.focused){
            this.graphics.focusShape(this);
            if(!forwarded)
                this.forwardToVisualisations(function(){
                    this.focus(true);
                });
        }
    }
    defocus(forwarded){
        if(this.state.focused){
            this.graphics.focusShape(null);
            if(!forwarded)
                this.forwardToVisualisations(function(){
                    this.defocus(true);
                });
        }
    }
}