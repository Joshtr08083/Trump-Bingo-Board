import { getJWT, login } from './server.js?ver=2.3';

async function validateForm() { // Ensures fields are not empty
    let name = document.getElementById("username").value;
    let pass = document.getElementById("password").value;
    if (name == "") {
        window.alert("Username field is empty");
        return false;
    }
    else if (pass == "") {
        window.alert("Password field is empty");
        return false;
    }
    
    document.getElementById("wait").style.visibility = "visible"; // Overlays box to block user input while api is waiting
    
    let logged = await login(name, pass); // Server login request

    if (logged[0] == true) { // Checks if login is a success
        document.getElementById("error").innerHTML = `<p class="text" style="color:rgb(67, 128, 32)"><b>Login Success</b></p>`; // Success Text
        
        if (name == 'Admin') {
            setTimeout(() => {window.location.href = "/pages/admin.html"}, "1000");
        }
        else {
            setTimeout(() => {window.location.href = "/pages/homepage.html"}, "1000");
        }
        
    }
    else if (logged[0] == false) {
        document.getElementById("error").innerHTML = `<p class="text" style="color: rgb(145, 40, 40)"><b>Invalid Username or Password</b></p>`; // Fail Text
        document.getElementById("wait").style.visibility = "hidden"; // Overlays box to block user input while api is waiting
    }
    else { // if null
        document.getElementById("error").innerHTML = `<p class="text" style="color: rgb(145, 40, 40)"><b>Unexpected Internal Error<br>(${logged[1]})</b></p>`; // Error text
        document.getElementById("wait").style.visibility = "hidden"; // Overlays box to block user input while api is waiting
    }

    
}

function keydown(field, event) {
    if(event.key == 'Enter') { // On enter key in input field
        if (field == 'uname') {
            if (document.getElementById("password").value !== "") {
                validateForm(); // Submits form
            }
            else { // Switches to next input field
                var target = document.getElementById('password');
                target.focus(); 
                target.select();
            }
        }
        else if (field == 'pass') {
            if (document.getElementById("username").value !== "") {
                validateForm(); // Submits form
            }
        }
    }
}

function changevisibility() {
    const eyeball = document.getElementById("eyeball");
    const regex = /\.*\/vis-off\.svg/i;
    if (regex.test(eyeball.src) == true) {
        eyeball.src = "/assets/vis-on.svg"
        document.getElementById("password").type = "text";
    }
    else {
        eyeball.src = "/assets/vis-off.svg"
        document.getElementById("password").type = "password";
    }
}

document.getElementById('username').addEventListener('keydown', event => {keydown('uname', event)});

document.getElementById('password').addEventListener('keydown', event => {keydown('pass', event)});

document.getElementById('login').addEventListener('click', validateForm);

document.getElementById('eyeball').addEventListener('click', changevisibility) 

document.addEventListener("DOMContentLoaded", async () => {
    const verJWT = await getJWT()

if (verJWT[0] == true) {
        console.log("Logged in!")
        window.location.href = "/pages/homepage.html";
    }

});