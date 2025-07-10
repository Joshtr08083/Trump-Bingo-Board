import { getJWT, getOthersBoard, getBoard} from "/scripts/server.js?ver=2.3";


document.addEventListener('DOMContentLoaded', async () => {
    const verJWT = await getJWT()

if (verJWT[0] == true) {
        console.log("Logged in!")
    }
    else {
        window.location.href = "/pages/guest.html";
    }

    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get('user'); 
    document.getElementById("title").innerHTML = `${name}'s Board`

    const userBoard = await getOthersBoard(name);
    if (!userBoard) {
      window.alert("Error fetching data, try refreshing or waiting a while");
    }
    
    const tileGrid = new grid(5, 5);
    createTiles.gridBoxArray = tileGrid.gridBoxArray;

    new createTiles(userBoard);
    
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



