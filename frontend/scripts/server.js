const api_url = "https://worker.joshtr.org" // Use this one
// const api_url = "http://127.0.0.1:8787" // Testing only

export async function login(name, pass) {
    if (typeof name !== 'string' || !name.trim()) {
        console.error('Invalid name parameter');
        return null;
    }

    const username = encodeURIComponent(name);

    if (typeof pass !== 'string' || !pass.trim()) {
        console.error('Invalid pass parameter');
        return null;
    }

    const password = encodeURIComponent(pass);

    const query = `${api_url}/user-login`; // Setups query using url
    try {
        const response = await fetch(query, { // makes request to server
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify({"name":`${username}`, "pass":`${password}`}),
            credentials: 'include'
        });
        
        const data = await response.json(); // Gets response

        if (data.success  == true) { // .success determines if login was successful
            sessionStorage.setItem("loggedIn", JSON.stringify({val:({bool:true, uname:name}), exp: Date.now()}));
            return [true, data.JWT]; // .JWT is the token passed on if the login was successful
        }
        else {
            return [false, null]; // Failed login attempt
        }
    }
    catch (error) {
        console.log(`${error}`);
        return [null, error]; // Error
    }
}

export async function getJWT() {
    const loggedIn = sessionStorage.getItem("loggedIn");
    if (loggedIn) {
        const { val, exp } = JSON.parse(loggedIn);

        if (Date.now() - exp < 600 * 1000) {
            
            console.log("Skipping server JWT fetch")

            if (val.bool == true) {
                return [true, val.uname];
            }
            else if (val.bool == false) {
                return [false, null];
            }
        }
    }
    const query = `${api_url}/verify-jwt`;

    try {
        const response = await fetch(query, { // makes request to server
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json'
            },
            credentials: 'include'
        });
        
        const data = await response.json(); // Gets response

        if (data.authenticated == true) {
            sessionStorage.setItem("loggedIn", JSON.stringify({val:({bool:true, uname:data.username}), exp: Date.now()}));
            return [true, data.username]; 
        }
        else {
            sessionStorage.setItem("loggedIn", JSON.stringify({val:({bool:false, uname:null}), exp: Date.now()}));
            console.log(data.response);
            return [false, data.response];
        }
    }
    catch (error) {
        sessionStorage.setItem("loggedIn", JSON.stringify({val:({bool:false, uname:null}), exp: Date.now()}));
        console.log(`${error}`);
        return [false, error]; 
    }
    

    
}

export async function createUser(name, pass, board) {
    if (typeof name !== 'string' || !name.trim()) {
        console.error('Invalid name parameter');
        return null;
    }

    const username = encodeURIComponent(name);

    if (typeof pass !== 'string' || !pass.trim()) {
        console.error('Invalid pass parameter');
        return null;
    }

    const password = encodeURIComponent(pass);

    const query = `${api_url}/create-user`;

    try {
        const response = await fetch(query, { // makes request to server
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify({"name":`${name}`, "pass":`${pass}`, "board":`${board}`}),
            credentials: 'include'
        });
        
        const data = await response.json(); // Gets response

        if (data.success  == true) {
            sessionStorage.setItem("loggedIn", JSON.stringify({val:({bool:true, uname:username}), exp: Date.now()}));
            return [true, null]; 
        }
        else {
            return [false, data.response.detail];
        }
    }
    catch (error) {
        console.log(`${error}`);
        return [null, error]
    }
}

export async function getBoard() {
    const boardData = sessionStorage.getItem('boardData');
    if (boardData) {
        const { data, exp } = JSON.parse(boardData);

        if (Date.now() - exp < 600 * 1000) {
            console.log("Skipping board server fetch");
            return data;
        }
        
    }

    const query = `${api_url}/board`

    try {
        const response = await fetch(query, {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            sessionStorage.setItem('boardData', JSON.stringify({data: data.response, exp: Date.now() }));
            return data.response;
        }
        return null;        
    }
    catch (error) {
        console.error(`${error}`);
        return null
    }
    
}

export async function getUserBoard() {
    const userBoardData = sessionStorage.getItem('userBoardData');
    if (userBoardData) {
        const { data, exp } = JSON.parse(userBoardData);

        if (Date.now() - exp < 3600 * 1000) {
            console.log("Skipping user board server fetch (It can't change, why would I check)");
            return data;
        }
        
    }

    const query = `${api_url}/user-board`

    try {
        const response = await fetch(query, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.authenticated ==  true) {
            sessionStorage.setItem('userBoardData', JSON.stringify({data: data.response, exp: Date.now() }));
            return data.response;
        }
        return null;
        
    }
    catch (error) {
        sessionStorage.removeItem('userBoardData');
        console.error(`${error}`);
        return null;
    }
}

export async function serverLogout() {
    const query = `${api_url}/logout`
    try {
        const response = await fetch(query, { // makes request to server
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            credentials: 'include'
        });
        
        const data = await response.json(); // Gets response

        if (data.success  == true) { 
            sessionStorage.setItem("loggedIn", false);
            return [true, null]; // .JWT is the token passed on if the login was successful
        }
        else {
            return [null, data.response]; // Failed login attempt
        }
    }
    catch (error) {
        console.log(`${error}`);
        return [null, error]; // Error
    }
}

export async function getAllUsers() {
    const allUserData = sessionStorage.getItem('allUserData');
    if (allUserData) {
        const { data, exp } = JSON.parse(allUserData);

        if (Date.now() - exp < 3600 * 1000) {
            console.log("Skipping all users fetch");
            return data;
        }
    }

    const query = `${api_url}/all-users`

    try {
        const response = await fetch(query, {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success == true) {
            sessionStorage.setItem('allUserData', JSON.stringify({data: data.response, exp: Date.now() }));
            return data.response;
        }

        return null;
        
    }
    catch (error) {
        sessionStorage.removeItem('allUserData');
        console.error(`${error}`);
        return null
    }
}

export async function getOthersBoard(name) {
    if (typeof name !== 'string' || !name.trim()) {
        console.error('Invalid name parameter');
        return null;
    }

    const username = encodeURIComponent(name);

    const otherBoardData = sessionStorage.getItem(`${username}`);
    if (otherBoardData) {
        const { data, exp } = JSON.parse(otherBoardData);

        if (Date.now() - exp < 3600 * 1000) {
            console.log("Skipping other user's board check");
            return data;
        }
        
    }

    const query = `${api_url}/other-user?user=${username}`

    try {
        const response = await fetch(query, {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json'
            }
        });

        const data = await response.json();

        if (data.success == true) {
            sessionStorage.setItem(`${username}`, JSON.stringify({data: data.response, exp: Date.now() }));
            return data.response;
        }

        return null;
        
    }
    catch (error) {
        sessionStorage.removeItem(`${username}`);
        console.error(`${error}`);
        return null
    }
}

export async function verifyAdmin() {
    const query = `${api_url}/verify-admin`;

    try {
        const response = await fetch(query, { // makes request to server
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            credentials: 'include'
        });
        
        const data = await response.json(); // Gets response

        if (data.authenticated == true) {
            return true; 
        }
        else {
            console.log(data.response);
            return false;
        }
    }
    catch (error) {
        console.log(`${error}`);
        return false;
    }
    

    
}

export async function updateBoard(changes) {
    const query = `${api_url}/update-board`;

    try {
        const response = await fetch(query, {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            
            body: JSON.stringify({"data":changes}),
            credentials: 'include'
            
        });

        const data = await response.json();

        return [data.success, data.response];
           
    }
    catch (error) {
        console.error(`${error}`);
        return [false, error];
    }
}