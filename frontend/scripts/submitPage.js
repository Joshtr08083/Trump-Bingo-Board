import { getJWT, createUser } from './server.js?ver=2.3';

async function validateForm() { // Ensures fields are not empty
    let name = document.getElementById("username").value;
    let pass = document.getElementById("password").value;
    if (name == "" || name == " ") {
        window.alert("Username field is empty");
        return false;
    }
    else if (pass == "" || pass == " ") {
        window.alert("Password field is empty");
        return false;
    }

    if (checkbox.checked == false) {
        window.alert("Check off checkbox first");
        return false;
    }
    
    document.getElementById("wait").style.visibility = "visible"; // Overlays box to block user input while api is waiting
    
    
    const submitBoard = sessionStorage.getItem("Submit");
    console.log("Submitting Board: " + submitBoard);

    let logged = await createUser(name, pass, submitBoard); // Server create account request

    if (logged[0] == true) {
        document.getElementById("error").innerHTML = `<p class="text" style="color: rgb(40, 145, 54)"><b>Account Created!</b></p>`; // Success
        setTimeout(() => {window.location.href = "/pages/homepage.html"}, "1000");
    }
    else if (logged[0] == false) {
        const dupeError = `${logged[1]}`.match(/Key \(username\)=\((.*?)\) already exists\./i);
        let msg;
        if (dupeError) {
            msg = `${dupeError[1]} already exists`;
        }
        else {
            msg = logged[1];
        }
        document.getElementById("error").innerHTML = `<p class="text" style="color: rgb(145, 40, 40)"><b>${msg}</b></p>`; // Fail Text
        document.getElementById("wait").style.visibility = "hidden"; // Overlays box to block user input while api is waiting
    }
    else {
        document.getElementById("error").innerHTML = `<p class="text" style="color: rgb(145, 40, 40)"><b>Unexpected Error: ${logged[1]}</b></p>`; // Error Text
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

document.getElementById('submit').addEventListener('click', validateForm);

document.getElementById('eyeball').addEventListener('click', changevisibility) 

const checkbox = document.querySelector('.container input');

checkbox.addEventListener('change', function () {
    if (this.checked) {
        document.querySelector('.container').style.color = "#1d6d2f";
    } else {
        document.querySelector('.container').style.color = "#923636";
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    const verJWT = await getJWT()

    if (verJWT[0] == true) {
        console.log("Logged in!")
        window.location.href = "/pages/homepage.html";
    }

    const submitData = sessionStorage.getItem("Submit");
    if (!submitData) {
        window.location.href = "/pages/create-board.html"
    }
});