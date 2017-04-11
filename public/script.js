$(document).ready(function(){

  $("#signup_username").on("keyup", function(){
    let username = $("#signup_username").val();
    var data = {
      username: username
    }
    // console.log(data);
    $.post("/validation_username", data)
      .then(function(reply){
        if(reply===false){
          $("#username_result").text("Someone else has used this username, try again...")
        }else{
          $("#username_result").text("Your username is good")
        }
      })
  })

  $("#signup_email").on("keyup", function(){
    let email = $("#signup_email").val();
    var data = {
      email:email
    }
    $.post("/validation_email", data)
      .then(function(reply){
        if(reply===false){
          $("#email_result").text("Your email is not complete")
        }else{
          $("#email_result").text("Your email is good")
        }
      })
  })
})
