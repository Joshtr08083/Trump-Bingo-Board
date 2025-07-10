import { verifyAdmin, serverLogout, getBoard, updateBoard } from "./server.js?ver=2.3";

document.addEventListener("DOMContentLoaded", async () => {
    const verAdmin = await verifyAdmin();
    if (verAdmin !== true) {
        await logout();
    }

    const boardData = await getBoard();

    new boardController(boardData);
});

async function logout() {
  sessionStorage.clear();
  await serverLogout();

  window.location.href = "/pages/guest.html"
}

document.getElementById("Logout").addEventListener('click', await logout);

class boardController {
  constructor(boardData) {
    this.boardData = boardData;
    this.tiles = new Array;

    for (let i = 0; i < Object.keys(boardData).length; i++) {
      this.tiles.push(new tile(boardData[i]));
    }

    document.getElementById("Submit").addEventListener('click', (this.submit).bind(this));
  }

  async submit() {
    document.getElementById("wait").style.visibility = 'visible';
    let changes = [];
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.boardData[i].bool !== this.tiles[i].bool) {
        const obj = {id: i, bool: this.tiles[i].bool}
        changes.push(JSON.stringify(obj));
      }
    }
    
    if (changes.length == 0) {
      sessionStorage.removeItem('boardData');
      const respText = document.getElementById("Response")
      respText.style.color = "rgb(105, 30, 30)";
      respText.innerHTML = 'No change, reloading...';
      setTimeout(() => {window.location.reload()}, 1000);
      return;
    }

    sessionStorage.removeItem('boardData');
    const update = await updateBoard(changes);

    const respText = document.getElementById("Response")
    if (update[0] == true) {
      respText.style.color = "rgb(30, 105, 40)";
    }
    else {
      respText.style.color = "rgb(105, 30, 30)";
    }

    respText.innerHTML = `${update[1]}`;
    setTimeout(() => {window.location.reload()}, 1000);
  }
}

class tile {
  static gridDiv = document.getElementById('container');
  
  constructor(tileData) {
    this.div = document.createElement("Div");

    this.div.innerHTML = `<p class="tileText">${tileData.text}</p>`
    this.tileData = tileData;
    this.bool = tileData.bool;
      
      if (tileData.bool == true) {
        this.div.style.backgroundColor = "#A1C181";
      }
      else {
        this.div.style.backgroundColor = "#645350";
      }

      tile.gridDiv.appendChild(this.div);

      this.div.addEventListener('click', this.activate.bind(this));
  }

  activate() {
    if (this.bool == true) {
      this.div.style.backgroundColor = "#645350";
      this.bool = false;
      
    }
    else {
      this.div.style.backgroundColor = "#A1C181";
      this.bool = true;
    }
  }
}