$(function(){

  //Collapsing and appearing the information section
  $(".collapse").click(function(){
    $(".visualization-page").attr("id", "information-collapse");
  })
  $(".appear").click(function(){
    $(".visualization-page").attr("id", "information-appear");
  })

  //Going from two to four visualization areas and vice versa
  $(".two-button").click(function(){
    $("body").attr("id", "two");
  });
  $(".four-button").click(function(){
    $("body").attr("id", "four");
  });

  //Resizing of the visualization areas
  $(".layout").resizeContainer({vertical:true});
  $(".top-layout-part, .bottom-layout-part").resizeContainer({vertical:false});

})
