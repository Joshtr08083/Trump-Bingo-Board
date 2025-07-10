import { Client } from '@neondatabase/serverless';

const jwt = require('jsonwebtoken');

const cookie = require('cookie');

require('dotenv').config();

const bcrpyt = require('bcryptjs');
const saltContent = 10;

// Queries
const createUserQuery = "INSERT INTO accounts (username, passkey) VALUES ($1, $2);";
const getHashQuery = "SELECT passkey FROM accounts WHERE username = $1";
const getUserQuery = "SELECT id FROM accounts WHERE username = $1";
const addBoardQuery = "INSERT INTO boards(board, owner_id) VALUES ($1, $2)";
const getUsernameQuery = "SELECT username FROM accounts WHERE id = $1";
const getUserBoardQuery = "SELECT board FROM accounts INNER JOIN boards ON boards.owner_id = $1";


export default {
  async fetch(request, environment, ctx) {
	if (request.method === 'OPTIONS') { //some cors thing i dont understand
		return handleCORS(request, new Response(null, { status: 204 }));
	}

	const client = new Client(environment.DATABASE_URL);
	const SECRET_KEY = environment.SECRET_KEY;



	await client.connect();
	

	let response;
	try {
		if (request.method === 'GET') {
			const url = new URL(request.url);
			const pathParams = url.pathname.split('/').filter(Boolean);
			const reqPath = pathParams[0];

			if (reqPath == 'board') {
				// Gets board
				try {
					const { rows }  = await client.query('SELECT text, bool FROM tiles ORDER BY id');


					response = new Response(JSON.stringify({response: rows, success: true}), 
										{status: 200, headers: {'Content-Type' : "application/json"}});

					
				}
				catch (error) {
					response = new Response(JSON.stringify({error: error, success: false}),
											{status: 500, headers: {'Content-Type' : "application/json"}});
				}
			}
			else if (reqPath == 'verify-jwt') {
				try {
					const cookieHeader = request.headers.get('Cookie');
					// Parse cookies from the request headers
					const cookies = cookie.parse(cookieHeader);
					const jwtData = jwt.verify(cookies.jwt, SECRET_KEY);
					const uuid = jwtData.uuid;

					const res = await client.query(getUsernameQuery, [uuid]);
					const name = res.rows[0].username;

					response = new Response(JSON.stringify({authenticated: true, username:name}), {status: 200, headers: {'Content-Type' : 'application/json'}});
					
				} 
				catch (error) {
					console.error(error);
					response = new Response(JSON.stringify({authenticated: false, response: error}), 
											{status: 401, headers: 
												{'Content-Type' : 'application/json'}});
				}
			}
			else if (reqPath == 'all-users') {
				try {
					const { rows } = await client.query('SELECT username FROM accounts ORDER BY id')
					response = new Response(JSON.stringify({response: rows, success: true}), 
											{status: 200, headers: {'Content-Type' : 'application/json'}});
					
				} 
				catch (error) {
					console.error(error);
					response = new Response(JSON.stringify({response: error, success: false}), 
											{status: 401, headers: 
												{'Content-Type' : 'application/json'}});
				}
			}
			else if (reqPath == 'other-user') {
				try {
					const params = new URLSearchParams(url.search);
					const name = params.get('user');

					// Gets user's uuid
					const nameres = await client.query(getUserQuery, [name]);
					const uuid = nameres.rows[0].id;

					// Gets user's board
					const boardres = await client.query(getUserBoardQuery, [uuid]);
					const board = boardres.rows[0].board;

					response = new Response(JSON.stringify({response: board, success: true}), 
									{status: 200, headers: {'Content-Type' : "application/json"}});
				}
				catch (error) {
					console.error(error);
					response = new Response(JSON.stringify({response: error, success: false}), 
											{status: 500, headers: 
												{'Content-Type' : 'application/json'}});
				}
			}
			else {
				response = new Response(JSON.stringify({error: "Invalid table?"}), 
									{status: 400, headers: {'Content-Type' : "application/json"}});
			}
		}
		else if (request.method === 'POST') {
			const url = new URL(request.url);
			const pathParams = url.pathname.split('/').filter(Boolean);
			const action = pathParams[0];
			
			if (action == 'create-user') {
				try {
					// Get name and password in request
					const data = await getBody(request);
					const name = data.name;
					const pass = data.pass;
					const board = data.board;

					// Encrypts password
					const passkey = await bcrpyt.hash(pass, saltContent);
					await client.query(createUserQuery, [name, passkey]);

					const res = await client.query(getUserQuery, [name]);
					const uuid = res.rows[0].id;

					await client.query(addBoardQuery, [board, uuid]);

					const cookieString = generateTokenCookie(uuid, SECRET_KEY, 30);

					// Responnse message
					response = new Response(JSON.stringify({success: true}), 
					{status: 200, headers: {'Content-Type' : "application/json", "Set-Cookie" : cookieString}});
				}
				catch (error) {
					console.error(error);
					// Returns Error
					response = new Response(JSON.stringify({success: false, response: error}), 
					{status: 500, headers: {'Content-Type' : "application/json"}});
				}
			}
			else if (action == 'user-login') {
				// Get name and password in request
				const data = await getBody(request);
				const name = data.name;
				const pass = data.pass;

				const res = await client.query(getHashQuery, [name]); // Get password hash of user

				if (res.rows.length > 0) {
					const passkey = res.rows[0].passkey
					const login = await bcrpyt.compare(pass, passkey);
					if (login) {

						const res = await client.query(getUserQuery, [name]);
						const uuid = res.rows[0].id;

						const cookieString = generateTokenCookie(uuid, SECRET_KEY, 30);
						
						
						response = new Response(JSON.stringify({response:"Login success", success: true}), 
						{status: 200, headers: {'Content-Type' : "application/json", 'Set-Cookie' : cookieString}});
					}
					else {
						response = new Response(JSON.stringify({response:"Invalid Username or Password", success: false}), 
						{status: 401, headers: {'Content-Type' : "application/json"}});
					}
				}
				else {
					response = new Response(JSON.stringify({error:error, response:"Invalid Username or Password", success: false}), 
						{status: 401, headers: {'Content-Type' : "application/json"}});
				}
			}
			else if (action == 'logout') {
				try {
					const cookieString = generateTokenCookie("0", SECRET_KEY, -1);
					response = new Response(JSON.stringify({response: "Logout successful", success: true}), 
									{status: 200, headers: {'Content-Type' : "application/json", "Set-Cookie" : cookieString}});
					
				}
				catch (error) {
					console.error(error);
					response = new Response(JSON.stringify({response: error, success: false}), 
											{status: 401, headers: 
												{'Content-Type' : 'application/json'}});
				}
			}
			else if (action == 'user-board') {
				try {
					const cookieHeader = request.headers.get('Cookie');
					// Parse cookies from the request headers
					const cookies = cookie.parse(cookieHeader);
					// Decodes and verifies jwt data
					const jwtData = jwt.verify(cookies.jwt, SECRET_KEY);
					// Gets uuid
					const uuid = jwtData.uuid;
					// Gets username
					const res = await client.query(getUserBoardQuery, [uuid]);
					const board = res.rows[0].board;

					response = new Response(JSON.stringify({response: board, authenticated: true}), 
									{status: 200, headers: {'Content-Type' : "application/json"}});
				}
				catch (error) {
					console.error(error);
					response = new Response(JSON.stringify({response: error, authenticated: false}), 
											{status: 401, headers: 
												{'Content-Type' : 'application/json'}});
				}
			}
			else if (action == 'verify-admin') {
				try {
					const cookieHeader = request.headers.get('Cookie');
					// Parse cookies from the request headers
					const cookies = cookie.parse(cookieHeader);
					const jwtData = jwt.verify(cookies.jwt, SECRET_KEY);
					const uuid = jwtData.uuid;

					const res = await client.query(getUsernameQuery, [uuid]);
					const name = res.rows[0].username;

					if (name !== 'Admin') {
						throw new Error("Not authenticated");
					}

					response = new Response(JSON.stringify({authenticated: true}), {status: 200, headers: {'Content-Type' : 'application/json'}});
					
				} 
				catch (error) {
					console.error(error);
					response = new Response(JSON.stringify({authenticated: false, response: error}), 
											{status: 401, headers: 
												{'Content-Type' : 'application/json'}});
				}
			}
			else if (action == 'update-board') {
				try {

					const cookieHeader = request.headers.get('Cookie');
					// Parse cookies from the request headers
					const cookies = cookie.parse(cookieHeader);
					const jwtData = jwt.verify(cookies.jwt, SECRET_KEY);
					const uuid = jwtData.uuid;

					const res = await client.query(getUsernameQuery, [uuid]);
					const name = res.rows[0].username;

					if (name !== 'Admin') {
						throw new Error("Not authenticated");
					}

					const data = await getBody(request);
					const changes = data.data;
					console.log(changes);
					for (let i = 0; i < changes.length; i++) {
						
						const jsonData = JSON.parse(changes[i])
						await client.query(`UPDATE tiles SET bool = ${jsonData.bool} WHERE id = ${jsonData.id+1}`);
					}

					response = new Response(JSON.stringify({response: "Successfully updated board data", success: true}), {status: 200, headers: {'Content-Type' : 'application/json'}});
					
				} 
				catch (error) {
					console.error(error);
					response = new Response(JSON.stringify({response: error, success: false}), 
											{status: 500, headers: 
												{'Content-Type' : 'application/json'}});
				}
			}
			else {
				response = new Response(JSON.stringify({error: "Invalid action for POST"}), 
				{status: 400, headers: {'Content-Type' : "application/json"}});
			}
		}
		
		else {
			response = new Response(JSON.stringify({error: "Method is not allowed"}),
													{status: 405, headers: {'Content-Type' : "application/json"}});
		}

	}
	catch (error) {
		console.error('Database error: ', error);
		response = new Response(JSON.stringify({error: `Internal Server Error: Data base error. ${error}`}), 
								{status: 500, headers: {'Content-Type':'application/json'}});
	}
    
	ctx.waitUntil(client.end());
    return handleCORS(request, response);
  }
}


async function getBody(req) {
	try {
		const requestBody = req.clone();

		if (req.body === null) {
			return null;
		}

		const body = await requestBody.json();
		return body
	}
	catch (error) {
		console.error(error);
		return null;
	}
}

function generateTokenCookie(uuid, SECRET_KEY, expday) {
	const payload = {
		uuid: uuid,
	};

	const token = jwt.sign(payload, SECRET_KEY, {expiresIn: '1d'});

	const expires = new Date(new Date().getTime() + expday * 24 * 60 * 60 * 1000).toUTCString();
	const cookieString = cookie.serialize('jwt', token, {
		httpOnly: true,
		// secure: true,
		// sameSite: 'none',
		path: '/',
		expires: new Date(expires)
	});

	return cookieString;
}

function handleCORS(request, response) {
	// Get the Origin request header
	const origin = request.headers.get('Origin') || '';

	// Create a new response with CORS headers
	const corsHeaders = {
		'Access-Control-Allow-Origin': origin,
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400', // 24 hours
		'Access-Control-Allow-Credentials': 'true', // Allow credentials
	};

	// Clone the response and add CORS headers
	const corsResponse = new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: { ...Object.fromEntries(response.headers), ...corsHeaders }
	});

	return corsResponse;
}