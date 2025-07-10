import { getJWT, getBoard } from "./server.js?ver=2.3";

const GRID_SIZE = [5, 5]; // Rows and Columns (I really wouldn't change these)

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

  constructor(col) {
    // gets divider sizes and positions
    this.tilesGridDiv = document.getElementById("tilesGrid");
    this.tilesGridBoxDiv = document.getElementById("tilesGridBox");
    this.boardDiv = document.getElementById("Board");
    this.boardRect = this.boardDiv.getBoundingClientRect();

    this.col = col;

    this.createTiles();
  }

  async createTiles() {
    //Set Grid rows and columns
    this.tilesGridDiv.style.gridTemplateColumns = `repeat(${this.col}, 1fr)`;

    // Gets tiles data from server
    this.boardData = await getBoard();
    if (!this.boardData) {
      window.alert("Error fetching data, try refreshing or waiting a little while")
    }
    
    for (let i = 0; i < Object.keys(this.boardData).length; i++) {
      this.newTile(i);
      
    }

    // Removes tile grid div and the divtemps that's no longer needed
    const boxRect = this.tilesGridBoxDiv.getBoundingClientRect()
    this.tilesGridBoxDiv.style.height = boxRect.height + "px";
    this.tilesGridBoxDiv.style.width = boxRect.width + "px";

    this.tilesGridDiv.remove();
  }

  newTile(id) {
    
      // divTemp is the temporary "template" div that will be cloned and deleted
      const divTemp = document.createElement('Div');

  
      // Class is tile, ID is based off number
      divTemp.setAttribute('class', 'tile');
  
      // Creates id (it's just a number)
      // const id = `${(y*this.col) + x}`;
      divTemp.setAttribute('id', id);

      // Setup text and color\
      this.tileStyle(divTemp, id);

      // Align according to grid parent
      this.tilesGridDiv.appendChild(divTemp);

      
      // Get scroll offset
      const scrollOffset = window.pageYOffset || document.documentElement.scrollTop;
      
      // Gets relative positioning from board (this is so it can be used as a child of the board element)
      const rect = divTemp.getBoundingClientRect();
      const boardRect = this.boardDiv.getBoundingClientRect();
      
      // Calculate position accounting for scroll
      const leftPos = pxToVw(rect.left - boardRect.left);
      const topPos = pxToVw((rect.top + scrollOffset) - (boardRect.top + scrollOffset));
      
      // Clones node to real div
      const divTile = divTemp.cloneNode(true);

      // Sets positioning of new tile
      divTile.style.position = 'absolute';
      
      // inBox is used to track if the tile is within a box
      let inBox = -1;

      try {
        const data = JSON.parse(localStorage.getItem(`${id}`)); // Gets data of tile from local storage

        if (data.inBox >= 0) {
          inBox = data.inBox;
          divTile.style.backgroundColor = "rgb(100, 83, 80)";

          divTile.style.left = createTiles.gridBoxArray[data.inBox].posX + '%';
          divTile.style.top = createTiles.gridBoxArray[data.inBox].posY + '%';

          createTiles.gridBoxArray[data.inBox].disabled = true;
          
        }
        else {
          divTile.style.top = data.top;
          divTile.style.left = data.left;
        }

        
      }
      catch {
        // Defaults to grid position if data isn't found
        divTile.style.left = `${leftPos}vw`; 
        divTile.style.top = `${topPos}vw`;
      }

      // Appends to board and creates tile object
      this.boardDiv.appendChild(divTile);
      new draggableTile(divTile, inBox);
  }

  tileStyle(div, id) {
      // Placeholder text
      div.innerHTML = `<p class='tileText'>${this.boardData[id].text}</p>`;
      div.style.fontSize = '0.8vw'


      div.style.backgroundColor ="rgb(68, 57, 56)";
      div.style.border = "2px solid rgb(36, 30, 29)"
      div.style.color ="rgb(255, 245, 230)";
  }

}

class draggableTile {
  static tileArray = new Array;
  static gridBoxArray = new Array;

  constructor(tileElement, inBox) {
      this.tile = tileElement;
      this.offsetX = 0;
      this.offsetY = 0;
      this.inBox = inBox;
      this.scrollOffset = 0;
      this.mx = 0;
      this.my = 0;

      this.grid = document.getElementById("Board");
      this.tile.onmousedown = this.dragMouseDown.bind(this);

      draggableTile.tileArray.push(this);

  }

  dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();

      this.moveToFront();

      if (this.inBox >= 0) {
        draggableTile.gridBoxArray[this.inBox].disabled = false;
      }

      // Calculate mouse
      this.getMouse(e);
      //calculate offset from tile position to mouse
      this.offsetX = parseInt(window.getComputedStyle(this.tile).left, 10) - e.clientX;
      this.offsetY = parseInt(window.getComputedStyle(this.tile).top, 10) - e.clientY - this.scrollOffset;
    

      // Attach move and up events
      document.onmousemove = this.elementDrag.bind(this);
      document.onmouseup = this.closeDragElement.bind(this);
      
  }

  elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      
      this.gridBox = this.grid.getBoundingClientRect();
      this.getMouse(e);

      if (this.isOutsideGrid(this.grid)) {
        this.tile.style.transitionDuration = "5ms";

        this.moveOutsideGrid(e);
      
      } else {
          this.snapToGridSquare(e);
          
      }
  }

  isMouseOverSquare(bound) {
    
    return this.mx >= bound.left && 
          this.mx <= bound.right &&
          this.my >= (bound.top + this.scrollOffset) &&
          this.my <= (bound.bottom + this.scrollOffset);
  }

  isOutsideGrid() {
      this.tile.style.backgroundColor ="rgb(68, 57, 56)";
      return this.mx < this.gridBox.left || 
            this.mx > this.gridBox.right ||
            this.my < (this.gridBox.top  + this.scrollOffset) ||
            this.my > (this.gridBox.bottom + this.scrollOffset);
  }

  moveOutsideGrid(e) {
      this.getMouse(e);

      this.tile.style.top = (this.my + this.offsetY) + "px";
      this.tile.style.left = (this.mx + this.offsetX) + "px";

      this.inBox = -1;
  }

  snapToGridSquare(e) {
      this.getMouse(e);
      this.tile.style.backgroundColor ="rgb(68, 57, 56)";
      for (let i = 0; i < draggableTile.gridBoxArray.length; i++) {
          const bound = draggableTile.gridBoxArray[i].div.getBoundingClientRect();
          
          if (this.isMouseOverSquare(bound)) {
            
              if (draggableTile.gridBoxArray[i].disabled) { // Checks if square is disabled
                  this.tile.style.transitionDuration = "5ms";
                  this.moveOutsideGrid(e);

              } else {
                  this.tile.style.backgroundColor = "rgb(100, 83, 80)";
                  this.tile.style.transitionDuration = "100ms"; // Slows animation
                  this.tile.style.left = draggableTile.gridBoxArray[i].posX +  "%"; // Sets position to target
                  this.tile.style.top = draggableTile.gridBoxArray[i].posY + "%";
                  
                  this.inBox = i; 
              }
              break;
          }
      }
  }

  closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
      
      if (this.inBox >= 0) {
        draggableTile.gridBoxArray[this.inBox].disabled = true;  // Disables box so others can't snap to it
      }
      localStorage.setItem(this.tile.id, JSON.stringify({left: this.tile.style.left, top: this.tile.style.top, inBox: this.inBox}));
  } 

  getMouse(e) {
    this.scrollOffset = window.pageYOffset;

    this.mx = e.clientX;
    this.my = e.clientY + this.scrollOffset;

  }
  
  moveToFront() {
    // Keeps the latest moved tile on top
    draggableTile.tileArray.splice(draggableTile.tileArray.indexOf(this), 1); // Removes tile id from list
    draggableTile.tileArray.push(this); // Adds it to the end

    for (let i = 0; i < draggableTile.tileArray.length; i++) {
      draggableTile.tileArray[i].tile.style.zIndex = `${i+2}`;
    }
  }

}

function pxToVw(px) { // Converts px to vw
  const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  return (100 * px) / viewportWidth;
}

class boardManger {
  constructor(GRID_SIZE) {
    this.mainGrid = new grid(GRID_SIZE[0], GRID_SIZE[1]);
    draggableTile.gridBoxArray = this.mainGrid.gridBoxArray;
    createTiles.gridBoxArray = this.mainGrid.gridBoxArray;
    this.mainTiles = new createTiles(10); // 10 items per row

    document.getElementById('reset').addEventListener('click', this.reset.bind(this));
    document.getElementById('submit').addEventListener('click', this.submit.bind(this));
  }

  reset() {
    // Re-enables grid boxes
    for (let i = 0; i < this.mainGrid.gridBoxArray.length; i++) {
      this.mainGrid.gridBoxArray[i].disabled = false;
    }

    this.mainTiles = null;
    draggableTile.tileArray = [];

    // Creates new grid
    const tilesGridDiv = document.createElement('div');
    tilesGridDiv.setAttribute('id', 'tilesGrid');
    document.getElementById("tilesGridBox").appendChild(tilesGridDiv);

    const tiles = document.querySelectorAll('.tile');
    for (const t of tiles) {
      t.remove();
    }
    localStorage.clear();

    this.mainTiles = new createTiles(10); // 10 items per row

    // Disables middle square
    this.mainGrid.gridBoxArray[12].disabled = true;
  }

  submit() {
      let boxes = '{';
      for (let t of draggableTile.tileArray) {
        if (t.inBox >= 0) {
          boxes += `"${t.tile.id}":"${t.inBox}",`; 
        }
      }
      const submitData = (boxes.slice(0, -2) + '"}');

      // Confirms board is filled out
      if (Object.keys(boxes).length < 24) {
        window.alert("Please fill out board completely before submitting.")
        return;
      }

      // Sets local storage
      sessionStorage.setItem("Submit", submitData)

      window.location.href = '/pages/submit.html'
  }
}

  
function checkBingo(boxes) {
  let row = [0, 0, 1, 0, 0];
  let col = [0, 0, 1, 0, 0];
  let diagonalLeft = 1;
  let diagonalRight = 1;
  let bingo = false;

  // Gets row and column positions
  for (let i of Object.keys(boxes)) {
    const box = parseInt(i)+1;
    if ([1, 7, 19, 25].includes(box)) { // Checks if in diagonal left
      diagonalLeft += 1;
    }
    else if ([5, 9, 17, 21].includes(box)) { // Checks if in right diagonal
      diagonalRight += 1;
    }
    row[((Math.round((box/5) + 0.49)) - 1)] += 1; // Calculates its row (scufffed math but works)
    col[(box % 5 == 0 ? 5: box % 5) - 1] += 1; // Calculates its column
  } 
  
  console.log(`Rows: ${row}\nColumns: ${col}\nDiagonalLeft: ${diagonalLeft}\nDiagonalRight: ${diagonalRight}`);

  // Checks for bingo
  for (let i of row) {
    if (i >= 5) {
      bingo = true;
      break;
    }
  }
  for (let i of col) {
    if (i >= 5) {
      bingo = true;
      break;
    }
  }
  if (diagonalLeft >= 5) {
    bingo = true;
  }
  else if (diagonalRight >= 5) {
    bingo = true;
  }

  if (bingo) {
    console.log("Bingo")
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const verJWT = await getJWT()

if (verJWT[0] == true) {
      console.log("Logged in!")
      window.location.href = "/pages/homepage.html";
  }

  const manager = new boardManger(GRID_SIZE)
});