(function(){
    //the visualisation class that you create
    class NodeShape extends VIZ3D.NodeShape{
        //Note an extra 'scale' argument got added to the constructor, this isn't necessary
        constructor(gfx, node, scale){
            if(!scale) scale = 1; //if scale is abscent, set it to 1

            //We forward the it in the constructor, in order to save it as an object field
            super(gfx, node, function(){
                this.scale = scale //From now on, we can use this.scale
            });
            this.setScale(this.scale); //set the actual scale after set up (its appearance)


            //A nodeshape doesn't render anything, so we must add shapes to it to display
            this.sphere = new VIZ3D.Sphere(gfx, 0.07, 0xff0000);
            this.addShape(this.sphere);

            //Focus on the shape on a click event
            this.onClick(function(data){
                this.focus();
            });
        }

        //This method gets called when either a parent or child node is created
        //In the visualisation
        __createChildNodeShape(node, parent){
            //Calculate the scale we want the node shape to have:
            var scale = parent.scale/parent.getNode().getChildren().length;

            //Create a new instance of your NodeShape and pass the scale
            return new (this.__getClass())(this.getGraphics(), node, scale);
        }

        __connectParent(parent){
            if(parent){ //doesn't have a parent if root
                //Set up the correct location for your node
                //I will simply devide the space equally
                var spaceWidth = 1;   //with scale 1, the children have 600 pixels of space

                //Get the number of children of the parent
                //note parent.getChildren() would return the child shapes,
                //  and not all children have been created yet
                var nodeCount = parent.getNode().getChildren().length;

                //calculate the width for each of the children
                var widthPerChild = spaceWidth/nodeCount;

                //Start at the very left of this space
                //  (with the space being centered on the parent)
                var x = -spaceWidth/2;

                //GetIndex() returns the child index in the parent
                //So this will move the shape to the right, proportional to the index
                x += this.getIndex()*widthPerChild;

                //now we make sure that the node is centered on the space it has available
                x += widthPerChild*0.5;

                //Finally we make sure the offset is relative to the scale
                x *= parent.scale;

                //now that we determined an appropriate x coordinate, we can set the location
                this.setLoc(parent.getX() + x, parent.getY() - 0.2*(parent.scale+this.scale)/2);
            }
        }

        __stateChanged(field, val, oldState){
            if(field=="focused" && val==true){
                this.getGraphics().getCamera().setTargetLoc(this).setTargetScale(this); //focus on shape on focus

                //When we focus on a node, we might want to show more of its descendants
                //And perhaps fewer of the parents
                //Some simple methods are in place to achieve this, the easiest o which is:

                this.showFamily(2, 3);  //shows 2 ancestors and 3 layers of descendants
            }

            //indicate whether the node is showing all children or not
            if(this.sphere)
                this.sphere.setColor(this.state.expanded?0x0000ff:0xff0000);
        }
    }
    class Example3d extends VIZ3D.Visualisation{
        constructor(container, tree, options){
            super(container, tree, options);

            //rotate the camera for fun
            var camera = this.getCamera();
            this.onUpdate(function(){
                camera.getRot().add(0, options.getValue("rotation")/30, 0);
            });

            //add light
            var light = new VIZ3D.PointLight(this, 0xffffff).setLoc(0.1, 0.4, 0).add();
        }
        __getNodeShapeClass(){
            return NodeShape;
        }
        __setupOptions(options){
            //add some random button that cofuses on the root when clicked
            var This = this;
            options.add(new Options.Button("center").onClick(function(){
                This.synchronizeNode("focused", This.getTree().getRoot());
            }));

            //add rotation speed option
            options.add(new Options.Number("rotation", 0.5));
        }
    }

    //attach some data to be displayed on the webpage
    Example3d.description = {
        name: "example3d",
        description: "Some 3d example visualisation",
        image: ""   //should contain some image path relative to the page
    };

    //register the class
    VisualisationHandler.registerVisualisation(Example3d);
})();   //all encased in a function in order to keep variables hidden/local
