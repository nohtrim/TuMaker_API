$(document).ready(function() {
  
  $('<p/>').text("Plugin initialised correctly.").appendTo('#debug').addClass('text-muted');

  // When clicking on the "Upload File" button this event will be executed
	$('#subirFichero').submit(function(event) {
    event.preventDefault();

    // The values of the form will be received and saved in variables
    var nameInput = $('#nombre').val();
    var fileInput = document.getElementById('file');
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('file', file);
    
    var size = file.size;

    // Make sure the user has introduced valid values
    if (file.name.length < 1) {
      alert('Select a file');
    } else if (nameInput.length < 1) {
      alert('Enter a name');
    } else if(size > 5242880) {
      alert("The file is too big.");
    } else {

      // If you do not have any value in the cookie ( the jquery.cookie.js library ) we will connect to the API
      if ($.cookie('el_cookie') == undefined) {
      
        // Method used to request a Token from the API
        /* The process.env variables contain the values given to you by TuMaker. Take into account 
           this is just a small example and writing the passwords directly on the code is unsafe when 
           coding on the server side (PHP, NodeJS…) or sending the values through a form */
        $.ajax({
          url: 'https://dev.api.tumaker.life/auth/token/',
          type: 'post',
          contentType: 'application/x-www-form-urlencoded',
          data: {
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            client_id: process.env.CLIENT_ID,
            grant_type: "password"
          },
        
          success: function (data) {
            
            // The cookie containing the Token is saved for 6 hours        
            var token = data.access_token;
            
            var date = new Date();
            var minutes = 360;
            date.setTime(date.getTime() + (minutes * 60 * 1000));
            $.cookie('el_cookie', token, { expires: date });
              
          },
          // When complete the following function is run
          complete: function () {
            creando_modelo(); 
          }
        })
        .fail(function() {
          // If there is any kind of error during this process the message is shown in Debug
          $('<p/>').text("Error trying to login").appendTo('#debug').addClass('text-red');
        });	
      
      // The model is created in this function
      } else{
        creando_modelo();
      }  
  
      // The model is created in this function
      function creando_modelo(){
        event.preventDefault();
        
        // If there is no value in the cookie the connection to the API will be started
        if ($.cookie('el_cookie') == undefined) {
          $('<p/>').text("This function cannot be executed without being logged in.").appendTo('#debug').addClass('text-red');
        } else {
          
          $('<p/>').text("Creating model...").appendTo('#debug');
    
          $.ajax({
            url: 'https://dev.api.tumaker.life/api/models',
            type: 'post',
            data: {
              display_name: nameInput
            },
            // The Token is sent to the API to prove we have access
            beforeSend: function (xhr) {
              xhr.setRequestHeader('Authorization', 'bearer ' + $.cookie('el_cookie'));
            },
            
            // If everything works the code skuCode will be received and saved in a variable for future use
            success: function (data) {
                
              var sku = data.skuCode;
              formData.append('sku', sku);
              
              $('<p/>').text("Model created.").appendTo('#debug').addClass("text-green");
              console.log(JSON.stringify(data));
              
            },
            // Once the skuCode has been received the following function will be executed to upload the file
            complete: function () {
              subiendo_fichero(); 
            }
          })
          .fail(function() {
            $('<p/>').text("Error trying to create the model.").appendTo('#debug').addClass('text-red');
          });	
        }
      }        

      // Function used to upload the file
      function subiendo_fichero(){
      
        // Make sure the cookie is not empty and the skuCode has been received
        if (($.cookie('el_cookie') == undefined) && (formData.get(sku) == undefined)) {
          $('<p/>').text("Error, no tienes lo necesario para continuar.").appendTo('#debug');
        } else {
          
          // Load the XHR2
          var xhr = new XMLHttpRequest();
          
          $('<p/>').text("Uploading the file…").appendTo('#debug');
          
          // Send the file which was saved at the beginning in (formData) and the skuCode along with the Token authorisation to the URL
          xhr.open('post', 'https://dev.api.tumaker.life/api/models/upload', true);
          xhr.setRequestHeader('Authorization', 'bearer ' + $.cookie('el_cookie'));
          xhr.send(formData);
          
          // The event controller will report whether everything worked correctly
          xhr.addEventListener('readystatechange', function(e) {
            if( this.readyState === 4) {
            
              if(xhr.statusText == 'CREATED'){
                console.log(xhr.statusText);
                $('<p/>').text('File uploaded successfully').appendTo('#debug').addClass("text-green");
              } else {
                console.log(xhr.statusText);
                $('<p/>').text("Error trying to upload the file").appendTo('#debug').addClass('text-red');
              }
            }
          });
        }
      } 
    }
	});
});