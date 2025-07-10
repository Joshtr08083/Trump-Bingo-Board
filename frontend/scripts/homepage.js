import { getJWT, getUserBoard, getBoard, serverLogout, getAllUsers } from "/scripts/server.js?ver=2.3";


document.addEventListener('DOMContentLoaded', async () => {
    const verJWT = await getJWT()

    let username;
    if (verJWT[0] == true) {
        console.log("Logged in!");
        username = verJWT[1];
    }
    else {
        window.location.href = "/pages/guest.html";
    }

    const userBoard = await getUserBoard();
    if (!userBoard) {
      window.alert("Error fetching data, try refreshing or waiting a while");
    }
    
    const tileGrid = new grid(5, 5);
    createTiles.gridBoxArray = tileGrid.gridBoxArray;
    
    new createTiles(userBoard);

    let users = await getAllUsers();
    if (!users) {
      window.alert("Error fetching data, try refreshing or waiting a while");
    }


    users = users.filter(user => user.username !== `${username}`);
    users = users.filter(user => user.username !== `Admin`);
    console.log(users);
    new userGrid(users);
    
});

class grid { // Creates a grid of target boxes, which are where tiles are dragged onto
    constructor(row, col) {
      this.gridBoxArray = [];
      this.boardDiv = document.getElementById("Board");
  
      for (let y = 0; y < col; y++) {
        for (let x = 0; x < row; x++) {
          const box = new targetBox(x, y);
  
          if (x == 2 && y == 2) {
            box.div.setAttribute("id", "BINGO");
            box.div.innerHTML = '<p class="text"><b>FREE<b></p>';
            box.disabled = true;
          }

          this.gridBoxArray.push(box);
          this.boardDiv.appendChild(box.div);
        }
      }
  
    }
  
}
  
class targetBox { // Creates a divider box
  constructor(x, y) {
      this.posX =  x * 20;
      this.posY = y * 20;

      this.div = document.createElement("div");
      this.div.setAttribute('class', 'targetSquares');
      this.div.style.left = this.posX + "%";
      this.div.style.top = this.posY + "%"; 

      this.disabled = false;
  }
}

class createTiles { // Creates grid of tiles
  static gridBoxArray = null;

  constructor(userBoard) {
    // gets divider sizes and positions
    this.boardDiv = document.getElementById("Board");
    this.boardRect = this.boardDiv.getBoundingClientRect();

    this.userBoard = userBoard;

    this.createTiles();
  }

  async createTiles() {

    // Gets tiles data from server
    this.boardData = await getBoard();
    if (!this.boardData) {
      window.alert("Error fetching data, try refreshing or waiting a little while")
    }
    
    console.log(Object.keys(this.boardData).length);
    for (let i = 0; i < Object.keys(this.boardData).length; i++) {
      if (this.userBoard[i]) {
          this.newTile(i);
      }
    }
    
    
  }

  newTile(id) {
      // divTemp is the temporary "template" div that will be cloned and deleted
      const divTile = document.createElement('Div');

  
      // Class is tile, ID is based off number
      divTile.setAttribute('class', 'tile');
  
      // Creates id (it's just a number)
      // const id = `${(y*this.col) + x}`;
      divTile.setAttribute('id', id);

      // Setup text and color
      this.tileStyle(divTile, id);

      // Sets positioning of new tile
      divTile.style.position = 'absolute';
      
     
      try {

        divTile.style.left = createTiles.gridBoxArray[this.userBoard[id]].posX + '%';
        divTile.style.top = createTiles.gridBoxArray[this.userBoard[id]].posY + '%';
      }
      catch (error) {

      }
      

      // Appends to board and creates tile object
      this.boardDiv.appendChild(divTile);
  }

  tileStyle(div, id) {
      div.innerHTML = `<p class='tileText'>${this.boardData[id].text}</p>`;
      div.style.fontSize = '0.8vw'
      div.style.border = "2px solid rgb(36, 30, 29)";
      div.style.color ="rgb(255, 245, 230)";

      if (this.boardData[id].bool == true) {
        div.style.backgroundColor = "#A1C181";
      }
      
      
  }

}

async function logout() {
  sessionStorage.clear();
  await serverLogout();

  window.location.href = "/pages/guest.html"
}

class userGrid {
  constructor(users) {
    this.users = users;

    this.createElements();
  }

  createElements() {
    for (let i =0; i < this.users.length; i++) {
      const div = document.createElement('Div');
      const uname = this.users[i].username;
      div.innerHTML = 
      `<img src="/assets/BoardImg.png" class="boardImg"> <p class="userText">${uname}</p>`

      document.getElementById("container").appendChild(div);

      new userTile(div, uname)
      
    }
  }
}

class userTile {
  constructor(div, name) {
    this.div = div;
    this.name = name;
    
    this.div.addEventListener('click', (this.redirect).bind(this))
  }

  redirect() {
    window.location.href = `/pages/view-board.html?user=${this.name}`
  }
}

document.getElementById("Logout").addEventListener('click', await logout);